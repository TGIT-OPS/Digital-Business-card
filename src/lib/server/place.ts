export function cloudflarePlace(platform: App.Platform | undefined) {
	const cf = (platform as { cf?: { country?: string; city?: string } } | undefined)?.cf;
	return cf ?? null;
}

export function requestPlace(request: Request, cf?: { country?: string; city?: string } | null) {
	const headerCountry = request.headers.get('cf-ipcountry');
	const headerCity = request.headers.get('cf-ipcity');
	const country = headerCountry && headerCountry !== 'XX' ? headerCountry : cf?.country || null;
	const city = headerCity || (typeof cf?.city === 'string' ? cf.city : null);
	return { country: country || null, city: city || null };
}

const hits = new Map<string, number[]>();

export function rateLimited(key: string, limit = 8, windowMs = 10 * 60 * 1000) {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
	if (recent.length >= limit) {
		hits.set(key, recent);
		return true;
	}
	recent.push(now);
	hits.set(key, recent);
	return false;
}
