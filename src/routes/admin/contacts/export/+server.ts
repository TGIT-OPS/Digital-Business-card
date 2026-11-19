import { requireAdmin } from '#lib/server/auth';
import type { RequestHandler } from './$types';

function cell(value: unknown) {
	const text = String(value ?? '');
	return `"${text.replace(/"/g, '""')}"`;
}

export const GET: RequestHandler = async ({ locals }) => {
	const supabase = await requireAdmin(locals);
	if (!supabase) return new Response('Forbidden', { status: 403 });
	const { data } = await supabase.from('leads').select('name, email, company, phone, note, consent, country, city, created_at, card:cards(name)').order('created_at', { ascending: false });
	const lines = [['name', 'email', 'company', 'phone', 'note', 'consent', 'country', 'city', 'card', 'created_at'].join(',')];
	for (const row of data ?? []) {
		const related = row.card as { name?: string } | { name?: string }[] | null;
		const card = Array.isArray(related) ? related[0]?.name : related?.name;
		lines.push([row.name, row.email, row.company, row.phone, row.note, row.consent, row.country, row.city, card, row.created_at].map(cell).join(','));
	}
	return new Response(lines.join('\n'), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': 'attachment; filename="contacts.csv"'
		}
	});
};
