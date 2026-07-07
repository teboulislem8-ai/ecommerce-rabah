import { orderService } from '@/services/order/orderService'
import { OrderType } from '@/types'
import {
	useQuery,
	useMutation,
	useQueryClient,
	UseQueryOptions,
} from '@tanstack/react-query'
import {
	updateOrderStatusAction,
	deleteOrderAction,
} from '@/app/actions/order-status'

// Query Keys
export const orderKeys = {
	all: ['orders'] as const,
	lists: () => [...orderKeys.all, 'list'] as const,
	list: (userId: string) => [...orderKeys.lists(), { userId }] as const,
	details: () => [...orderKeys.all, 'detail'] as const,
	detail: (id: string) => [...orderKeys.details(), id] as const,
}

// Get all orders for a user
export function useOrders(
	userId: string,
	options?: UseQueryOptions<OrderType[]>
) {
	return useQuery({
		queryKey: orderKeys.list(userId),
		queryFn: () => orderService.getOrders(userId),
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		retry: (failureCount, error) => {
			if (
				error instanceof Error &&
				(error.message.includes('404') ||
					error.message.includes('permission'))
			) {
				return false
			}
			return failureCount < 2
		},
		throwOnError: false,
		...options,
	})
}

// Get order by ID
export function useOrder(orderId: string, options?: UseQueryOptions<OrderType>) {
	return useQuery({
		queryKey: orderKeys.detail(orderId),
		queryFn: () => orderService.getOrderById(orderId),
		enabled: !!orderId,
		staleTime: 5 * 60 * 1000,
		retry: (failureCount, error) => {
			if (
				error instanceof Error &&
				(error.message.includes('404') ||
					error.message.includes('not found'))
			) {
				return false
			}
			return failureCount < 2
		},
		throwOnError: false,
		...options,
	})
}

// Create order mutation
export function useCreateOrder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: orderService.createOrder,
		onSuccess: (_data, variables) => {
			if (variables.userId) {
				queryClient.invalidateQueries({
					queryKey: orderKeys.list(variables.userId),
				})
			}
			queryClient.invalidateQueries({
				queryKey: orderKeys.lists(),
			})
		},
	})
}

// Update order status mutation (uses Server Action)
export function useUpdateOrderStatus() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			orderId,
			status,
		}: {
			orderId: number
			status: string
		}) => {
			const result = await updateOrderStatusAction({ orderId, status })
			if (!result.success) {
				throw new Error(result.error)
			}
			return result.data
		},
		onSuccess: (data) => {
			if (data) {
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(String((data as { id: number }).id)),
				})
				queryClient.invalidateQueries({
					queryKey: orderKeys.lists(),
				})
			}
		},
	})
}

// Delete order mutation (uses Server Action)
export function useDeleteOrder() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			orderId,
			userId,
		}: {
			orderId: string
			userId?: string
		}) => {
			const result = await deleteOrderAction({ orderId: Number(orderId) })
			if (!result.success) {
				throw new Error(result.error)
			}
			return { orderId, userId }
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: orderKeys.detail(variables.orderId),
			})
			if (variables.userId) {
				queryClient.invalidateQueries({
					queryKey: orderKeys.list(variables.userId),
				})
			}
			queryClient.invalidateQueries({
				queryKey: orderKeys.lists(),
			})
		},
	})
}
