import { error } from '@sveltejs/kit';
import { PUBLIC_BASE_URL, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { buildCardView } from '#lib/card-view';
import { superAdminEmail } from '#lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;
	if (!supabase) error(503, 'Cards are not available yet.');
	const { data } = await supabase.from('cards').select('*, company:companies(*)').eq('slug', params.slug).maybeSingle();
	if (!data) error(404, 'This card is not available.');
	const company = Array.isArray(data.company) ? data.company[0] : data.company;
	if (!company) error(404, 'This card is not available.');
	const { data: products } = await supabase
		.from('products')
		.select('title, description, is_example, sort_order')
		.eq('company_id', company.id)
		.order('sort_order');
	const user = await locals.getUser();
	const admin = (user?.email ?? '').toLowerCase() === superAdminEmail();
	const visible = Boolean(data.active && company.active);
	if (!visible && !admin) error(404, 'This card is not available.');
	return {
		view: buildCardView({
			company,
			card: data,
			products: products ?? [],
			baseUrl: PUBLIC_BASE_URL,
			supabaseUrl: PUBLIC_SUPABASE_URL
		}),
		draft: !visible,
		trackViews: visible
	};
};
