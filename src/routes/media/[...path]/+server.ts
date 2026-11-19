import { error } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { storagePublicUrl } from '#lib/format';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const path = params.path;
	if (!path || path.includes('..')) error(400, 'Bad path');
	const target = storagePublicUrl(PUBLIC_SUPABASE_URL, path);
	if (!target) error(404, 'Not found');
	const upstream = await fetch(target);
	if (!upstream.ok) error(upstream.status, 'Not found');
	return new Response(upstream.body, {
		headers: {
			'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
			'cache-control': 'public, max-age=3600'
		}
	});
};
