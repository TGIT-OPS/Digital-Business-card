import { redirect } from '@sveltejs/kit';
import { superAdminEmail } from '#lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await locals.getUser();
	if (user && (user.email ?? '').toLowerCase() === superAdminEmail()) redirect(303, '/admin');
	redirect(303, '/login');
};
