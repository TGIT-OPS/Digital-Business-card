import { analyticsCsv, rollup, type EventRow } from '#lib/analytics';
import { requireAdmin } from '#lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const supabase = await requireAdmin(locals);
	if (!supabase) return new Response('Forbidden', { status: 403 });
	const { data } = await supabase.from('card_events').select('created_at, event_type, country, city').order('created_at', { ascending: false }).limit(5000);
	const csv = analyticsCsv(rollup((data ?? []) as EventRow[]).days);
	return new Response(csv, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="analytics.csv"'
		}
	});
};
