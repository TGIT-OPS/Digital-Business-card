import { redirect } from '@sveltejs/kit';
import { ensureSuperAdmin, superAdminEmail } from '#lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.configured || !locals.supabase) redirect(303, '/login?e=setup');
	const user = await locals.getUser();
	const next = `${url.pathname}${url.search}`;
	if (!user) redirect(303, `/login?next=${encodeURIComponent(next)}`);
	if ((user.email ?? '').toLowerCase() !== superAdminEmail()) {
		await locals.supabase.auth.signOut();
		redirect(303, '/login?e=forbidden');
	}
	const ready = await ensureSuperAdmin(user, locals.supabase);
	if (!ready) redirect(303, '/login?e=profile');
	return { email: user.email };
};
