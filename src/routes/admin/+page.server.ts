import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase!;
	const [cards, companies, events, recent, leads] = await Promise.all([
		supabase.from('cards').select('id, name, company:companies(name)', { count: 'exact' }).limit(1),
		supabase.from('companies').select('id, name', { count: 'exact' }).limit(1),
		supabase.rpc('event_counts', { p_card: null }),
		supabase
			.from('cards')
			.select('id, name, title, active, company:companies(name)')
			.order('updated_at', { ascending: false })
			.limit(8),
		supabase.from('leads').select('id', { count: 'exact', head: true })
	]);
	const counts = new Map<string, number>();
	for (const row of events.data ?? []) counts.set(row.event_type, Number(row.total));
	return {
		cardCount: cards.count ?? 0,
		companyCount: companies.count ?? 0,
		views: counts.get('view') ?? 0,
		saves: counts.get('save') ?? 0,
		leads: leads.count ?? 0,
		firstCard: cards.data?.[0] ?? null,
		firstCompany: companies.data?.[0] ?? null,
		recent: (recent.data ?? []).map((row) => ({
			...row,
			companyName: companyName(row.company)
		}))
	};
};

function companyName(company: { name: string } | { name: string }[] | null) {
	if (!company) return '';
	return Array.isArray(company) ? company[0]?.name ?? '' : company.name;
}
