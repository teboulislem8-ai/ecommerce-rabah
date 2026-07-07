"use client";

import { useState, useRef } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCategories } from "@/hooks/queries";
import { categoryService } from "@/services/category/categoryService";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CategoryComboboxProps {
  value?: number;
  onChange: (categoryId: number | undefined, categoryName?: string) => void;
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  onChange,
  disabled,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("categoryCombobox");

  const {
    data: categories = [],
    isLoading,
    error,
    refetch,
  } = useCategories();

  const selected = categories.find((c) => c.id === value);

  const handleSelect = async (categoryId: number) => {
    onChange(categoryId);
    setOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name) return;

    setCreating(true);
    try {
      const category = await categoryService.getOrCreateCategory(name);
      onChange(category.id, category.name);
      setOpen(false);
      setSearch("");
      void refetch();
    } catch {
      // Error handled by service
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setSearch("");
    setOpen(false);
  };

  const searchLower = search.toLowerCase();
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchLower),
  );
  const exactMatch = filtered.some(
    (c) => c.name.toLowerCase() === searchLower,
  );
  const showCreate = search.trim().length > 0 && !exactMatch && !error;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled || creating}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || creating}
          className="w-full justify-between"
        >
          {creating
            ? t("creating")
            : selected
              ? selected.name
              : t("selectCategory")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            ref={inputRef}
            placeholder={t("searchPlaceholder")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {error && (
              <div className="p-3 text-center">
                <p className="text-sm text-destructive">{error.message}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 cursor-pointer"
                  onClick={() => void refetch()}
                >
                  {t("retry")}
                </Button>
              </div>
            )}
            {!error && isLoading && (
              <CommandEmpty>{t("loading")}</CommandEmpty>
            )}
            {!error && !isLoading && filtered.length === 0 && !showCreate && (
              <CommandEmpty>{t("noCategories")}</CommandEmpty>
            )}
            {!error && !isLoading && (
              <CommandGroup>
                {value !== undefined && (
                  <CommandItem
                    value="__clear__"
                    onSelect={handleClear}
                    className="cursor-pointer text-muted-foreground"
                  >
                    {t("noCategory")}
                  </CommandItem>
                )}
                {filtered.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.id.toString()}
                    onSelect={() => handleSelect(category.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => void handleCreate()}
                  className="cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("create", { name: search.trim() })}
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
