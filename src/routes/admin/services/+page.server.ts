import { imageFor } from '#lib/admin/services';
import type { PageServerLoad } from './$types';

/** Read-only view of each company's services (the products table). Editing stays on the company page. */
export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase!;
	const [{ data: companies }, { data: products }] = await Promise.all([
		supabase.from('companies').select('id, name').order('name'),
		supabase.from('products').select('company_id, title, description, sort_order, is_example').order('sort_order')
	]);
	const rows = (products ?? []) as { company_id: string; title: string; description: string | null; sort_order: number; is_example: boolean }[];
	return {
		companies: ((companies ?? []) as { id: string; name: string }[]).map((company) => ({
			...company,
			services: rows
				.filter((row) => row.company_id === company.id)
				.map((row, index) => ({ title: row.title, description: row.description, example: row.is_example, image: imageFor(row.title, index) }))
		}))
	};
};
