import { error } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$app/env/public';
import { cardPublicUrl, safeHttpUrl } from '#lib/format';
import { anonClient, recordEvent } from '#lib/server/auth';
import { buildVCard } from '#lib/vcard';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const anon = anonClient();
	if (!anon) error(503, 'Not available');
	const { data } = await anon.from('cards').select('*, company:companies(*)').eq('slug', params.slug).maybeSingle();
	if (!data) error(404, 'This card is not available.');
	const company = Array.isArray(data.company) ? data.company[0] : data.company;
	await recordEvent(data.id, 'save');
	const body = buildVCard({
		name: data.name,
		title: data.title,
		department: data.department,
		company: company?.name,
		phone: data.phone || company?.phone,
		whatsapp: data.whatsapp || company?.whatsapp,
		email: data.email || company?.email,
		website: safeHttpUrl(data.website || company?.website),
		street: company?.address_line,
		city: company?.city,
		postal: company?.postal_code,
		country: company?.country,
		note: cardPublicUrl(PUBLIC_BASE_URL, data.slug)
	});
	const filename = `${data.slug}.vcf`;
	return new Response(body, {
		headers: {
			'content-type': 'text/vcard; charset=utf-8',
			'content-disposition': `attachment; filename="${filename}"`,
			'cache-control': 'no-store'
		}
	});
};
