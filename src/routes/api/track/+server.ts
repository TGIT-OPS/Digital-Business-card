import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { anonClient, recordEvent, serviceClient } from '#lib/server/auth';
import { cloudflarePlace, requestPlace } from '#lib/server/place';
import type { RequestHandler } from './$types';

const ALLOWED = new Set([
	'view',
	'click_call',
	'click_whatsapp',
	'click_email',
	'click_website',
	'click_directions',
	'click_share',
	'click_video'
]);

export const POST: RequestHandler = async ({ request, url, platform }) => {
	if (!PUBLIC_SUPABASE_URL) return new Response(null, { status: 204 });
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) return new Response(null, { status: 403 });
	const body = await request.json().catch(() => null);
	const slug = typeof body?.slug === 'string' ? body.slug : '';
	const event = typeof body?.event === 'string' ? body.event : '';
	if (!slug || !ALLOWED.has(event)) return new Response(null, { status: 400 });
	const anon = anonClient();
	if (!anon) return new Response(null, { status: 204 });
	const { data } = await anon.from('cards').select('id, track_location').eq('slug', slug).maybeSingle();
	if (!data) return new Response(null, { status: 204 });
	const service = serviceClient();
	const { data: settings } = service
		? await service.from('org_settings').select('track_location').eq('id', 1).maybeSingle()
		: { data: null };
	const track = data.track_location ?? settings?.track_location ?? true;
	await recordEvent(data.id, event, track ? requestPlace(request, cloudflarePlace(platform)) : undefined);
	return new Response(null, { status: 204 });
};
