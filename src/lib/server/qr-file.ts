import type { QrTemplate } from '#lib/qr';

export function qrTemplateFrom(url: URL): QrTemplate {
	const value = url.searchParams.get('template');
	if (value === 'black' || value === 'red' || value === 'logo') return value;
	return 'logo';
}

export async function brandLogo(origin: string): Promise<Uint8Array | null> {
	try {
		const response = await fetch(`${origin}/brand/tgit-logo.png`);
		if (!response.ok) return null;
		return new Uint8Array(await response.arrayBuffer());
	} catch {
		return null;
	}
}
