<script lang="ts">
	import { buildCardView, companyColors, type CardSource, type CompanySource, type VideoView } from '#lib/card-view';
	import { displayUrl, slugify, storagePublicUrl } from '#lib/format';
	import { parseVideoUrl, vimeoEmbed, youtubeEmbed, youtubePoster } from '#lib/video';
	import V8Card from '#lib/components/V8Card.svelte';
	import PrintButton from '#lib/components/PrintButton.svelte';

	type Company = CompanySource & { id: string; products?: { title: string; description: string | null; is_example: boolean; sort_order: number }[] };
	type Card = CardSource & {
		id: string;
		company_id: string;
		active: boolean;
		slug_locked?: boolean;
		labels?: string[] | null;
		track_location?: boolean | null;
		two_way_share?: boolean | null;
	};

	const PRESETS = [
		{ id: 'classic', name: 'TGIT Classic', primary: '#FF0000', accent: '#FFCF37', pale: '#FFFFA1' },
		{ id: 'pale', name: 'TGIT Pale', primary: '#FF0000', accent: '#FFCF37', pale: '#FFFFE5' }
	];

	let {
		card = null,
		companies,
		baseUrl,
		supabaseUrl,
		analytics = {},
		message = ''
	}: {
		card?: Card | null;
		companies: Company[];
		baseUrl: string;
		supabaseUrl: string;
		analytics?: Record<string, number>;
		message?: string;
	} = $props();

	let name = $state(card?.name ?? '');
	let title = $state(card?.title ?? '');
	let department = $state(card?.department ?? '');
	let companyId = $state(card?.company_id ?? companies[0]?.id ?? '');
	let slug = $state(card?.slug ?? '');
	let slugTouched = $state(Boolean(card?.slug));
	let phone = $state(card?.phone ?? '');
	let whatsapp = $state(card?.whatsapp ?? '');
	let email = $state(card?.email ?? '');
	let website = $state(card?.website ?? '');
	let active = $state(card?.active ?? true);
	let useCompanyColors = $state(card?.use_company_colors !== false);
	let colors = $state({
		primary: card?.color_primary ?? '#FF0000',
		accent: card?.color_accent ?? '#FFCF37',
		pale: card?.color_pale ?? '#FFFFA1',
		ink: card?.color_ink ?? '#000000',
		paper: card?.color_paper ?? '#FFFFFF',
		muted: card?.color_muted ?? '#E6E6E6'
	});
	let videoChoice = $state(card?.video_mode === 'file' ? 'file' : card?.video_mode === 'youtube' || card?.video_mode === 'vimeo' ? 'link' : 'none');
	let videoUrl = $state(card?.video_url ?? '');
	let videoAutoplay = $state(Boolean(card?.video_autoplay));
	let photoObject = $state<string | null>(null);
	let videoObject = $state<string | null>(null);
	let copied = $state(false);
	let step = $state(0);
	let qrChoice = $state(card?.qr_template || 'logo');
	let labelsText = $state((card?.labels || []).join(', '));
	let trackLocation = $state(card?.track_location !== false);
	let twoWay = $state(card?.two_way_share !== false);

	const selected = $derived(companies.find((company) => company.id === companyId) ?? companies[0]);
	const cardUrl = $derived(`${baseUrl.replace(/\/$/, '')}/c/${slug || 'preview'}`);
	const presetId = $derived(
		PRESETS.find((item) => item.primary === colors.primary && item.accent === colors.accent && item.pale === colors.pale)?.id ?? 'classic'
	);

	$effect(() => {
		if (!slugTouched) slug = slugify(name);
	});

	function onPhoto(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (photoObject) URL.revokeObjectURL(photoObject);
		photoObject = file ? URL.createObjectURL(file) : null;
	}
	function onVideoFile(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (videoObject) URL.revokeObjectURL(videoObject);
		videoObject = file ? URL.createObjectURL(file) : null;
	}

	const preview = $derived.by(() => {
		if (!selected) return null;
		const source: CardSource = {
			slug: slug || 'preview',
			name: name || 'Name',
			title,
			department,
			phone,
			whatsapp,
			email,
			website,
			photo_path: photoObject ? null : card?.photo_path,
			use_company_colors: useCompanyColors,
			color_primary: colors.primary,
			color_accent: colors.accent,
			color_pale: colors.pale,
			color_ink: colors.ink,
			color_paper: colors.paper,
			color_muted: colors.muted,
			video_mode: 'none',
			qr_template: qrChoice
		};
		const view = buildCardView({
			company: selected,
			card: source,
			products: selected.products ?? [],
			baseUrl,
			supabaseUrl,
			colors: useCompanyColors ? companyColors(selected) : { ...colors }
		});
		if (photoObject) view.photoUrl = photoObject;
		view.video = liveVideo(selected);
		view.qrUrl = null;
		return view;
	});

	function liveVideo(company: Company): VideoView | null {
		if (videoChoice === 'link') {
			const parsed = parseVideoUrl(videoUrl);
			if (!parsed) return null;
			return {
				kind: parsed.mode,
				src: parsed.mode === 'youtube' ? youtubeEmbed(parsed.id, false) : vimeoEmbed(parsed.id, false),
				poster: parsed.mode === 'youtube' ? youtubePoster(parsed.id) : storagePublicUrl(supabaseUrl, card?.video_poster_path),
				autoplay: false
			};
		}
		if (videoChoice === 'file') {
			const src = videoObject || storagePublicUrl(supabaseUrl, card?.video_path);
			if (!src) return null;
			return { kind: 'file', src, poster: storagePublicUrl(supabaseUrl, card?.video_poster_path), autoplay: false };
		}
		return null;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(cardUrl);
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}
</script>

<div class="page-head">
	<div>
		<h1>{card ? 'Edit card' : 'New card'}</h1>
		<p class="lede">{name || 'New card'}{selected ? ` · ${selected.name}` : ''}</p>
	</div>
	<div class="head-actions">
		{#if card}
			<a class="btn btn-primary" href="/c/{card.slug}/qr.png?template={qrChoice}">QR PNG</a>
			<a class="btn btn-outline" href="/c/{card.slug}/qr.svg?template={qrChoice}">QR SVG</a>
			<a class="btn btn-outline" href="/c/{card.slug}/qr.pdf?template={qrChoice}">QR PDF</a>
			<form method="POST" action="?/duplicate"><button class="btn btn-outline" type="submit">Duplicate card</button></form>
			<PrintButton
				slug={card.slug}
				name={card.name}
				title={card.title ?? ''}
				department={card.department ?? ''}
				company={selected?.name ?? ''}
				phone={card.phone || selected?.phone || ''}
				email={card.email || selected?.email || ''}
				website={displayUrl(card.website || selected?.website)}
				address={[selected?.address_line, [selected?.city, selected?.postal_code].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
				addressLines={[selected?.address_line, [selected?.city, selected?.postal_code].filter(Boolean).join(' ')].filter((line): line is string => Boolean(line))}
				blurb={selected?.about ?? ''}
				tagline={selected?.tagline ?? ''}
				services={(selected?.products ?? []).map((item) => item.title)}
				companyEmail=""
				cardUrl={`${baseUrl.replace(/\/$/, '')}/c/${card.slug}`}
				primary={selected?.color_primary ?? '#FF0000'}
				accent={selected?.color_accent ?? '#FFCF37'}
				showWhatsapp={Boolean(card.whatsapp || card.phone || selected?.whatsapp || selected?.phone)}
				logoPath={selected?.logo_path ?? null}
				logoLightPath={selected?.logo_light_path ?? null}
				posterPath={card.header_poster_path || selected?.theme_poster_path || null}
			/>
			<button class="btn btn-outline" type="button" onclick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
		{/if}
		<a class="btn btn-outline" href="/admin/cards">Back to cards</a>
	</div>
</div>

{#if message}<p class="form-error">{message}</p>{/if}

<form method="POST" action="?/save" enctype="multipart/form-data">
	<div class="editor-grid">
		<div>
			<div class="seg wizard-tabs">
				<button type="button" class:is-on={step === 0} onclick={() => (step = 0)}>Build</button>
				<button type="button" class:is-on={step === 1} onclick={() => (step = 1)}>Customize</button>
				<button type="button" class:is-on={step === 2} onclick={() => (step = 2)}>Set-up</button>
			</div>
			<div class:is-hidden={step !== 0}>
			<div class="card">
				<h2 style="margin-bottom:14px">Person details</h2>
				<div class="field"><label for="f-name">Name</label><input id="f-name" name="name" required bind:value={name} /></div>
				<div class="field"><label for="f-title">Title</label><input id="f-title" name="title" bind:value={title} /></div>
				<div class="field"><label for="f-dept">Department</label><input id="f-dept" name="department" bind:value={department} /></div>
				<div class="field">
					<label for="f-co">Company</label>
					<select id="f-co" name="company_id" bind:value={companyId}>
						{#each companies as company}<option value={company.id}>{company.name}</option>{/each}
					</select>
				</div>
				<div class="field"><label for="f-phone">Phone</label><input id="f-phone" name="phone" bind:value={phone} /></div>
				<div class="field"><label for="f-wa">WhatsApp</label><input id="f-wa" name="whatsapp" bind:value={whatsapp} placeholder="https://wa.me/65…" /></div>
				<div class="field"><label for="f-email">Email</label><input id="f-email" name="email" type="email" bind:value={email} /></div>
				<div class="field"><label for="f-web">Website</label><input id="f-web" name="website" bind:value={website} /></div>
				<div class="field">
					<label for="f-photo">Photo</label>
					<input id="f-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" onchange={onPhoto} />
					<label class="check"><input type="checkbox" name="remove_photo" /> Remove photo</label>
				</div>
				<label class="check"><input type="checkbox" name="active" bind:checked={active} /> Enabled — visible on the public link</label>
			</div>
			</div>
			<div class="card" class:is-hidden={step !== 1} style="margin-top:16px">
				<h2>Palette</h2>
				<p class="hint">TGIT colours only. Gold and pale yellow are for shapes, not text.</p>
				<input type="hidden" name="color_primary" value={colors.primary} />
				<input type="hidden" name="color_accent" value={colors.accent} />
				<input type="hidden" name="color_pale" value={colors.pale} />
				<input type="hidden" name="color_ink" value={colors.ink} />
				<input type="hidden" name="color_paper" value={colors.paper} />
				<input type="hidden" name="color_muted" value={colors.muted} />
				<button class="preset" class:is-on={useCompanyColors} type="button" onclick={() => (useCompanyColors = true)}>
					<span class="swatch" style="background:#FF0000"></span>
					<span class="swatch" style="background:#FFCF37"></span>
					<span class="swatch" style="background:#FFFFA1"></span>
					<span>Company colours</span>
				</button>
				{#each PRESETS as preset}
					<button
						class="preset"
						class:is-on={!useCompanyColors && presetId === preset.id}
						type="button"
						onclick={() => {
							useCompanyColors = false;
							colors = { ...colors, primary: preset.primary, accent: preset.accent, pale: preset.pale, ink: '#000000', paper: '#FFFFFF', muted: '#E6E6E6' };
						}}
					>
						<span class="swatch" style="background:{preset.primary}"></span>
						<span class="swatch" style="background:{preset.accent}"></span>
						<span class="swatch" style="background:{preset.pale}"></span>
						<span>{preset.name}</span>
					</button>
				{/each}
				<input type="checkbox" name="use_company_colors" checked={useCompanyColors} class="is-hidden" />
			</div>

			<div class:is-hidden={step !== 0}>
			<div class="card" style="margin-top:16px">
				<h2>Intro / product video</h2>
				<p class="hint">Upload a short MP4 (max 8 MB) or paste a YouTube or Vimeo link. If this card has no video, the company video is used.</p>
				<input type="hidden" name="video_choice" value={videoChoice} />
				<div class="seg" style="margin:8px 0">
					<button type="button" class:is-on={videoChoice === 'none'} onclick={() => (videoChoice = 'none')}>None</button>
					<button type="button" class:is-on={videoChoice === 'file'} onclick={() => (videoChoice = 'file')}>Upload</button>
					<button type="button" class:is-on={videoChoice === 'link'} onclick={() => (videoChoice = 'link')}>YouTube / Vimeo</button>
				</div>
				{#if videoChoice === 'file'}
					<div class="field"><label>MP4 file</label><input name="video_file" type="file" accept="video/mp4" onchange={onVideoFile} /></div>
				{/if}
				{#if videoChoice === 'link'}
					<div class="field"><label>Link</label><input name="video_url" bind:value={videoUrl} placeholder="https://www.youtube.com/watch?v=…" /></div>
				{/if}
				{#if videoChoice !== 'none'}
					<div class="field"><label>Poster image</label><input name="video_poster" type="file" accept="image/png,image/jpeg,image/webp" /></div>
					<label class="check"><input type="checkbox" name="video_autoplay" bind:checked={videoAutoplay} /> Muted autoplay when the video scrolls into view</label>
				{/if}
				<label class="check"><input type="checkbox" name="remove_video" /> Remove this card’s video</label>
			</div>

			<div class="card" style="margin-top:16px">
				<h2>Header video</h2>
				<p class="hint">Optional looping MP4 for this person. If you leave it empty, the company header video is used. It is clipped to the red wave and is not a separate player.</p>
				<div class="field"><label>MP4, up to 8 MB</label><input name="header_file" type="file" accept="video/mp4" /></div>
				<div class="field"><label>Poster image</label><input name="header_poster" type="file" accept="image/png,image/jpeg,image/webp" /></div>
				<label class="check"><input type="checkbox" name="remove_header" /> Use the company header instead</label>
			</div>
			</div>

			<div class:is-hidden={step !== 2}>
			<div class="card" style="margin-top:16px">
				<h2>Set-up</h2>
				<div class="field">
					<label for="f-slug">Short URL</label>
					<input id="f-slug" name="slug" required bind:value={slug} readonly={Boolean(card?.slug_locked)} oninput={() => (slugTouched = true)} />
					<p class="hint">{card?.slug_locked ? 'This link is locked after the card is created.' : cardUrl}</p>
				</div>
				<div class="field">
					<label for="f-qr">QR template</label>
					<select id="f-qr" name="qr_template" bind:value={qrChoice}>
						<option value="black">Black</option>
						<option value="red">Dark red</option>
						<option value="logo">Logo in centre</option>
					</select>
				</div>
				<div class="field">
					<label for="f-labels">Labels</label>
					<input id="f-labels" name="labels" bind:value={labelsText} placeholder="sales, partner" />
					<p class="hint">Separate labels with commas.</p>
				</div>
				<label class="check"><input type="checkbox" name="track_location" bind:checked={trackLocation} /> Track IP location</label>
				<label class="check"><input type="checkbox" name="two_way_share" bind:checked={twoWay} /> Two-way contact sharing</label>
			</div>
			{#if card}
				<div class="card" style="margin-top:16px">
					<h2>QR code & share</h2>
					<p class="hint">The QR opens the public card.</p>
					<p class="sample-url">{cardUrl}</p>
					<div class="stats">
						<span>Views {analytics.view ?? 0}</span>
						<span>Saves {analytics.save ?? 0}</span>
						<span>Call {analytics.click_call ?? 0}</span>
						<span>WhatsApp {analytics.click_whatsapp ?? 0}</span>
						<span>Email {analytics.click_email ?? 0}</span>
						<span>Website {analytics.click_website ?? 0}</span>
						<span>Directions {analytics.click_directions ?? 0}</span>
						<span>Share {analytics.click_share ?? 0}</span>
						<span>Video {analytics.click_video ?? 0}</span>
					</div>
				</div>
				<button class="btn btn-outline" style="margin-top:16px" type="submit" formaction="?/delete" formnovalidate onclick={(event) => { if (!confirm('Delete this card?')) event.preventDefault(); }}>Delete card</button>
			{/if}
			</div>

			<div class="wizard-nav">
				{#if step > 0}<button class="btn btn-outline" type="button" onclick={() => (step -= 1)}>Back</button>{/if}
				{#if step < 2}<button class="btn btn-outline" type="button" onclick={() => (step += 1)}>Next</button>{/if}
				<button class="btn btn-primary" type="submit">Save & Share</button>
			</div>
		</div>
		<div>
			<h2 style="margin-bottom:10px;text-align:center">Live preview</h2>
			<div class="phone">
				<div class="phone-bar"><i></i></div>
				<div class="phone-screen fit">
					{#if preview}
						<V8Card model={preview} fill={true} interactive={false} showExchange={true} />
					{/if}
				</div>
			</div>
		</div>
	</div>
</form>
