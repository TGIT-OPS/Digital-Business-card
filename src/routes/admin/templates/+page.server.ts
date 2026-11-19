import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: templates }, { data: companies }] = await Promise.all([
		locals.supabase!.from('card_templates').select('*, company:companies(name)').order('name'),
		locals.supabase!.from('companies').select('id, name').order('name')
	]);
	return {
		companies: companies ?? [],
		templates: (templates ?? []).map((row) => ({
			...row,
			companyName: Array.isArray(row.company) ? row.company[0]?.name : row.company?.name
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = String(form.get('name') || '').trim();
		const company_id = String(form.get('company_id') || '');
		if (!name || !company_id) return fail(400, { message: 'Name and company are required.' });
		const { error } = await locals.supabase!.from('card_templates').insert({
			company_id,
			name,
			layout: 'classic',
			locked_fields: ['layout', 'palette'],
			defaults: { qr_template: 'logo', tagline: 'Transforming IT into reality' },
			is_default: false
		});
		if (error) return fail(400, { message: error.message });
		return { message: 'Template added.' };
	},
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') || '');
		const company_id = String(form.get('company_id') || '');
		await locals.supabase!.from('card_templates').update({ is_default: false }).eq('company_id', company_id);
		const { error } = await locals.supabase!.from('card_templates').update({ is_default: true }).eq('id', id);
		if (error) return fail(400, { message: error.message });
		return { message: 'Default template updated.' };
	}
};
