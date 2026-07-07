"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { UserFilters } from "@/services/admin/adminUserService";
import { useTranslations } from "next-intl";

interface AdminUsersClientProps {
  currentFilters: UserFilters;
  currentPage: number;
  totalPages: number;
}

const roleOptions = [
  { value: "all", label: "all" },
  { value: "user", label: "roleUser" },
  { value: "admin", label: "roleAdmin" },
];

export function AdminUsersClient({
  currentFilters,
  currentPage,
  totalPages,
}: AdminUsersClientProps) {
  const t = useTranslations("adminUsers");
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentFilters.searchTerm || "");
  const [selectedRole, setSelectedRole] = useState(
    currentFilters.role || "all",
  );
  const [dateFrom, setDateFrom] = useState(currentFilters.dateFrom || "");

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    }
    if (selectedRole !== "all") {
      params.set("role", selectedRole);
    }
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    params.set("page", "1"); // Reset to first page

    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();

    if (currentFilters.searchTerm) {
      params.set("search", currentFilters.searchTerm);
    }
    if (currentFilters.role) {
      params.set("role", currentFilters.role);
    }
    if (currentFilters.dateFrom) {
      params.set("dateFrom", currentFilters.dateFrom);
    }
    params.set("page", page.toString());

    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center space-x-2">
          <Search className="text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="outline" size="sm">
            {t("search")}
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="text-muted-foreground h-4 w-4" />
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v ?? "all")}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder={t("role")} />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input
            type="date"
            placeholder={t("fromDate")}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            {t("previous")}
          </Button>

          <span className="text-sm whitespace-nowrap">
            {t("pageOf", { current: currentPage, total: totalPages })}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
