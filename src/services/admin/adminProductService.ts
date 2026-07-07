import { supabase } from "@/lib/supabase/client";
import { ProductType, ProductImageType } from "@/types";

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  image?: string;
  images?: string[];
  stock: number;
  sku?: string;
  category_id?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  updated_at?: string;
}

export interface ProductWithDetails extends ProductType {
  category?: {
    id: number;
    name: string;
  };
  total_reviews?: number;
  average_rating?: number;
}

export const adminProductService = {
  async getAllProducts(): Promise<ProductWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
					*,
					categories!products_category_id_fkey (
						id,
						name
					),
					product_images (
						id,
						url,
						sort_order
					)
				`,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all products:", error);
        throw error;
      }

      const productsWithStats = await Promise.all(
        (data || []).map(async (product) => {
          const { data: reviewStats } = await supabase
            .from("reviews")
            .select("rating")
            .eq("product_id", product.product_id);

          const reviews = reviewStats || [];
          const totalReviews = reviews.length;
          const averageRating =
            totalReviews > 0
              ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews
              : 0;

          return {
            ...product,
            category: product.categories,
            images: (product.product_images || []).sort(
              (a: ProductImageType, b: ProductImageType) => a.sort_order - b.sort_order,
            ),
            total_reviews: totalReviews,
            average_rating: Number(averageRating.toFixed(1)),
          };
        }),
      );

      return productsWithStats;
    } catch (err) {
      console.error("Failed to get all products:", err);
      throw err;
    }
  },

  async createProduct(productData: CreateProductData): Promise<ProductType> {
    try {
      const { images, ...productFields } = productData;

      const { data, error } = await supabase
        .from("products")
        .insert({
          ...productFields,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
        throw error;
      }

      // Upload images and insert into product_images
      if (images && images.length > 0) {
        const imageRows = images.map((url, index) => ({
          product_id: data.product_id,
          url,
          sort_order: index,
        }));

        const { error: imgError } = await supabase
          .from("product_images")
          .insert(imageRows);

        if (imgError) {
          console.error("Error inserting product images:", imgError);
        }

        // Set the first image as the cover
        const { error: updateError } = await supabase
          .from("products")
          .update({
            image: images[0],
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", data.product_id);

        if (updateError) {
          console.error("Error updating product cover image:", updateError);
        }
      }

      return data;
    } catch (err) {
      console.error("Failed to create product:", err);
      throw err;
    }
  },

  async updateProduct(
    productId: string,
    productData: UpdateProductData,
  ): Promise<ProductType> {
    try {
      const { images, ...productFields } = productData;

      const { data, error } = await supabase
        .from("products")
        .update({
          ...productFields,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", productId)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
        throw error;
      }

      // Handle image updates if provided
      if (images) {
        // Delete existing images from storage
        const { data: existingImages } = await supabase
          .from("product_images")
          .select("url")
          .eq("product_id", productId);

        if (existingImages) {
          for (const img of existingImages) {
            const path = img.url.split("/product-images/")[1];
            if (path) {
              await supabase.storage.from("product-images").remove([path]);
            }
          }
        }

        // Replace all product_images rows
        await supabase.from("product_images").delete().eq("product_id", productId);

        const imageRows = images.map((url, index) => ({
          product_id: productId,
          url,
          sort_order: index,
        }));

        const { error: imgError } = await supabase
          .from("product_images")
          .insert(imageRows);

        if (imgError) {
          console.error("Error inserting product images:", imgError);
        }

        // Update cover image
        const { error: updateError } = await supabase
          .from("products")
          .update({
            image: images[0] || null,
            updated_at: new Date().toISOString(),
          })
          .eq("product_id", productId);

        if (updateError) {
          console.error("Error updating product cover image:", updateError);
        }
      }

      return data;
    } catch (err) {
      console.error("Failed to update product:", err);
      throw err;
    }
  },

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      // Delete associated images from storage
      const { data: productImages } = await supabase
        .from("product_images")
        .select("url")
        .eq("product_id", productId);

      if (productImages) {
        for (const img of productImages) {
          const path = img.url.split("/product-images/")[1];
          if (path) {
            await supabase.storage.from("product-images").remove([path]);
          }
        }
      }

      const { error } = await supabase
        .from("products")
        .delete()
        .eq("product_id", productId);

      if (error) {
        console.error("Error deleting product:", error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      throw err;
    }
  },

  // Upload a single product image to storage and return the public URL
  async uploadProductImage(
    productId: string,
    file: File,
  ): Promise<string | null> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading product image:", uploadError);
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      return publicUrlData?.publicUrl || null;
    } catch (err) {
      console.error("Failed to upload product image:", err);
      return null;
    }
  },

  // Upload multiple images and return array of public URLs
  async uploadProductImages(
    productId: string,
    files: File[],
  ): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.uploadProductImage(productId, file);
      if (url) {
        urls.push(url);
      }
    }
    return urls;
  },

  async updateStock(productId: string, newStock: number): Promise<ProductType> {
    try {
      const { data, error } = await supabase
        .from("products")
        .update({
          stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("product_id", productId)
        .select()
        .single();

      if (error) {
        console.error("Error updating product stock:", error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Failed to update product stock:", err);
      throw err;
    }
  },

  async getLowStockProducts(threshold: number = 10): Promise<ProductType[]> {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lt("stock", threshold)
        .order("stock", { ascending: true });

      if (error) {
        console.error("Error fetching low stock products:", error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error("Failed to get low stock products:", err);
      return [];
    }
  },

  async getProductAnalytics() {
    try {
      const { count: totalProducts } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      const { data: categoryCounts } = await supabase.from("products").select(`
					category_id,
					categories!products_category_id_fkey (
						name
					)
				`);

      const categoryStats = (categoryCounts || []).reduce<
        Record<string, number>
      >((acc, product) => {
        const categoryName = (() => {
          const cat = (product as { categories?: unknown }).categories;
          if (Array.isArray(cat)) {
            return (cat[0] as { name?: string }).name ?? "Uncategorized";
          }
          return (cat as { name?: string } | null)?.name ?? "Uncategorized";
        })();

        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("stock", 10);

      const { data: products } = await supabase
        .from("products")
        .select("price, stock");

      const totalInventoryValue = (products || []).reduce(
        (sum, product) => sum + product.price * product.stock,
        0,
      );

      return {
        totalProducts: totalProducts || 0,
        categoryStats,
        lowStockCount: lowStockCount || 0,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      };
    } catch (err) {
      console.error("Failed to get product analytics:", err);
      return {
        totalProducts: 0,
        categoryStats: {},
        lowStockCount: 0,
        totalInventoryValue: 0,
      };
    }
  },

  async bulkUpdateProducts(
    updates: Array<{ productId: string; data: UpdateProductData }>,
  ): Promise<boolean> {
    try {
      const promises = updates.map(({ productId, data }) =>
        this.updateProduct(productId, data),
      );

      await Promise.all(promises);
      return true;
    } catch (err) {
      console.error("Failed to bulk update products:", err);
      throw err;
    }
  },
};
