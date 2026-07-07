import { supabase } from "@/lib/supabase/client";
import { ProfileType } from "@/types";

export interface UserWithStats extends ProfileType {
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  is_active?: boolean;
}

export interface UserFilters {
  role?: "admin" | "user";
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalAdmins: number;
  usersByRole: Record<string, number>;
  topSpenders: UserWithStats[];
}

/**
 * Admin service for user management
 * Requires admin privileges for all operations
 */
export const adminUserService = {
  /**
   * Get all users with filters and pagination
   */
  async getAllUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{ users: UserWithStats[]; total: number }> {
    try {
      let query = supabase.from("profiles").select("*");

      // Apply filters
      if (filters.role) {
        query = query.eq("role", filters.role);
      }
      if (filters.searchTerm) {
        query = query.or(
          `username.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%`,
        );
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      // Get total count for pagination
      const countQuery = supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      const { count } = await countQuery;

      // Get paginated results
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (error) {
        console.error("Error fetching all users:", error);
        throw error;
      }

      // Batch-fetch all orders for all users in one query
      const profileIds = (data || []).map((u) => u.profile_id);
      const { data: allOrders } = await supabase
        .from("orders")
        .select("user_id, total, created_at")
        .in("user_id", profileIds);

      const ordersByUser = new Map<string, Array<{ total: number; created_at: string }>>();
      for (const order of allOrders || []) {
        if (!ordersByUser.has(order.user_id)) {
          ordersByUser.set(order.user_id, []);
        }
        ordersByUser.get(order.user_id)!.push(order);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersWithStats = (data || []).map((user) => {
        const userOrders = ordersByUser.get(user.profile_id) || [];
        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
        const lastOrderDate = totalOrders > 0 ? userOrders[totalOrders - 1].created_at : null;
        const isActive = userOrders.some(
          (order) => new Date(order.created_at) > thirtyDaysAgo,
        );

        return {
          ...user,
          total_orders: totalOrders,
          total_spent: Number(totalSpent.toFixed(2)),
          last_order_date: lastOrderDate,
          is_active: isActive,
        };
      });

      return {
        users: usersWithStats,
        total: count || 0,
      };
    } catch (err) {
      console.error("Failed to get all users:", err);
      throw err;
    }
  },

  /**
   * Get user details with order history
   */
  async getUserDetails(userId: string): Promise<UserWithStats | null> {
    try {
      const { data: user, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("profile_id", userId)
        .single();

      if (error) {
        console.error("Error fetching user details:", error);
        throw error;
      }

      // Get user's order history
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
					*,
					order_items (
						quantity,
						price,
						products (
							title,
							image
						)
					)
				`,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      const userOrders = orders || [];
      const totalOrders = userOrders.length;
      const totalSpent = userOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      const lastOrderDate =
        userOrders.length > 0 ? userOrders[0].created_at : null;

      // Determine if user is active
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = userOrders.some(
        (order) => new Date(order.created_at) > thirtyDaysAgo,
      );

      return {
        ...user,
        total_orders: totalOrders,
        total_spent: Number(totalSpent.toFixed(2)),
        last_order_date: lastOrderDate,
        is_active: isActive,
      };
    } catch (err) {
      console.error("Failed to get user details:", err);
      return null;
    }
  },

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    role: "admin" | "user",
  ): Promise<ProfileType> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("profile_id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user role:", error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Failed to update user role:", err);
      throw err;
    }
  },

  /**
   * Delete user account (requires careful consideration)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Note: This will cascade delete due to foreign key constraints
      // Orders, reviews, addresses, etc. will also be deleted
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("profile_id", userId);

      if (error) {
        console.error("Error deleting user:", error);
        throw error;
      }

      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      throw err;
    }
  },

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      // Get all users for analytics
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        console.error("Error fetching users for analytics:", error);
        throw error;
      }

      const allUsers = users || [];

      // Calculate basic metrics
      const totalUsers = allUsers.length;
      const totalAdmins = allUsers.filter(
        (user) => user.role === "admin",
      ).length;

      // Users by role
      const usersByRole = allUsers.reduce(
        (acc, user) => {
          acc[user.role || "user"] = (acc[user.role || "user"] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // New users this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newUsersThisMonth = allUsers.filter(
        (user) => new Date(user.created_at) >= thisMonth,
      ).length;

      // Batch-fetch all orders for analytics
      const profileIds = allUsers.map((u) => u.profile_id);
      const { data: allOrders } = await supabase
        .from("orders")
        .select("user_id, total, created_at")
        .in("user_id", profileIds);

      const ordersByUser = new Map<string, Array<{ total: number; created_at: string }>>();
      for (const order of allOrders || []) {
        if (!ordersByUser.has(order.user_id)) {
          ordersByUser.set(order.user_id, []);
        }
        ordersByUser.get(order.user_id)!.push(order);
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersWithOrders = allUsers.map((user) => {
        const userOrders = ordersByUser.get(user.profile_id) || [];
        const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
        const isActive = userOrders.some(
          (order) => new Date(order.created_at) > thirtyDaysAgo,
        );

        return {
          ...user,
          total_orders: userOrders.length,
          total_spent: Number(totalSpent.toFixed(2)),
          is_active: isActive,
        };
      });

      const activeUsers = usersWithOrders.filter(
        (user) => user.is_active,
      ).length;

      // Top spenders (top 10)
      const topSpenders = usersWithOrders
        .filter((user) => user.total_spent > 0)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);

      return {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        totalAdmins,
        usersByRole,
        topSpenders,
      };
    } catch (err) {
      console.error("Failed to get user analytics:", err);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalAdmins: 0,
        usersByRole: {},
        topSpenders: [],
      };
    }
  },

  /**
   * Get users requiring attention (inactive admins, users with issues, etc.)
   */
  async getUsersRequiringAttention(): Promise<UserWithStats[]> {
    try {
      // Get users who haven't been active for a long time but have made purchases
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: users } = await supabase
        .from("profiles")
        .select("*")
        .lt("created_at", sixMonthsAgo.toISOString());

      if (!users) return [];

      // Batch-fetch orders for all filtered users
      const profileIds = users.map((u) => u.profile_id);
      const { data: allOrders } = await supabase
        .from("orders")
        .select("user_id, total, created_at")
        .in("user_id", profileIds)
        .order("created_at", { ascending: false });

      const ordersByUser = new Map<string, Array<{ total: number; created_at: string }>>();
      for (const order of allOrders || []) {
        if (!ordersByUser.has(order.user_id)) {
          ordersByUser.set(order.user_id, []);
        }
        ordersByUser.get(order.user_id)!.push(order);
      }

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 90); // 3 months

      return users
        .map((user) => {
          const userOrders = ordersByUser.get(user.profile_id) || [];
          if (userOrders.length === 0) return null;

          const lastOrderDate = userOrders[0].created_at;

          // Include if they had orders but haven't ordered in 3 months
          if (new Date(lastOrderDate) < threeDaysAgo) {
            const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);

            return {
              ...user,
              total_orders: userOrders.length,
              total_spent: Number(totalSpent.toFixed(2)),
              last_order_date: lastOrderDate,
              is_active: false,
            };
          }

          return null;
        })
        .filter((user): user is UserWithStats => user !== null);
    } catch (err) {
      console.error("Failed to get users requiring attention:", err);
      return [];
    }
  },

  /**
   * Search users by email or username
   */
  async searchUsers(searchTerm: string): Promise<UserWithStats[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error("Error searching users:", error);
        throw error;
      }

      // Get basic stats for search results
      const profileIds = (data || []).map((u) => u.profile_id);
      const { data: allOrderCounts } = await supabase
        .from("orders")
        .select("user_id", { count: "exact", head: false })
        .in("user_id", profileIds);

      const countByUser = new Map<string, number>();
      for (const order of allOrderCounts || []) {
        countByUser.set(order.user_id, (countByUser.get(order.user_id) || 0) + 1);
      }

      const usersWithStats = (data || []).map((user) => ({
        ...user,
        total_orders: countByUser.get(user.profile_id) || 0,
        total_spent: 0,
        is_active: false,
      }));

      return usersWithStats;
    } catch (err) {
      console.error("Failed to search users:", err);
      return [];
    }
  },
};
