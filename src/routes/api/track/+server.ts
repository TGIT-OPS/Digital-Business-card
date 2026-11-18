import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { anonClient, recordEvent } from '#lib/server/auth';
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

export const POST: RequestHandler = async ({ request, url }) => {
	if (!PUBLIC_SUPABASE_URL) return new Response(null, { status: 204 });
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) return new Response(null, { status: 403 });
	const body = await request.json().catch(() => null);
	const slug = typeof body?.slug === 'string' ? body.slug : '';
	const event = typeof body?.event === 'string' ? body.event : '';
	if (!slug || !ALLOWED.has(event)) return new Response(null, { status: 400 });
	const anon = anonClient();
	if (!anon) return new Response(null, { status: 204 });
	const { data } = await anon.from('cards').select('id').eq('slug', slug).maybeSingle();
	if (data) await recordEvent(data.id, event);
	return new Response(null, { status: 204 });
};
