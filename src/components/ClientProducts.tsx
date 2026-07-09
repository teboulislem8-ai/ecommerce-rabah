"use client";

import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ProductGrid } from "@/components/product-grid";
import { useProducts, FilterOptions } from "@/hooks/queries";
import { ProductType } from "@/types";
import { ErrorState } from "@/components/ErrorState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductFilter } from "@/components/ProductFilter";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCategoryMap } from "@/lib/categories";

// Sort products based on the selected option
const sortProducts = (
  products: ProductType[],
  sortBy: FilterOptions["sortBy"],
) => {
  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
};

const filterProducts = (products: ProductType[], filters: FilterOptions, categoryMap: Record<string, number>) => {
  let filtered = [...products];

  // Filter by stock (only if not 'all')
  if (filters.stockFilter === "in-stock") {
    filtered = filtered.filter((product) => product.stock > 0);
  } else if (filters.stockFilter === "out-of-stock") {
    filtered = filtered.filter((product) => product.stock === 0);
  }

  // Filter by category (only if not 'all')
  if (filters.categoryFilter !== "all") {
    const categoryId = categoryMap[filters.categoryFilter];
    if (categoryId !== undefined) {
      filtered = filtered.filter(
        (product) => product.category_id === categoryId,
      );
    }
  }

  return filtered;
};

export default function ClientProducts() {
  console.log("[ClientProducts] render start", Date.now());
  const t = useTranslations("clientProducts");
  console.log("[ClientProducts] after useTranslations", Date.now());
  const {
    data: products = [],
    isLoading: loading,
    error,
    refetch: retry,
  } = useProducts();
  console.log("[ClientProducts] after useProducts", Date.now(), { loading, hasProducts: products.length > 0, error: !!error });

  const categoryMap = useCategoryMap();
  console.log("[ClientProducts] after useCategoryMap", Date.now());
  const searchParams = useSearchParams();
  console.log("[ClientProducts] after useSearchParams", Date.now(), { params: searchParams?.toString() });
  const router = useRouter();
  const pathname = usePathname();
  console.log("[ClientProducts] after useRouter/usePathname", Date.now());

  // Sync URL changes (back/forward) back to filters — skip if we wrote this URL
  const lastSyncedCat = useRef<string | null>(null);
  useEffect(() => {
    const cat = searchParams.get("cat") || "all";
    if (lastSyncedCat.current === cat) return;
    lastSyncedCat.current = cat;
    setFilters((prev) => ({
      ...prev,
      categoryFilter: cat,
    }));
  }, [searchParams?.toString()]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const cat = searchParams.get("cat");
    return {
      sortBy: "default",
      stockFilter: "all",
      categoryFilter: cat || "all",
    };
  });

  const updateFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    const params = new URLSearchParams(searchParams.toString());
    if (newFilters.categoryFilter !== "all") {
      params.set("cat", newFilters.categoryFilter);
    } else {
      params.delete("cat");
    }
    const qs = params.toString();
    const catVal = newFilters.categoryFilter !== "all" ? newFilters.categoryFilter : "all";
    lastSyncedCat.current = catVal;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  // Process products with search, filters, and sorting
  const processedProducts = useMemo(() => {
    if (!products) return [];

    // Start with all products
    let processed = [...products];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      processed = processed.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ),
      );
    }

    // Apply filters
    processed = filterProducts(processed, filters, categoryMap);

    // Apply sorting
    processed = sortProducts(processed, filters.sortBy);

    return processed;
  }, [products, searchTerm, filters, categoryMap]);

  return (
    <ErrorBoundary>
      <>
        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-md"
        >
          <Input
            type="text"
            placeholder={t("searchProducts")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </motion.div>

        {/* Product Filter */}
        <ProductFilter filters={filters} onFilterChange={updateFilters} />

        {/* Product Count and Reset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-muted/50 flex flex-col items-center justify-between gap-4 rounded-lg p-4 sm:flex-row"
        >
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>
              {t("showing", { count: processedProducts.length, total: products?.length || 0 })}
            </span>
          </div>

          {/* Reset Filters Button */}
          {(filters.sortBy !== "default" ||
            filters.stockFilter !== "all" ||
            filters.categoryFilter !== "all" ||
            searchTerm.trim() !== "") && (
            <button
              onClick={() => {
                updateFilters({
                  sortBy: "default",
                  stockFilter: "all",
                  categoryFilter: "all",
                });
                setSearchTerm("");
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs transition-colors"
            >
              {t("resetAllFilters")}
            </button>
          )}
        </motion.div>

        {/* Products grid */}
        <div className="py-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[200px] items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="border-primary h-8 w-8 rounded-full border-t-2 border-b-2"
                />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorState
                  title={t("failedToLoad")}
                  description={t("failedToLoadDescription")}
                  onRetry={retry}
                  error={error}
                  type="network"
                />
              </motion.div>
            ) : processedProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorState
                  title={
                    (products?.length || 0) === 0
                      ? t("noProductsAvailable")
                      : t("noProductsMatch")
                  }
                  description={
                    (products?.length || 0) === 0
                      ? t("noProductsAvailableDescription")
                      : searchTerm.trim() !== ""
                        ? t("tryDifferentSearch")
                        : t("tryAdjustingFilters")
                  }
                  showRetry={false}
                  type="not-found"
                />
                {(products?.length || 0) > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        updateFilters({
                          sortBy: "default",
                          stockFilter: "all",
                          categoryFilter: "all",
                        });
                        setSearchTerm("");
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2 transition-colors"
                    >
                      {t("clearAllFilters")}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProductGrid
                  products={processedProducts}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    </ErrorBoundary>
  );
}
