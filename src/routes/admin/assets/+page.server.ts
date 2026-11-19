import { fail } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';
import { storagePublicUrl } from '#lib/format';
import { LIMITS, readUpload, uploadBytes } from '#lib/server/uploads';
import type { Actions, PageServerLoad } from './$types';

type Item = { name: string; id: string | null; metadata: { size?: number } | null };

async function walk(supabase: NonNullable<App.Locals['supabase']>, prefix = ''): Promise<{ path: string; size: number }[]> {
	const { data } = await supabase.storage.from('media').list(prefix, { limit: 100 });
	const out: { path: string; size: number }[] = [];
	for (const item of (data ?? []) as Item[]) {
		const path = prefix ? `${prefix}/${item.name}` : item.name;
		if (!item.id) out.push(...(await walk(supabase, path)));
		else out.push({ path, size: item.metadata?.size ?? 0 });
	}
	return out;
}

export const load: PageServerLoad = async ({ locals }) => {
	const files = await walk(locals.supabase!);
	return {
		files: files.map((file) => ({ ...file, url: storagePublicUrl(PUBLIC_SUPABASE_URL, file.path) }))
	};
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const form = await request.formData();
		const file = await readUpload(form.get('file'), LIMITS.themeVideo, ['png', 'jpeg', 'webp', 'gif', 'mp4']);
		if (!file) return fail(400, { message: 'Choose a PNG, JPEG, WebP, GIF or MP4 under 8 MB.' });
		const original = file.kind === 'jpeg' ? 'jpg' : file.kind;
		const path = `library/${Date.now()}.${original}`;
		await uploadBytes(locals.supabase!, path, file.bytes, file.kind);
		return { message: 'Uploaded.' };
	},
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const path = String(form.get('path') || '');
		if (!path || path.includes('..')) return fail(400, { message: 'That file cannot be removed.' });
		const { error } = await locals.supabase!.storage.from('media').remove([path]);
		if (error) return fail(400, { message: error.message });
		return { message: 'Deleted.' };
	}
};
