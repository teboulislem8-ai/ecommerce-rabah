import { useTranslations } from "next-intl";
import Link from "next/link";

export default function ProductNotFound() {
  const t = useTranslations();
  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        {t("errors.productNotFound")}
      </h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        {t("errors.productNotFoundDescription")}
      </p>
      <Link
        href="/products"
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white"
      >
        {t("order.browseProducts")}
      </Link>
    </div>
  );
}
