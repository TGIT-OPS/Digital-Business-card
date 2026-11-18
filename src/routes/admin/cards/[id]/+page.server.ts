import { error, fail, redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { saveCard } from '#lib/server/card-form';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase!;
	const { data: card } = await supabase.from('cards').select('*').eq('id', params.id).maybeSingle();
	if (!card) error(404, 'Card not found');
	const [{ data: companies }, { data: events }] = await Promise.all([
		supabase.from('companies').select('*, products(*)').order('name'),
		supabase.rpc('event_counts', { p_card: card.id })
	]);
	const analytics: Record<string, number> = {};
	for (const row of events ?? []) analytics[row.event_type] = Number(row.total);
	return {
		card,
		companies: (companies ?? []).map((company) => ({
			...company,
			products: [...(company.products ?? [])].sort((a, b) => a.sort_order - b.sort_order)
		})),
		analytics,
		baseUrl: PUBLIC_BASE_URL,
		supabaseUrl: PUBLIC_SUPABASE_URL
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const saved = await saveCard(locals.supabase!, params.id, await request.formData(), false);
		if ('message' in saved) return fail(400, { message: saved.message });
		redirect(303, `/admin/cards/${params.id}?saved=1`);
	},
	delete: async ({ locals, params }) => {
		const { error: deleteError } = await locals.supabase!.from('cards').delete().eq('id', params.id);
		if (deleteError) return fail(400, { message: deleteError.message });
		redirect(303, '/admin/cards?deleted=1');
	}
};
