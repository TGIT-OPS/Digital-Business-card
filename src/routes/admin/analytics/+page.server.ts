import { rollup, type EventRow } from '#lib/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data } = await locals.supabase!.from('card_events').select('created_at, event_type, country, city').order('created_at', { ascending: false }).limit(5000);
	return rollup((data ?? []) as EventRow[]);
};
