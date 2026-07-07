"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreateProductData,
  ProductWithDetails,
  adminProductService,
} from "@/services/admin/adminProductService";
import { CategoryCombobox } from "@/components/admin/CategoryCombobox";
import { useTranslations } from "next-intl";
import { ImageUploader, type ImageItem } from "@/components/admin/ImageUploader";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  product?: ProductWithDetails | null;
  title: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  stock: string;
  sku: string;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  title,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    stock: "",
    sku: "",
  });
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useTranslations("productFormModal");

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        stock: product.stock?.toString() || "",
        sku: product.sku || "",
      });
      setCategoryId(product.category_id ?? undefined);
      setImages(
        (product.images || []).map((img) => ({
          id: `existing-${img.id}`,
          url: img.url,
        })),
      );
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        stock: "",
        sku: "",
      });
      setCategoryId(undefined);
      setImages([]);
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t("titleRequired");
    }

    if (!formData.description.trim()) {
      newErrors.description = t("descriptionRequired");
    }

    if (!formData.price.trim()) {
      newErrors.price = t("priceRequired");
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = t("pricePositive");
      }
    }

    if (!formData.stock.trim()) {
      newErrors.stock = t("stockRequired");
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = t("stockNonNegative");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Collect existing URLs and upload new files
      const imageUrls: string[] = [];
      const newFiles: File[] = [];

      for (const img of images) {
        if (img.file) {
          newFiles.push(img.file);
        } else if (img.url) {
          imageUrls.push(img.url);
        }
      }

      // For create: upload to a temporary identifier, then the service handles it
      // For update: upload using the existing product ID
      if (newFiles.length > 0) {
        const productId = product?.product_id || "temp";
        const uploaded = await adminProductService.uploadProductImages(
          productId,
          newFiles,
        );
        imageUrls.push(...uploaded);
      }

      const submitData: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        images: imageUrls,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || undefined,
        category_id: categoryId,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {product ? t("editDetails") : t("createDetails")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">{t("productTitle")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder={t("enterTitle")}
              className={
                errors.title
                  ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                  : ""
              }
            />
            {errors.title && (
              <p className="mt-1 text-sm text-rose-600">{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{t("description")}</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder={t("enterDescription")}
              rows={3}
              className={`w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none ${
                errors.description
                  ? "border-rose-500 focus:ring-rose-500"
                  : "border-slate-300 focus:ring-blue-500"
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-rose-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">{t("price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                className={
                  errors.price
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                    : ""
                }
              />
              {errors.price && (
                <p className="mt-1 text-sm text-rose-600">{errors.price}</p>
              )}
            </div>

            <div>
              <Label htmlFor="stock">{t("stock")}</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                className={
                  errors.stock
                    ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                    : ""
                }
              />
              {errors.stock && (
                <p className="mt-1 text-sm text-rose-600">{errors.stock}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="sku">{t("sku")}</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              placeholder={t("skuPlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="category">{t("category")}</Label>
            <CategoryCombobox
              value={categoryId}
              onChange={(id) => setCategoryId(id)}
            />
          </div>

          <div>
            <Label>{t("imageUrl")}</Label>
            <ImageUploader
              existingImages={images
                .filter((img) => img.url)
                .map((img) => ({ url: img.url! }))}
              onChange={setImages}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("saving") : product ? t("update") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
