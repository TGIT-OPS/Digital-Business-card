import type { SupabaseClient } from '@supabase/supabase-js';
import { clean, emptyToNull, hexOr, normalizeSocials, slugify } from '#lib/format';
import { parseVideoUrl } from '#lib/video';
import { LIMITS, readUpload, removePaths, uploadBytes } from '#lib/server/uploads';

const TEMPLATES = new Set(['classic', 'bold', 'minimal']);

export async function saveCompany(supabase: SupabaseClient, id: string, form: FormData, isNew: boolean) {
	const name = clean(form.get('name'));
	if (!name) return { message: 'Company name is required.' };
	let slug = slugify(clean(form.get('slug')) || name);
	const { data: clash } = await supabase.from('companies').select('id').eq('slug', slug).neq('id', id).maybeSingle();
	if (clash) slug = `${slug}-${id.slice(0, 4)}`;

	const { data: existing } = await supabase
		.from('companies')
		.select('logo_path, logo_light_path, video_path, video_poster_path, theme_path, theme_poster_path')
		.eq('id', id)
		.maybeSingle();

	let logo_path = existing?.logo_path ?? null;
	let logo_light_path = existing?.logo_light_path ?? null;
	let video_path = existing?.video_path ?? null;
	let video_poster_path = existing?.video_poster_path ?? null;
	let theme_path = existing?.theme_path ?? null;
	let theme_poster_path = existing?.theme_poster_path ?? null;
	const remove: string[] = [];

	try {
		const logo = await readUpload(form.get('logo'), LIMITS.image, ['png', 'jpeg', 'webp']);
		if (logo) {
			logo_path = await uploadBytes(supabase, `logos/${id}/logo.${logo.kind === 'jpeg' ? 'jpg' : logo.kind}`, logo.bytes, logo.kind);
		}
		const light = await readUpload(form.get('logo_light'), LIMITS.image, ['png', 'jpeg', 'webp']);
		if (light) {
			logo_light_path = await uploadBytes(
				supabase,
				`logos/${id}/logo-light.${light.kind === 'jpeg' ? 'jpg' : light.kind}`,
				light.bytes,
				light.kind
			);
		}

		const choice = clean(form.get('video_choice')) || 'none';
		let video_mode: 'none' | 'file' | 'youtube' | 'vimeo' = 'none';
		let video_url: string | null = null;
		if (form.get('remove_video') === 'on' || choice === 'none') {
			if (video_path) remove.push(video_path);
			if (video_poster_path) remove.push(video_poster_path);
			video_path = null;
			video_poster_path = null;
		} else if (choice === 'link') {
			const parsed = parseVideoUrl(clean(form.get('video_url')));
			if (!parsed) return { message: 'Paste a YouTube or Vimeo link.' };
			video_mode = parsed.mode;
			video_url = clean(form.get('video_url'));
			if (video_path) remove.push(video_path);
			video_path = null;
		} else {
			const file = await readUpload(form.get('video_file'), LIMITS.video, ['mp4']);
			if (file) {
				video_path = await uploadBytes(supabase, `videos/companies/${id}/intro.mp4`, file.bytes, 'mp4');
			}
			if (!video_path) return { message: 'Upload an MP4 or choose a video link.' };
			video_mode = 'file';
		}
		const poster = await readUpload(form.get('video_poster'), LIMITS.poster, ['png', 'jpeg', 'webp']);
		if (poster && video_mode !== 'none') {
			video_poster_path = await uploadBytes(
				supabase,
				`videos/companies/${id}/poster.${poster.kind === 'jpeg' ? 'jpg' : poster.kind}`,
				poster.bytes,
				poster.kind
			);
		}

		if (form.get('remove_theme') === 'on') {
			if (theme_path) remove.push(theme_path);
			if (theme_poster_path) remove.push(theme_poster_path);
			theme_path = null;
			theme_poster_path = null;
		}
		const theme = await readUpload(form.get('theme_file'), LIMITS.themeVideo, ['mp4', 'gif']);
		let theme_mode: 'none' | 'video' | 'gif' = theme_path ? (theme_path.endsWith('.gif') ? 'gif' : 'video') : 'none';
		if (theme) {
			if (theme.kind === 'gif' && theme.bytes.length > LIMITS.gif) {
				return { message: 'Theme GIFs must be under 3 MB.' };
			}
			const ext = theme.kind === 'gif' ? 'gif' : 'mp4';
			if (theme_path && !theme_path.endsWith(`.${ext}`)) remove.push(theme_path);
			theme_path = await uploadBytes(supabase, `videos/companies/${id}/theme.${ext}`, theme.bytes, theme.kind);
			theme_mode = theme.kind === 'gif' ? 'gif' : 'video';
		}
		if (!theme_path) theme_mode = 'none';
		const themePoster = await readUpload(form.get('theme_poster'), LIMITS.poster, ['png', 'jpeg', 'webp']);
		if (themePoster) {
			theme_poster_path = await uploadBytes(
				supabase,
				`videos/companies/${id}/theme-poster.${themePoster.kind === 'jpeg' ? 'jpg' : themePoster.kind}`,
				themePoster.bytes,
				themePoster.kind
			);
		}
		if (theme_mode === 'none') theme_poster_path = null;

		const template = clean(form.get('layout_template'));
		const row = {
			id,
			name,
			slug,
			phone: emptyToNull(form.get('phone')),
			email: emptyToNull(form.get('email')),
			website: emptyToNull(form.get('website')),
			whatsapp: emptyToNull(form.get('whatsapp')),
			address_line: emptyToNull(form.get('address_line')),
			city: emptyToNull(form.get('city')),
			postal_code: emptyToNull(form.get('postal_code')),
			country: emptyToNull(form.get('country')),
			about: emptyToNull(form.get('about')),
			mission: emptyToNull(form.get('mission')),
			tagline: emptyToNull(form.get('tagline')),
			layout_template: TEMPLATES.has(template) ? template : 'classic',
			color_primary: hexOr(form.get('color_primary'), '#FF0000'),
			color_accent: hexOr(form.get('color_accent'), '#FFCF37'),
			color_pale: hexOr(form.get('color_pale'), '#FFFFA1'),
			color_ink: hexOr(form.get('color_ink'), '#000000'),
			color_paper: hexOr(form.get('color_paper'), '#FFFFFF'),
			color_muted: hexOr(form.get('color_muted'), '#E6E6E6'),
			active: form.get('active') === 'on',
			social_links: socialLinks(form),
			logo_path,
			logo_light_path,
			video_mode,
			video_path,
			video_url,
			video_poster_path,
			video_autoplay: form.get('video_autoplay') === 'on' && video_mode !== 'none',
			theme_mode,
			theme_path,
			theme_poster_path
		};

		const query = isNew ? supabase.from('companies').insert(row) : supabase.from('companies').update(row).eq('id', id);
		const { error } = await query;
		if (error) return { message: error.message };
		await syncProducts(supabase, id, form);
		await removePaths(supabase, remove);
		return { id };
	} catch (error) {
		return { message: error instanceof Error ? error.message : 'Could not save the company.' };
	}
}

function socialLinks(form: FormData) {
	const labels = form.getAll('social_label').map((value) => clean(value));
	const urls = form.getAll('social_url').map((value) => clean(value));
	return normalizeSocials(labels.map((label, index) => ({ label, url: urls[index] ?? '' })));
}

async function syncProducts(supabase: SupabaseClient, companyId: string, form: FormData) {
	const ids = form.getAll('product_id').map((value) => clean(value));
	const titles = form.getAll('product_title').map((value) => clean(value));
	const descriptions = form.getAll('product_description').map((value) => clean(value));
	const examples = form.getAll('product_example').map((value) => clean(value) === '1');
	const keep: string[] = [];
	for (let index = 0; index < titles.length; index++) {
		if (!titles[index]) continue;
		const payload = {
			company_id: companyId,
			title: titles[index],
			description: descriptions[index] || null,
			is_example: examples[index] ?? false,
			sort_order: index
		};
		if (ids[index]) {
			await supabase.from('products').update(payload).eq('id', ids[index]).eq('company_id', companyId);
			keep.push(ids[index]);
		} else {
			const { data } = await supabase.from('products').insert(payload).select('id').single();
			if (data?.id) keep.push(data.id);
		}
	}
	const { data: existing } = await supabase.from('products').select('id').eq('company_id', companyId);
	const drop = (existing ?? []).map((row) => row.id).filter((productId) => !keep.includes(productId));
	if (drop.length) await supabase.from('products').delete().in('id', drop);
}
