import { error, fail, redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { saveCompany } from '#lib/server/company-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase!;
	const { data: company } = await supabase.from('companies').select('*').eq('id', params.id).maybeSingle();
	if (!company) error(404, 'Company not found');
	const [{ data: products }, { data: sample }] = await Promise.all([
		supabase.from('products').select('*').eq('company_id', company.id).order('sort_order'),
		supabase.from('cards').select('name, title, slug, phone, email, website').eq('company_id', company.id).limit(1).maybeSingle()
	]);
	return {
		company,
		products: products ?? [],
		sample,
		baseUrl: PUBLIC_BASE_URL,
		supabaseUrl: PUBLIC_SUPABASE_URL
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const saved = await saveCompany(locals.supabase!, params.id, await request.formData(), false);
		if ('message' in saved) return fail(400, { message: saved.message });
		redirect(303, `/admin/companies/${params.id}?saved=1`);
	},
	delete: async ({ locals, params }) => {
		const { error: deleteError } = await locals.supabase!.from('companies').delete().eq('id', params.id);
		if (deleteError) return fail(400, { message: deleteError.message });
		redirect(303, '/admin/companies?deleted=1');
	}
};
