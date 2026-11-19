import { serviceClient, recordEvent } from '#lib/server/auth';
	import { cloudflarePlace, rateLimited, requestPlace } from '#lib/server/place';
import type { RequestHandler } from './$types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request, platform }) => {
	const service = serviceClient();
	if (!service) return new Response(null, { status: 503 });
	const form = await request.formData();
	if (String(form.get('company_url') || '').trim()) return Response.json({ ok: true });

	const ip = request.headers.get('cf-connecting-ip') || 'shared';
	if (rateLimited(ip)) return Response.json({ message: 'Please wait a few minutes and try again.' }, { status: 429 });

	const slug = String(form.get('slug') || '').trim();
	const name = String(form.get('name') || '').trim();
	const email = String(form.get('email') || '').trim();
	const company = String(form.get('company') || '').trim();
	const phone = String(form.get('phone') || '').trim();
	const note = String(form.get('note') || '').trim();
	if (!slug || name.length < 1 || name.length > 120) return Response.json({ message: 'Name is required.' }, { status: 400 });
	if (!EMAIL.test(email) || email.length > 160) return Response.json({ message: 'A valid email is required.' }, { status: 400 });
	if (company.length < 1 || company.length > 160) return Response.json({ message: 'Company is required.' }, { status: 400 });
	if (phone.length > 40 || note.length > 1000) return Response.json({ message: 'That note is too long.' }, { status: 400 });

	const { data: card } = await service
		.from('cards')
		.select('id, active, track_location, company:companies(active)')
		.eq('slug', slug)
		.maybeSingle();
	const owner = Array.isArray(card?.company) ? card.company[0] : card?.company;
	if (!card?.active || !owner?.active) return Response.json({ message: 'This card is not available.' }, { status: 404 });

	const { data: settings } = await service.from('org_settings').select('track_location').eq('id', 1).maybeSingle();
	const track = card.track_location ?? settings?.track_location ?? true;
	const place = track ? requestPlace(request, cloudflarePlace(platform)) : { country: null, city: null };

	const { error } = await service.from('leads').insert({
		card_id: card.id,
		name,
		email,
		company,
		phone: phone || null,
		note: note || null,
		consent: form.get('consent') === 'on',
		country: place.country,
		city: place.city
	});
	if (error) return Response.json({ message: 'Could not save that contact.' }, { status: 400 });
	await recordEvent(card.id, 'lead', place);
	return Response.json({ ok: true });
};
