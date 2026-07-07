import { createServerSupabase } from '@/lib/supabase/server';
import { ProductType, ProductImageType } from '@/types';

const PRODUCT_QUERY = `
  *,
  category:categories(*),
  product_images (
    id,
    url,
    sort_order,
    created_at
  )
`;

function formatProduct(data: Record<string, unknown>): ProductType {
  const rawImages = data.product_images as ProductImageType[] | undefined;
  return {
    ...data,
    images: (rawImages || []).sort((a, b) => a.sort_order - b.sort_order),
  } as ProductType;
}

export const productServerService = {
  async getProducts(): Promise<ProductType[]> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_QUERY)
        .order('title');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return (data || []).map(formatProduct);
    } catch (error) {
      console.error('Error in getProducts:', error);
      return [];
    }
  },

  async getProductById(id: string): Promise<ProductType | null> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_QUERY)
        .eq('product_id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return formatProduct(data);
    } catch (error) {
      console.error('Error in getProductById:', error);
      return null;
    }
  },

  async getProductsByCategory(categoryId: number): Promise<ProductType[]> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_QUERY)
        .eq('category_id', categoryId)
        .order('title');

      if (error) {
        console.error('Error fetching products by category:', error);
        return [];
      }

      return (data || []).map(formatProduct);
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return [];
    }
  },

  async searchProducts(query: string): Promise<ProductType[]> {
    try {
      const supabase = await createServerSupabase();
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_QUERY)
        .ilike('title', `%${query}%`)
        .order('title');

      if (error) {
        console.error('Error searching products:', error);
        return [];
      }

      return (data || []).map(formatProduct);
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return [];
    }
  },
};
