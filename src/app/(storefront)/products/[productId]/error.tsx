"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

type ProductErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProductError({ error, reset }: ProductErrorProps) {
  const t = useTranslations();
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Product page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center">
      <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
        {t("errors.somethingWentWrong")}
      </h1>
      <p className="mb-4 text-gray-600 dark:text-gray-300">
        {t("errors.couldNotLoad")}
      </p>
      <button
        onClick={reset}
        className="bg-primary hover:bg-primary/90 rounded-md px-4 py-2 text-white"
      >
        {t("common.tryAgain")}
      </button>
    </div>
  );
}
