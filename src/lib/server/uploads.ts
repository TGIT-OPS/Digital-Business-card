import type { SupabaseClient } from '@supabase/supabase-js';

export const LIMITS = {
	image: 2 * 1024 * 1024,
	poster: 1536 * 1024,
	video: 8 * 1024 * 1024,
	themeVideo: 8 * 1024 * 1024,
	gif: 3 * 1024 * 1024
};

export type FileKind = 'png' | 'jpeg' | 'webp' | 'gif' | 'mp4';

const CONTENT: Record<FileKind, string> = {
	png: 'image/png',
	jpeg: 'image/jpeg',
	webp: 'image/webp',
	gif: 'image/gif',
	mp4: 'video/mp4'
};

export function sniff(bytes: Uint8Array): FileKind | null {
	if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
	if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
	if (
		bytes.length >= 12 &&
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	) {
		return 'webp';
	}
	if (bytes.length >= 6) {
		const head = String.fromCharCode(...bytes.slice(0, 6));
		if (head === 'GIF87a' || head === 'GIF89a') return 'gif';
	}
	if (bytes.length >= 12 && String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === 'ftyp') return 'mp4';
	return null;
}

export async function readUpload(
	entry: FormDataEntryValue | null,
	maxBytes: number,
	allowed: FileKind[]
): Promise<{ bytes: Uint8Array; kind: FileKind } | null> {
	if (!(entry instanceof File) || entry.size === 0) return null;
	if (entry.size > maxBytes) {
		const mb = Math.round((maxBytes / 1024 / 1024) * 10) / 10;
		throw new Error(`That file is too large. Keep it under ${mb} MB.`);
	}
	const bytes = new Uint8Array(await entry.arrayBuffer());
	const kind = sniff(bytes);
	if (!kind || !allowed.includes(kind)) {
		throw new Error('That file type is not allowed.');
	}
	return { bytes, kind };
}

export async function uploadBytes(supabase: SupabaseClient, path: string, bytes: Uint8Array, kind: FileKind) {
	const { error } = await supabase.storage.from('media').upload(path, bytes, {
		upsert: true,
		contentType: CONTENT[kind],
		cacheControl: '3600'
	});
	if (error) throw new Error(error.message);
	return path;
}

export async function removePaths(supabase: SupabaseClient, paths: (string | null | undefined)[]) {
	const clean = paths.filter((path): path is string => Boolean(path) && !path!.startsWith('http'));
	if (!clean.length) return;
	await supabase.storage.from('media').remove(clean);
}
