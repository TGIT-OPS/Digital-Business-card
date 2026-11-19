import { fail, redirect } from '@sveltejs/kit';
import { ensureSuperAdmin, superAdminEmail } from '#lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = await locals.getUser();
	if (user && (user.email ?? '').toLowerCase() === superAdminEmail()) redirect(303, '/admin');
	return {
		configured: locals.configured,
		notice: url.searchParams.get('e')
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		if (!locals.supabase || !locals.configured) {
			return fail(400, { message: 'Supabase is not connected yet. Add the keys in .env or Cloudflare, then restart.' });
		}
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) return fail(400, { message: 'Email or password is incorrect.', email });
		const user = await locals.getUser();
		if (!user || (user.email ?? '').toLowerCase() !== superAdminEmail()) {
			await locals.supabase.auth.signOut();
			return fail(403, { message: 'Only the super admin can sign in.', email });
		}
		const ready = await ensureSuperAdmin(user, locals.supabase);
		if (!ready) {
			await locals.supabase.auth.signOut();
			return fail(500, {
				message: 'Signed in, but the super admin profile could not be saved. Check SUPABASE_SERVICE_ROLE_KEY.',
				email
			});
		}
		const next = url.searchParams.get('next') || '/admin';
		redirect(303, next.startsWith('/') && !next.startsWith('//') ? next : '/admin');
	}
};
