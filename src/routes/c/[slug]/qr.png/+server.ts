import { error } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$app/env/public';
import { cardPublicUrl } from '#lib/format';
import { qrPng } from '#lib/qr';
import { anonClient } from '#lib/server/auth';
import { brandLogo, qrTemplateFrom } from '#lib/server/qr-file';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url }) => {
	const anon = anonClient();
	if (!anon) error(503, 'Not available');
	const { data } = await anon.from('cards').select('slug').eq('slug', params.slug).maybeSingle();
	if (!data) error(404, 'This card is not available.');
	const template = qrTemplateFrom(url);
	const logo = template === 'logo' ? await brandLogo(url.origin) : null;
	const png = qrPng(cardPublicUrl(PUBLIC_BASE_URL, data.slug), { template, logo });
	const body = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
	return new Response(body, {
		headers: {
			'content-type': 'image/png',
			'content-disposition': `inline; filename="${data.slug}-qr.png"`,
			'cache-control': 'public, max-age=86400'
		}
	});
};
