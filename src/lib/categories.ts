import { useCategories } from "@/hooks/queries";
import { useMemo } from "react";

export function useCategoryMap(): Record<string, number> {
  const { data: categories = [] } = useCategories();
  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of categories) {
      map[cat.name.toLowerCase()] = cat.id;
    }
    return map;
  }, [categories]);
}
