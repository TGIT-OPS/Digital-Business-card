import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = url.searchParams.get('q')?.trim() ?? '';
	let query = locals.supabase!.from('leads').select('*, card:cards(name, slug)').order('created_at', { ascending: false }).limit(500);
	if (q) {
		const safe = q.replace(/[%_,]/g, '');
		query = query.or(`name.ilike.%${safe}%,email.ilike.%${safe}%,company.ilike.%${safe}%`);
	}
	const { data } = await query;
	return {
		q,
		leads: (data ?? []).map((row) => ({
			...row,
			cardName: Array.isArray(row.card) ? row.card[0]?.name : row.card?.name
		}))
	};
};

export const actions: Actions = {
	note: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') || '');
		const note = String(form.get('note') || '').slice(0, 1000);
		const { error } = await locals.supabase!.from('leads').update({ note }).eq('id', id);
		if (error) return fail(400, { message: error.message });
		return { saved: true };
	},
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id') || '');
		const { error } = await locals.supabase!.from('leads').delete().eq('id', id);
		if (error) return fail(400, { message: error.message });
		return { saved: true };
	}
};
