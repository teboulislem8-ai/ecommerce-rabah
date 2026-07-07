"use client";

import { type ProductType } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslations } from "next-intl";

interface ProductGridProps {
  products: ProductType[];
  className?: string;
}

export function ProductGrid({ products, className }: ProductGridProps) {
  const t = useTranslations("product");
  return (
    <section className={className}>
      <ul className="grid grid-cols-2 gap-3 auto-rows-fr sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product) => (
          <li
            key={product.product_id}
            className="flex flex-col gap-2 overflow-hidden rounded-lg border border-border/60 p-2 transition-colors hover:border-border"
          >
            <Link href={`/products/${product.product_id}`} className="flex flex-col gap-2">
            {/* Media Content Frame */}
            <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-md">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-muted-foreground text-xs">{t("noImage")}</span>
                </div>
              )}

              {product.stock <= 5 && product.stock > 0 && (
                <span className="absolute top-1 start-1 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {t("stockLeft", { count: product.stock })}
                </span>
              )}
            </div>

            {/* Text Containment Shell */}
            <h3
              className="min-h-[2.25rem] line-clamp-2 text-sm font-medium leading-snug"
              title={product.title}
            >
              {product.title}
            </h3>

            {/* Price */}
            <div className="mt-auto w-full">
              <span className="min-w-0 truncate text-sm font-bold">
                {formatCurrency(product.price)}
              </span>
            </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
