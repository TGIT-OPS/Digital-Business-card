import type { SupabaseClient } from '@supabase/supabase-js';
import { clean, emptyToNull, hexOr, slugify } from '#lib/format';
import { parseVideoUrl } from '#lib/video';
import { LIMITS, readUpload, removePaths, uploadBytes } from '#lib/server/uploads';

export async function saveCard(supabase: SupabaseClient, id: string, form: FormData, isNew: boolean) {
	const name = clean(form.get('name'));
	const company_id = clean(form.get('company_id'));
	if (!name) return { message: 'Name is required.' };
	if (!company_id) return { message: 'Choose a company.' };
	const slug = slugify(clean(form.get('slug')) || name);
	const { data: clash } = await supabase.from('cards').select('id').eq('slug', slug).neq('id', id).maybeSingle();
	if (clash) return { message: 'That public link is already used. Choose another slug.' };

	const { data: existing } = await supabase
		.from('cards')
		.select('photo_path, video_path, video_poster_path, header_path, header_poster_path')
		.eq('id', id)
		.maybeSingle();

	let photo_path = existing?.photo_path ?? null;
	let video_path = existing?.video_path ?? null;
	let video_poster_path = existing?.video_poster_path ?? null;
	let header_path = existing?.header_path ?? null;
	let header_poster_path = existing?.header_poster_path ?? null;
	const remove: string[] = [];

	try {
		if (form.get('remove_photo') === 'on' && photo_path) {
			remove.push(photo_path);
			photo_path = null;
		}
		const photo = await readUpload(form.get('photo'), LIMITS.image, ['png', 'jpeg', 'webp']);
		if (photo) {
			photo_path = await uploadBytes(
				supabase,
				`photos/${id}/photo.${photo.kind === 'jpeg' ? 'jpg' : photo.kind}`,
				photo.bytes,
				photo.kind
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
			if (file) video_path = await uploadBytes(supabase, `videos/cards/${id}/intro.mp4`, file.bytes, 'mp4');
			if (!video_path) return { message: 'Upload an MP4 or choose a video link.' };
			video_mode = 'file';
		}
		const poster = await readUpload(form.get('video_poster'), LIMITS.poster, ['png', 'jpeg', 'webp']);
		if (poster && video_mode !== 'none') {
			video_poster_path = await uploadBytes(
				supabase,
				`videos/cards/${id}/poster.${poster.kind === 'jpeg' ? 'jpg' : poster.kind}`,
				poster.bytes,
				poster.kind
			);
		}

		if (form.get('remove_header') === 'on') {
			if (header_path) remove.push(header_path);
			if (header_poster_path) remove.push(header_poster_path);
			header_path = null;
			header_poster_path = null;
		}
		const header = await readUpload(form.get('header_file'), LIMITS.themeVideo, ['mp4']);
		if (header) header_path = await uploadBytes(supabase, `videos/cards/${id}/header.mp4`, header.bytes, 'mp4');
		const headerPoster = await readUpload(form.get('header_poster'), LIMITS.poster, ['png', 'jpeg', 'webp']);
		if (headerPoster) {
			header_poster_path = await uploadBytes(
				supabase,
				`videos/cards/${id}/header-poster.${headerPoster.kind === 'jpeg' ? 'jpg' : headerPoster.kind}`,
				headerPoster.bytes,
				headerPoster.kind
			);
		}

		const useCompany = form.get('use_company_colors') === 'on';
		const row = {
			id,
			company_id,
			slug,
			name,
			title: emptyToNull(form.get('title')),
			department: emptyToNull(form.get('department')),
			phone: emptyToNull(form.get('phone')),
			whatsapp: emptyToNull(form.get('whatsapp')),
			email: emptyToNull(form.get('email')),
			website: emptyToNull(form.get('website')),
			photo_path,
			active: form.get('active') === 'on',
			use_company_colors: useCompany,
			color_primary: useCompany ? null : hexOr(form.get('color_primary'), '#FF0000'),
			color_accent: useCompany ? null : hexOr(form.get('color_accent'), '#FFCF37'),
			color_pale: useCompany ? null : hexOr(form.get('color_pale'), '#FFFFA1'),
			color_ink: useCompany ? null : hexOr(form.get('color_ink'), '#000000'),
			color_paper: useCompany ? null : hexOr(form.get('color_paper'), '#FFFFFF'),
			color_muted: useCompany ? null : hexOr(form.get('color_muted'), '#E6E6E6'),
			video_mode,
			video_path,
			video_url,
			video_poster_path,
			video_autoplay: form.get('video_autoplay') === 'on' && video_mode !== 'none',
			header_mode: header_path ? 'video' : 'none',
			header_path,
			header_poster_path
		};
		const query = isNew ? supabase.from('cards').insert(row) : supabase.from('cards').update(row).eq('id', id);
		const { error } = await query;
		if (error) return { message: error.message };
		await removePaths(supabase, remove);
		return { id, slug };
	} catch (error) {
		return { message: error instanceof Error ? error.message : 'Could not save the card.' };
	}
}
