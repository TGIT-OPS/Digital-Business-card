import { error } from '@sveltejs/kit';
import { PDFDocument } from 'pdf-lib';
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
	const png = qrPng(cardPublicUrl(PUBLIC_BASE_URL, data.slug), { scale: 10, template, logo });
	const doc = await PDFDocument.create();
	const page = doc.addPage([240, 240]);
	const image = await doc.embedPng(png);
	page.drawImage(image, { x: 20, y: 20, width: 200, height: 200 });
	const pdf = await doc.save();
	const body = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
	return new Response(body, {
		headers: {
			'content-type': 'application/pdf',
			'content-disposition': `attachment; filename="${data.slug}-qr.pdf"`,
			'cache-control': 'public, max-age=86400'
		}
	});
};
