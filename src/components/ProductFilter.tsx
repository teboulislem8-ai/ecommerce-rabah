"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Filter, SortAsc } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOptions } from "@/hooks/queries";
import { useCategories } from "@/hooks/queries";
import { useMemo } from "react";

interface ProductFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

export function ProductFilter({ filters, onFilterChange }: ProductFilterProps) {
  const t = useTranslations("productFilter");
  const { data: categories = [] } = useCategories();

  const sortOptions = [
    { value: "default", label: t("default") },
    { value: "price-asc", label: t("priceLowToHigh") },
    { value: "price-desc", label: t("priceHighToLow") },
    { value: "name-asc", label: t("nameAToZ") },
    { value: "name-desc", label: t("nameZToA") },
  ];

  const stockOptions = [
    { value: "all", label: t("allProducts") },
    { value: "in-stock", label: t("inStock") },
    { value: "out-of-stock", label: t("outOfStock") },
  ];

  const categoryOptions = useMemo(() => {
    const translate: (key: string) => string = t as never;
    return [
      { value: "all", label: t("allCategories") },
      ...categories.map((cat) => {
        const key = cat.name.toLowerCase();
        const label = translate(key);
        return { value: key, label: label !== key ? label : cat.name };
      }),
    ];
  }, [categories, t]);
  const handleSortChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      sortBy: value as FilterOptions["sortBy"],
    });
  };

  const handleStockChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      stockFilter: value as FilterOptions["stockFilter"],
    });
  };

  const handleCategoryChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      categoryFilter: value,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card flex flex-col gap-2 rounded-lg border p-2 sm:flex-row sm:gap-4 sm:p-4"
    >
      <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
        <Filter className="h-4 w-4" />
        <span>{t("filters")}</span>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:gap-4">
        {/* Sort Options */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground hidden text-xs font-medium sm:block">
            {t("sortBy")}
          </label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SortAsc className="ms-2 h-4 w-4" />
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground hidden text-xs font-medium sm:block">
            {t("stockStatus")}
          </label>
          <Select value={filters.stockFilter} onValueChange={handleStockChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder={t("stockStatus")} />
            </SelectTrigger>
            <SelectContent>
              {stockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground hidden text-xs font-medium sm:block">
            {t("category")}
          </label>
          <Select
            value={filters.categoryFilter}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}
