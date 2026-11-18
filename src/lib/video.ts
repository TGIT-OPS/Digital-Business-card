export type ParsedVideo = { mode: 'youtube' | 'vimeo'; id: string };

const YOUTUBE_ID = /^[\w-]{6,20}$/;

export function parseVideoUrl(input: string | null | undefined): ParsedVideo | null {
	const raw = (input ?? '').trim();
	if (!raw) return null;
	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
	} catch {
		return null;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	const host = url.hostname.replace(/^www\./, '').toLowerCase();

	if (host === 'youtu.be') {
		const id = url.pathname.split('/').filter(Boolean)[0] ?? '';
		return YOUTUBE_ID.test(id) ? { mode: 'youtube', id } : null;
	}

	if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
		const fromQuery = url.searchParams.get('v') ?? '';
		if (YOUTUBE_ID.test(fromQuery)) return { mode: 'youtube', id: fromQuery };
		const parts = url.pathname.split('/').filter(Boolean);
		const marker = parts.findIndex((part) => part === 'embed' || part === 'shorts' || part === 'live');
		const id = marker >= 0 ? (parts[marker + 1] ?? '') : '';
		return YOUTUBE_ID.test(id) ? { mode: 'youtube', id } : null;
	}

	if (host === 'vimeo.com' || host === 'player.vimeo.com') {
		const id = [...url.pathname.split('/').filter(Boolean)].reverse().find((part) => /^\d{6,12}$/.test(part));
		return id ? { mode: 'vimeo', id } : null;
	}

	return null;
}

export function youtubeEmbed(id: string, autoplay: boolean): string {
	const flags = autoplay ? '&autoplay=1&mute=1' : '';
	return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1${flags}`;
}

export function vimeoEmbed(id: string, autoplay: boolean): string {
	const flags = autoplay ? '&autoplay=1&muted=1' : '';
	return `https://player.vimeo.com/video/${encodeURIComponent(id)}?dnt=1${flags}`;
}

export function youtubePoster(id: string): string {
	return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
}
