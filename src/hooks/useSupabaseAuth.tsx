import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { profileService } from '@/services/profile/profileService';
import { authService } from '@/services/auth/authService';

const AUTH_BC_CHANNEL = 'auth-state';

function broadcastAuthChange(type: 'SIGNED_IN' | 'SIGNED_OUT', userId?: string) {
  try {
    const bc = new BroadcastChannel(AUTH_BC_CHANNEL);
    bc.postMessage({ type, userId, timestamp: Date.now() });
    bc.close();
  } catch {
    // BroadcastChannel not available
  }
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes from other tabs
    let authChannel: BroadcastChannel | null = null;
    try {
      authChannel = new BroadcastChannel(AUTH_BC_CHANNEL);
      authChannel.onmessage = (event) => {
        const { type, userId } = event.data;
        if (type === 'SIGNED_OUT') {
          queryClient.clear();
          setUser(null);
          setSession(null);
          lastUserIdRef.current = null;
        } else if (type === 'SIGNED_IN' && userId) {
          // Session changed in another tab — invalidate cache
          queryClient.clear();
          // Fetch the new session
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            lastUserIdRef.current = s?.user?.id || null;
            if (s?.user) {
              ensureUserProfile(s.user);
            }
          });
        }
      };
    } catch {
      // BroadcastChannel not supported
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id || null;

      if (event === 'SIGNED_OUT') {
        queryClient.invalidateQueries();
        broadcastAuthChange('SIGNED_OUT');
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        queryClient.invalidateQueries();
        broadcastAuthChange('SIGNED_IN', userId || undefined);
      }

      lastUserIdRef.current = userId;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      lastUserIdRef.current = session?.user?.id || null;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        ensureUserProfile(session.user);
      }
      setLoading(false);
    });

    // Detect tab returning from background — compare current user ID to detect cross-tab changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          const currentUserId = currentSession?.user?.id || null;
          // Session changed to a different user or was cleared
          if (currentUserId !== lastUserIdRef.current) {
            lastUserIdRef.current = currentUserId;
            queryClient.clear();
            setUser(currentSession?.user ?? null);
            setSession(currentSession);
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (authChannel) {
        authChannel.close();
      }
    };
  }, []);

  // Ensure user exists in the profiles table
  const ensureUserProfile = async (user: User) => {
    try {
      let userEmail = user.email || '';

      if (!userEmail) {
        console.log(
          'Email not available in user object, fetching from auth service...'
        );
        try {
          const authUserEmail = await authService.getCurrentUserEmail();
          if (authUserEmail) {
            userEmail = authUserEmail;
            console.log(
              'Successfully fetched email from auth service:',
              userEmail
            );
          }
        } catch (emailError) {
          console.error('Error fetching email from auth service:', emailError);
        }
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('profile_id, email')
        .eq('profile_id', user.id)
        .single();

      if (existingProfile) {
        if (!existingProfile.email && userEmail) {
          console.log('Updating existing profile with email:', userEmail);
          await profileService.updateProfile(user.id, {
            email: userEmail,
          });
        }
        return;
      }

      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          profile_id: user.id,
          username: '',
          avatar_url: '',
          email: userEmail,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        if (createError.code === '23505') {
          console.log('Profile already exists (created by another request)');
          return;
        }

        console.error('Error creating user profile:', createError);
        throw createError;
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success('Signed in successfully');
    } catch (error) {
      toast.error('Failed to sign in');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;

      if (data?.user) {
        await ensureUserProfile(data.user);
      }

      toast.success('Signed up successfully');
    } catch (error) {
      toast.error('Failed to sign up');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('Signing out user:', user?.email);
      // Clear all query caches immediately so stale data is never shown
      queryClient.clear();
      // Broadcast sign-out to other tabs BEFORE the session is destroyed
      broadcastAuthChange('SIGNED_OUT');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      lastUserIdRef.current = null;

      console.log('Sign out complete, state cleared');
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { user, session, loading, signIn, signUp, signOut };
}
