import { fail, redirect } from '@sveltejs/kit';
import { saveCompany } from '#lib/server/company-form';
import { slugify } from '#lib/format';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase!
		.from('companies')
		.select('id, name, slug, address_line, city, postal_code, logo_path, active, cards(id)')
		.order('name');
	return {
		companies: data ?? [],
		supabaseUrl: PUBLIC_SUPABASE_URL
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		if (!name) return fail(400, { message: 'Company name is required.' });
		const id = crypto.randomUUID();
		const payload = new FormData();
		payload.set('name', name);
		payload.set('slug', slugify(name));
		payload.set('active', 'on');
		payload.set('video_choice', 'none');
		payload.set('layout_template', 'classic');
		const saved = await saveCompany(locals.supabase!, id, payload, true);
		if ('message' in saved && saved.message && !('id' in saved && saved.id)) return fail(400, { message: saved.message });
		redirect(303, `/admin/companies/${id}`);
	}
};
