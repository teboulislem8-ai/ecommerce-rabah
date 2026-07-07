import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicStorefrontPaths = ['/', '/products', '/checkout'];
  const authPaths = ['/signin', '/signup', '/reset-password'];

  const isStorefront = publicStorefrontPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );
  const isAuthPage = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isStorefront || isAuthPage) {
    return response;
  }

  if (!user) {
    const returnTo = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/signin?returnTo=${returnTo}`, request.url)
    );
  }

  return response;
}
