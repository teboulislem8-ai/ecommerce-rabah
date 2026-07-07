import { profileService } from '@/services/profile/profileService';
import { ProfileType } from '@/types';
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { getClientUser } from '@/lib/supabase/clientUtils';

// Query Keys
export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  current: (...args: string[]) => [...profileKeys.all, 'current', ...args] as const,
};

// Get profile by ID
export function useProfile(
  userId: string,
  options?: UseQueryOptions<ProfileType | null>
) {
  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileService.getProfileById(userId),
    enabled: !!userId,
    ...options,
  });
}

// Get current user's profile
export function useCurrentProfile(
  options?: UseQueryOptions<ProfileType | null>
) {
  const userQuery = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: getClientUser,
  });

  const userId = userQuery.data?.id ?? '';

  return useQuery({
    queryKey: profileKeys.current(userId),
    queryFn: () => profileService.getCurrentProfile(),
    enabled: !!userId,
    ...options,
  });
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: Partial<ProfileType>;
    }) => {
      return profileService.updateProfile(userId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific profile query
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(variables.userId),
      });
      // Invalidate current profile query scoped to this user
      queryClient.invalidateQueries({ queryKey: profileKeys.current(variables.userId) });
    },
  });
}

// Update current user's profile
export function useUpdateCurrentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProfileType>) => {
      const profile = await profileService.updateCurrentProfile(data);
      return profile;
    },
    onSuccess: (profile) => {
      // Invalidate current profile query scoped to the user
      if (profile?.profile_id) {
        queryClient.invalidateQueries({ queryKey: profileKeys.current(profile.profile_id) });
      }
    },
  });
}
