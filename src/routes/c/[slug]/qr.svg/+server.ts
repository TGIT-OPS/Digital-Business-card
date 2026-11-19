import { error } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$app/env/public';
import { cardPublicUrl } from '#lib/format';
import { qrSvg } from '#lib/qr';
import { anonClient } from '#lib/server/auth';
import { qrTemplateFrom } from '#lib/server/qr-file';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const anon = anonClient();
	if (!anon) error(503, 'Not available');
	const { data } = await anon.from('cards').select('slug').eq('slug', params.slug).maybeSingle();
	if (!data) error(404, 'This card is not available.');
	const template = qrTemplateFrom(url);
	return new Response(qrSvg(cardPublicUrl(PUBLIC_BASE_URL, data.slug), template === 'black' ? 'black' : 'red'), {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=86400'
		}
	});
};
