import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth/authServerService";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  return <AdminProductsClient />;
}
