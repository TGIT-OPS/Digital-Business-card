<script lang="ts">
	import PublicCard from '#lib/components/PublicCard.svelte';
	import { buildCardView } from '#lib/card-view';
	import { storagePublicUrl } from '#lib/format';
	import { parseVideoUrl, vimeoEmbed, youtubeEmbed, youtubePoster } from '#lib/video';

	let { data, form } = $props();
	const company = data.company;
	let tab = $state<'details' | 'branding' | 'products' | 'media'>('details');
	let name = $state(company.name);
	let phone = $state(company.phone ?? '');
	let email = $state(company.email ?? '');
	let website = $state(company.website ?? '');
	let whatsapp = $state(company.whatsapp ?? '');
	let address = $state(company.address_line ?? '');
	let city = $state(company.city ?? '');
	let postal = $state(company.postal_code ?? '');
	let country = $state(company.country ?? '');
	let about = $state(company.about ?? '');
	let mission = $state(company.mission ?? '');
	let tagline = $state(company.tagline ?? '');
	let active = $state(company.active);
	let template = $state(company.layout_template);
	let colors = $state({
		primary: company.color_primary,
		accent: company.color_accent,
		pale: company.color_pale,
		ink: company.color_ink,
		paper: company.color_paper,
		muted: company.color_muted
	});
	let products = $state(
		data.products.map((item) => ({
			id: item.id,
			title: item.title,
			description: item.description ?? '',
			is_example: item.is_example
		}))
	);
	let socials = $state(
		(Array.isArray(company.social_links) ? company.social_links : []).map((item: { label?: string; url?: string }) => ({
			label: item.label ?? '',
			url: item.url ?? ''
		}))
	);
	let videoChoice = $state(company.video_mode === 'file' ? 'file' : company.video_mode === 'youtube' || company.video_mode === 'vimeo' ? 'link' : 'none');
	let videoUrl = $state(company.video_url ?? '');
	let videoAutoplay = $state(company.video_autoplay);
	let themeObject = $state<string | null>(null);
	let themeKind = $state<'video' | 'gif' | null>(null);

	function onTheme(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (themeObject) URL.revokeObjectURL(themeObject);
		themeObject = file ? URL.createObjectURL(file) : null;
		themeKind = file?.type === 'image/gif' ? 'gif' : file ? 'video' : null;
	}

	const preview = $derived.by(() => {
		const parsed = videoChoice === 'link' ? parseVideoUrl(videoUrl) : null;
		const draft = {
			...company,
			name,
			phone,
			email,
			website,
			whatsapp,
			address_line: address,
			city,
			postal_code: postal,
			country,
			about,
			mission,
			tagline,
			layout_template: template,
			color_primary: colors.primary,
			color_accent: colors.accent,
			color_pale: colors.pale,
			color_ink: colors.ink,
			color_paper: colors.paper,
			color_muted: colors.muted,
			social_links: socials,
			video_mode: videoChoice === 'none' ? 'none' : videoChoice === 'file' ? 'file' : parsed?.mode ?? 'none',
			video_url: videoUrl,
			video_autoplay: false,
			theme_mode: themeObject ? themeKind ?? 'video' : company.theme_mode,
			theme_path: themeObject ? null : company.theme_path
		};
		const view = buildCardView({
			company: draft,
			card: {
				slug: data.sample?.slug ?? 'preview',
				name: data.sample?.name ?? 'Your name',
				title: data.sample?.title ?? 'Title',
				phone: data.sample?.phone ?? phone,
				email: data.sample?.email ?? email,
				website: data.sample?.website ?? website,
				video_mode: 'none'
			},
			products,
			baseUrl: data.baseUrl,
			supabaseUrl: data.supabaseUrl
		});
		if (themeObject && themeKind) view.theme = { kind: themeKind, src: themeObject, poster: null };
		if (videoChoice === 'link' && parsed) {
			view.video = {
				kind: parsed.mode,
				src: parsed.mode === 'youtube' ? youtubeEmbed(parsed.id, false) : vimeoEmbed(parsed.id, false),
				poster: parsed.mode === 'youtube' ? youtubePoster(parsed.id) : null,
				autoplay: false
			};
		}
		if (videoChoice === 'none') view.video = null;
		return view;
	});

	function usePalette() {
		colors = { primary: '#FF0000', accent: '#FFCF37', pale: '#FFFFA1', ink: '#000000', paper: '#FFFFFF', muted: '#E6E6E6' };
	}
</script>

<div class="page-head">
	<div>
		<h1>Company settings</h1>
		<p class="lede">{company.name}</p>
	</div>
	<div class="head-actions">
		<a class="btn btn-outline" href="/admin/companies">Back to companies</a>
		<button class="btn btn-primary" type="submit" form="company-form">Save changes</button>
	</div>
</div>
{#if form?.message}<p class="form-error">{form.message}</p>{/if}

<div class="seg" style="margin-bottom:16px">
	<button type="button" class:is-on={tab === 'details'} onclick={() => (tab = 'details')}>Details</button>
	<button type="button" class:is-on={tab === 'branding'} onclick={() => (tab = 'branding')}>Branding</button>
	<button type="button" class:is-on={tab === 'products'} onclick={() => (tab = 'products')}>Products</button>
	<button type="button" class:is-on={tab === 'media'} onclick={() => (tab = 'media')}>Media</button>
</div>

<form id="company-form" method="POST" action="?/save" enctype="multipart/form-data">
	<div class={tab === 'details' ? '' : 'hidden'}>
		<div class="settings-grid">
			<div class="card">
				<h2 style="margin-bottom:14px">Contact information</h2>
				<div class="field"><label>Company name</label><input name="name" required bind:value={name} /></div>
				<div class="field"><label>Phone</label><input name="phone" bind:value={phone} /></div>
				<div class="field"><label>Email</label><input name="email" bind:value={email} /></div>
				<div class="field"><label>Website</label><input name="website" bind:value={website} /></div>
				<div class="field"><label>WhatsApp</label><input name="whatsapp" bind:value={whatsapp} /></div>
				<div class="field"><label>Street address</label><input name="address_line" bind:value={address} /></div>
				<div class="field"><label>City</label><input name="city" bind:value={city} /></div>
				<div class="field"><label>Postal code</label><input name="postal_code" bind:value={postal} /></div>
				<div class="field"><label>Country</label><input name="country" bind:value={country} /></div>
				<div class="field"><label>About</label><textarea name="about" rows="3" bind:value={about}></textarea></div>
				<div class="field"><label>Mission</label><textarea name="mission" rows="3" bind:value={mission}></textarea></div>
				<div class="field"><label>Card tagline</label><input name="tagline" bind:value={tagline} placeholder="Clear ownership. Connected teams." /></div>
				<label class="check"><input type="checkbox" name="active" bind:checked={active} /> Active — public cards for this company can be viewed</label>
				<h2 style="margin:18px 0 8px">Social links</h2>
				{#each socials as social, index}
					<div class="social-item">
						<input name="social_label" placeholder="Label" bind:value={socials[index].label} />
						<input name="social_url" placeholder="https://" bind:value={socials[index].url} />
						<button class="btn btn-outline btn-sm" type="button" onclick={() => socials.splice(index, 1)}>Remove</button>
					</div>
				{/each}
				<button class="btn btn-outline" type="button" style="margin-top:8px" onclick={() => socials.push({ label: '', url: '' })}>Add link</button>
			</div>
			<div class="card">
				<h2 style="margin-bottom:14px">Logo</h2>
				<div class="logo-slot">
					{#if company.logo_path}<img src={storagePublicUrl(data.supabaseUrl, company.logo_path)} alt="" />{:else}<span>No logo yet</span>{/if}
				</div>
				<label class="btn btn-outline btn-sm">Replace logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" hidden /></label>
				<p class="hint">PNG or JPEG, up to 2 MB. A white version sits on the red header.</p>
				<div class="logo-slot" style="margin-top:14px">
					{#if company.logo_light_path}<img src={storagePublicUrl(data.supabaseUrl, company.logo_light_path)} alt="" />{:else}<span>No white logo</span>{/if}
				</div>
				<label class="btn btn-outline btn-sm">White logo<input name="logo_light" type="file" accept="image/png,image/jpeg,image/webp" hidden /></label>
			</div>
		</div>
	</div>

	<div class={tab === 'branding' ? '' : 'hidden'}>
		<div class="card">
			<h2>Brand colours</h2>
			<p class="hint">Red text is only used at 30px on white. Gold and pale yellow are shapes and fills.</p>
			<button class="btn btn-outline btn-sm" type="button" onclick={usePalette}>Use TGIT palette</button>
			<div class="swatches" style="margin:12px 0">
				<div class="swatch"><div class="chip" style="background:{colors.primary}"></div>Primary<br />{colors.primary}</div>
				<div class="swatch"><div class="chip" style="background:{colors.accent}"></div>Accent<br />{colors.accent}</div>
				<div class="swatch"><div class="chip" style="background:{colors.pale}"></div>Pale<br />{colors.pale}</div>
				<div class="swatch"><div class="chip" style="background:{colors.ink}"></div>Ink<br />{colors.ink}</div>
				<div class="swatch"><div class="chip" style="background:{colors.paper}"></div>Paper<br />{colors.paper}</div>
				<div class="swatch"><div class="chip" style="background:{colors.muted}"></div>Grey<br />{colors.muted}</div>
			</div>
			<div class="field"><label>Primary</label><div class="color-row"><input type="color" bind:value={colors.primary} /><input name="color_primary" bind:value={colors.primary} /></div></div>
			<div class="field"><label>Accent</label><div class="color-row"><input type="color" bind:value={colors.accent} /><input name="color_accent" bind:value={colors.accent} /></div></div>
			<div class="field"><label>Pale</label><div class="color-row"><input type="color" bind:value={colors.pale} /><input name="color_pale" bind:value={colors.pale} /></div></div>
			<div class="field"><label>Ink</label><div class="color-row"><input type="color" bind:value={colors.ink} /><input name="color_ink" bind:value={colors.ink} /></div></div>
			<div class="field"><label>Paper</label><div class="color-row"><input type="color" bind:value={colors.paper} /><input name="color_paper" bind:value={colors.paper} /></div></div>
			<div class="field"><label>Grey</label><div class="color-row"><input type="color" bind:value={colors.muted} /><input name="color_muted" bind:value={colors.muted} /></div></div>
			<h2 style="margin:20px 0 8px">Card layout template</h2>
			<p class="hint">Classic Vertical is the layout designed for TGIT.</p>
			<input type="hidden" name="layout_template" value={template} />
			<div class="templates">
				<button type="button" class="tpl" class:is-on={template === 'classic'} onclick={() => (template = 'classic')}>
					<div class="thumb mini-classic"><div class="h"></div><div class="b"><i></i><i class="s"></i><u></u><u></u></div></div>
					<div class="name">Classic Vertical</div>
				</button>
				<button type="button" class="tpl" class:is-on={template === 'bold'} onclick={() => (template = 'bold')}>
					<div class="thumb mini-bold"><div class="h"></div><div class="b"><i></i><i></i></div></div>
					<div class="name">Red Bold</div>
				</button>
				<button type="button" class="tpl" class:is-on={template === 'minimal'} onclick={() => (template = 'minimal')}>
					<div class="thumb mini-min"><div class="bar"></div><div class="b"><i></i><i></i><div class="g"></div></div></div>
					<div class="name">Minimal</div>
				</button>
			</div>
		</div>
		<h2 style="margin:18px 0 10px;text-align:center">Live preview</h2>
		<div class="phone"><div class="phone-bar"><i></i></div><div class="phone-screen"><PublicCard model={preview} interactive={false} /></div></div>
	</div>

	<div class={tab === 'products' ? '' : 'hidden'}>
		<div class="card">
			<h2 style="margin-bottom:6px">Products & services</h2>
			<p class="hint">Mark placeholders as Example until you replace them with the real list.</p>
			{#each products as product, index}
				<div class="product-item">
					<input type="hidden" name="product_id" value={product.id} />
					<input type="hidden" name="product_example" value={product.is_example ? '1' : '0'} />
					<div style="flex:1">
						<div class="field"><label>Name</label><input name="product_title" bind:value={products[index].title} /></div>
						<div class="field"><label>Description</label><input name="product_description" bind:value={products[index].description} /></div>
						<label class="check"><input type="checkbox" bind:checked={products[index].is_example} /> Example</label>
					</div>
					<button class="btn btn-outline btn-sm" type="button" onclick={() => products.splice(index, 1)}>Remove</button>
				</div>
			{/each}
			<button class="btn btn-outline" type="button" style="margin-top:12px" onclick={() => products.push({ id: '', title: '', description: '', is_example: true })}>Add product</button>
		</div>
	</div>

	<div class={tab === 'media' ? '' : 'hidden'}>
		<div class="card">
			<h2>Intro / product video</h2>
			<p class="hint">A short MP4 up to 8 MB, or a YouTube or Vimeo link. Cards can override this. It is not printed.</p>
			<input type="hidden" name="video_choice" value={videoChoice} />
			<div class="seg" style="margin:8px 0 12px">
				<button type="button" class:is-on={videoChoice === 'none'} onclick={() => (videoChoice = 'none')}>None</button>
				<button type="button" class:is-on={videoChoice === 'file'} onclick={() => (videoChoice = 'file')}>Upload MP4</button>
				<button type="button" class:is-on={videoChoice === 'link'} onclick={() => (videoChoice = 'link')}>YouTube / Vimeo</button>
			</div>
			{#if videoChoice === 'file'}
				<div class="field"><label>MP4</label><input name="video_file" type="file" accept="video/mp4" /></div>
				{#if company.video_path}<p class="hint">A video is already saved. Upload again to replace it.</p>{/if}
			{/if}
			{#if videoChoice === 'link'}
				<div class="field"><label>Link</label><input name="video_url" bind:value={videoUrl} placeholder="https://" /></div>
			{/if}
			{#if videoChoice !== 'none'}
				<div class="field"><label>Poster image</label><input name="video_poster" type="file" accept="image/png,image/jpeg,image/webp" /></div>
				<label class="check"><input type="checkbox" name="video_autoplay" bind:checked={videoAutoplay} /> Muted autoplay when the section scrolls into view</label>
			{/if}
			<label class="check"><input type="checkbox" name="remove_video" /> Remove video</label>

			<h2 style="margin-top:22px">Header video</h2>
			<p class="hint">Looping MP4 up to 8 MB, clipped into the red wave on the public card and used as the print-card poster. A GIF up to 3 MB also works. Visitors who prefer reduced motion see the poster instead.</p>
			<div class="field"><label>Header video</label><input name="theme_file" type="file" accept="video/mp4,image/gif" onchange={onTheme} /></div>
			<div class="field"><label>Still image, shown if motion is reduced</label><input name="theme_poster" type="file" accept="image/png,image/jpeg,image/webp" /></div>
			<label class="check"><input type="checkbox" name="remove_theme" /> Remove header animation</label>
		</div>
		<h2 style="margin:18px 0 10px;text-align:center">Live preview</h2>
		<div class="phone"><div class="phone-bar"><i></i></div><div class="phone-screen"><PublicCard model={preview} interactive={false} /></div></div>
	</div>

	<button class="btn btn-outline" style="margin-top:18px" type="submit" formaction="?/delete" formnovalidate onclick={(event) => { if (!confirm('Delete this company and its cards?')) event.preventDefault(); }}>Delete company</button>
</form>
