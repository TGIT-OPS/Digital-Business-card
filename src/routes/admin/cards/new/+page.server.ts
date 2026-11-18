import { fail, redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { saveCard } from '#lib/server/card-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase!.from('companies').select('*, products(*)').order('name');
	return {
		companies: (data ?? []).map((company) => ({
			...company,
			products: [...(company.products ?? [])].sort((a, b) => a.sort_order - b.sort_order)
		})),
		baseUrl: PUBLIC_BASE_URL,
		supabaseUrl: PUBLIC_SUPABASE_URL
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const id = crypto.randomUUID();
		const saved = await saveCard(locals.supabase!, id, await request.formData(), true);
		if ('message' in saved) return fail(400, { message: saved.message });
		redirect(303, `/admin/cards/${id}?saved=1`);
	}
};
