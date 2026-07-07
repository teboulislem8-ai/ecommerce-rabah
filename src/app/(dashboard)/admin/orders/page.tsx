import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth/authServerService";
import AdminOrdersClient from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  return <AdminOrdersClient />;
}
