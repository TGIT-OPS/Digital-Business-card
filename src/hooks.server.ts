import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';

export const handle: Handle = async ({ event, resolve }) => {
	const configured = Boolean(PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY);
	event.locals.configured = configured;
	event.locals.supabase = configured
		? createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				cookies: {
					getAll: () => event.cookies.getAll(),
					setAll: (cookies) => {
						for (const { name, value, options } of cookies) {
							event.cookies.set(name, value, { ...options, path: '/' });
						}
					}
				},
				cookieOptions: {
					path: '/',
					sameSite: 'lax',
					httpOnly: true,
					secure: event.url.protocol === 'https:'
				}
			})
		: null;

	event.locals.getUser = async () => {
		if (!event.locals.supabase) return null;
		const { data, error } = await event.locals.supabase.auth.getUser();
		if (error || !data.user) return null;
		return data.user;
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};
