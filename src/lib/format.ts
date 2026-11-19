export function slugify(input: string): string {
	const slug = input
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return slug || 'card';
}

export function clean(value: unknown): string {
	return String(value ?? '').trim();
}

export function emptyToNull(value: unknown): string | null {
	const text = clean(value);
	return text ? text : null;
}

export function isHex(value: string): boolean {
	return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function hexOr(value: unknown, fallback: string): string {
	const text = clean(value);
	return isHex(text) ? text.toUpperCase() : fallback;
}

export function safeHttpUrl(value: string | null | undefined): string | null {
	const raw = (value ?? '').trim();
	if (!raw) return null;
	try {
		const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
		const url = new URL(withProto);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.toString();
	} catch {
		return null;
	}
}

export function displayUrl(value: string | null | undefined): string {
	return (value ?? '')
		.trim()
		.replace(/^https?:\/\//i, '')
		.replace(/\/$/, '');
}

export function telHref(phone: string | null | undefined): string | null {
	const digits = (phone ?? '').replace(/[^\d+]/g, '');
	return digits ? `tel:${digits}` : null;
}

export function whatsappHref(
	value: string | null | undefined,
	phoneFallback?: string | null
): string | null {
	const raw = (value ?? '').trim();
	if (raw) {
		if (/^https?:\/\//i.test(raw)) {
			try {
				const url = new URL(raw);
				if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
			} catch {
				return null;
			}
		}
		const digits = raw.replace(/\D/g, '');
		if (digits) return `https://wa.me/${digits}`;
	}
	const fallback = (phoneFallback ?? '').replace(/\D/g, '');
	return fallback ? `https://wa.me/${fallback}` : null;
}

export function formatAddress(parts: {
	address_line?: string | null;
	city?: string | null;
	postal_code?: string | null;
	country?: string | null;
}): string {
	const cityLine = [parts.city, parts.postal_code].filter(Boolean).join(' ');
	const lines = [parts.address_line, cityLine].filter(Boolean) as string[];
	if (parts.country && parts.country !== parts.city) lines.push(parts.country);
	return lines.join(', ');
}

export function mapsHref(address: string | null | undefined): string | null {
	const text = (address ?? '').trim();
	if (!text) return null;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
}

export function storagePublicUrl(supabaseUrl: string, path: string | null | undefined): string | null {
	if (!path) return null;
	if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
	const base = supabaseUrl.replace(/\/$/, '');
	const encoded = path
		.split('/')
		.filter(Boolean)
		.map((part) => encodeURIComponent(part))
		.join('/');
	return `${base}/storage/v1/object/public/media/${encoded}`;
}

export function cardPublicUrl(baseUrl: string, slug: string): string {
	return `${baseUrl.replace(/\/$/, '')}/c/${slug}`;
}

export type SocialLink = { label: string; url: string };

export function normalizeSocials(value: unknown): SocialLink[] {
	if (!Array.isArray(value)) return [];
	const links: SocialLink[] = [];
	for (const item of value) {
		if (!item || typeof item !== 'object') continue;
		const label = clean((item as { label?: unknown }).label);
		const url = safeHttpUrl(clean((item as { url?: unknown }).url));
		if (label && url) links.push({ label, url });
	}
	return links.slice(0, 8);
}
