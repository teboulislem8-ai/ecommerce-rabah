import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';
import { experimental_taintUniqueValue } from 'react';

/**
 * Creates a Supabase client for server-side usage with proper cookie handling
 */
export const createServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookies) => {
          try {
            cookies.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Handle cookie errors
          }
        },
      },
    }
  );
};

/**
 * Get the authenticated user from server-side with data tainting
 * to prevent session tokens from leaking to client bundles.
 */
export const getAuthenticatedUser = async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  // Taint the user object so it cannot be serialized to the client
  experimental_taintUniqueValue(
    'Do not pass the user auth object to the client. Use profile data instead.',
    user,
    user.id,
  );

  return user;
};

/**
 * Helper function to get user profile data
 */
export const getUserProfile = async () => {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return profile;
};

/**
 * Helper function to get products from server-side
 */
export const getProducts = async () => {
  const supabase = await createServerSupabase();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  return products;
};
