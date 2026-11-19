import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase!;
	const q = url.searchParams.get('q')?.trim() ?? '';
	const company = url.searchParams.get('company') ?? '';
	const status = url.searchParams.get('status') ?? '';
	let query = supabase
		.from('cards')
		.select('id, name, title, slug, active, labels, company_id, company:companies(id, name)')
		.order('updated_at', { ascending: false });
	if (q) query = query.ilike('name', `%${q}%`);
	if (company) query = query.eq('company_id', company);
	if (status === 'ready') query = query.eq('active', true);
	if (status === 'draft') query = query.eq('active', false);
	const [{ data: cards }, { data: companies }, { data: totals }] = await Promise.all([
		query,
		supabase.from('companies').select('id, name').order('name'),
		supabase.rpc('card_event_totals')
	]);
	const stats = new Map<string, { views: number; saves: number }>();
	for (const row of (totals ?? []) as { card_id: string; views: number; saves: number }[]) {
		stats.set(row.card_id, row);
	}
	const rows = (cards ?? []) as {
		id: string;
		name: string;
		title: string | null;
		slug: string;
		active: boolean;
		labels: string[] | null;
		company: { name: string } | { name: string }[] | null;
	}[];
	return {
		cards: rows.map((card) => ({
			...card,
			companyName: Array.isArray(card.company) ? card.company[0]?.name : card.company?.name,
			views: Number(stats.get(card.id)?.views ?? 0),
			saves: Number(stats.get(card.id)?.saves ?? 0)
		})),
		companies: companies ?? [],
		q,
		company,
		status
	};
};
