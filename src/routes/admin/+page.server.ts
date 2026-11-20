import { imageFor } from '#lib/admin/services';
import type { PageServerLoad } from './$types';

type Named = { name: string } | { name: string }[] | null;

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase!;
	const [cards, companies, events, recent, leads, activity, products] = await Promise.all([
		supabase.from('cards').select('id, name, slug, active, company:companies(name)', { count: 'exact' }).order('updated_at', { ascending: false }).limit(1),
		supabase.from('companies').select('id, name', { count: 'exact' }).limit(1),
		supabase.rpc('event_counts', { p_card: null }),
		supabase.from('cards').select('id, active').limit(1000),
		supabase.from('leads').select('id', { count: 'exact', head: true }),
		supabase.from('card_events').select('event_type, created_at, card:cards(name, slug)').order('created_at', { ascending: false }).limit(6),
		supabase.from('products').select('title, description, sort_order, is_example').order('sort_order').limit(12)
	]);
	const counts = new Map<string, number>();
	for (const row of events.data ?? []) counts.set(row.event_type, Number(row.total));
	const all = (recent.data ?? []) as { id: string; active: boolean }[];
	const seen = new Set<string>();
	const services = ((products.data ?? []) as { title: string; description: string | null }[])
		.filter((row) => !seen.has(row.title) && seen.add(row.title))
		.slice(0, 6)
		.map((row, index) => ({ title: row.title, image: imageFor(row.title, index) }));
	return {
		cardCount: cards.count ?? 0,
		readyCount: all.filter((card) => card.active).length,
		draftCount: all.filter((card) => !card.active).length,
		companyCount: companies.count ?? 0,
		views: counts.get('view') ?? 0,
		saves: counts.get('save') ?? 0,
		leads: leads.count ?? 0,
		latest: cards.data?.[0] ? { ...cards.data[0], companyName: companyName(cards.data[0].company as Named) } : null,
		firstCompany: companies.data?.[0] ?? null,
		activity: ((activity.data ?? []) as { event_type: string; created_at: string; card: Named & ({ slug?: string } | { slug?: string }[] | null) }[]).map((row) => {
			const card = Array.isArray(row.card) ? row.card[0] : row.card;
			return { type: row.event_type, at: row.created_at, name: (card as { name?: string } | null)?.name ?? 'A card', slug: (card as { slug?: string } | null)?.slug ?? '' };
		}),
		services
	};
};

function companyName(company: Named) {
	if (!company) return '';
	return Array.isArray(company) ? company[0]?.name ?? '' : company.name;
}
