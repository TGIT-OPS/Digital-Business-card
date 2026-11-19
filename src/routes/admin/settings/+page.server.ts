import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase!.from('org_settings').select('two_way_share, track_location').eq('id', 1).maybeSingle();
	return {
		twoWay: data?.two_way_share ?? true,
		trackLocation: data?.track_location ?? true
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const form = await request.formData();
		const { error } = await locals.supabase!.from('org_settings').upsert({
			id: 1,
			two_way_share: form.get('two_way_share') === 'on',
			track_location: form.get('track_location') === 'on'
		});
		if (error) return fail(400, { message: error.message });
		return { message: 'Saved.' };
	}
};
