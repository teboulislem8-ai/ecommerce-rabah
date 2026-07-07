import { redirect } from "next/navigation";
import { getCurrentUser } from "@/services/auth/authServerService";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
