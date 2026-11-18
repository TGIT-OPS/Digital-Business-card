<script lang="ts">
	import { onMount } from 'svelte';
	import type { CardView } from '#lib/card-view';

	let {
		model,
		interactive = true,
		trackViews = false,
		qrSvg = null
	}: {
		model: CardView;
		interactive?: boolean;
		trackViews?: boolean;
		qrSvg?: string | null;
	} = $props();

	let showEmbed = $state(false);
	let videoEl = $state<HTMLVideoElement | null>(null);

	function track(event: string) {
		if (!interactive || !model.slug) return;
		const body = JSON.stringify({ slug: model.slug, event });
		if (navigator.sendBeacon) {
			navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
		} else {
			fetch('/api/track', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body,
				keepalive: true
			}).catch(() => {});
		}
	}

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (trackViews) track('view');
		const themeVideo = document.querySelector('.pc-theme video') as HTMLVideoElement | null;
		if (reduce && themeVideo) {
			themeVideo.pause();
			themeVideo.removeAttribute('autoplay');
		}
		if (!model.video || model.video.kind !== 'file' || !model.video.autoplay || reduce || !videoEl) return;
		const el = videoEl;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					el.muted = true;
					el.play().catch(() => {});
					observer.disconnect();
				}
			},
			{ threshold: 0.45 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	function playEmbed() {
		showEmbed = true;
		track('click_video');
	}

	async function share() {
		track('click_share');
		const payload = { title: `${model.name} · ${model.companyName}`, url: model.cardUrl };
		if (navigator.share) {
			try {
				await navigator.share(payload);
				return;
			} catch {
				/* cancelled */
			}
		}
		try {
			await navigator.clipboard.writeText(model.cardUrl);
		} catch {
			/* leave the button as-is */
		}
	}

		const headerLogo = $derived(model.template === 'minimal' ? model.logoUrl : model.logoLightUrl || null);
	const colorLogo = $derived(!headerLogo ? model.logoUrl : null);
	const services = $derived(model.products.filter((item) => item.title && !item.is_example).concat(model.products.filter((item) => item.is_example)));
</script>

{#if model.template === 'classic'}
	<article class="v2-card">
		<svg width="0" height="0" aria-hidden="true">
			<defs>
				<clipPath id="v2-wave-clip" clipPathUnits="objectBoundingBox">
					<path d="M0,0 H1 V0.74 C0.8,0.74 0.66,1 0.5,1 C0.34,1 0.2,0.74 0,0.74 Z" />
				</clipPath>
			</defs>
		</svg>
		<div class="v2-hero-wrap">
			<div class="v2-hero">
				{#if model.theme?.poster}
					<img class="v2-poster" src={model.theme.poster} alt="" />
				{/if}
				{#if model.theme?.kind === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video autoplay muted loop playsinline poster={model.theme.poster ?? undefined}>
						<source src={model.theme.src} type="video/mp4" />
					</video>
				{:else if model.theme?.kind === 'gif'}
					<img class="v2-poster" src={model.theme.src} alt="" />
				{/if}
				<div class="v2-multiply"></div>
			</div>
			<svg class="v2-stroke" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
				<path d="M0,6 C18,6 34,22 50,22 C66,22 82,6 100,6" fill="none" stroke="#e10600" stroke-width="1.6" />
			</svg>
		</div>
		<div class="v2-body">
			{#if model.logoUrl}<img class="v2-logo" src={model.logoUrl} alt={model.companyName} />{/if}
			<h1 class="v2-name">{model.name}</h1>
			{#if model.title}<div class="v2-title">{model.title}</div>{/if}
			<div class="v2-company">{model.companyName}</div>
			{#if qrSvg || model.qrUrl}
				<div class="v2-qr">
					{#if qrSvg}{@html qrSvg}{:else if model.qrUrl}<img src={model.qrUrl} alt="QR code for this card" />{/if}
				</div>
				<p class="v2-scan">Scan to view our company profile</p>
			{/if}
			{#if model.mailUrl}
				<a class="v2-tile" href={interactive ? model.mailUrl : undefined} onclick={() => track('click_email')}>
					<span class="v2-ico"><svg viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg></span>
					<span><small>EMAIL</small><strong>{model.email}</strong></span>
				</a>
			{/if}
			{#if model.telUrl}
				<a class="v2-tile" href={interactive ? model.telUrl : undefined} onclick={() => track('click_call')}>
					<span class="v2-ico"><svg viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11 11 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.57 3.6 1 1 0 01-.25 1l-2.2 2.2z"/></svg></span>
					<span><small>PHONE</small><strong>{model.phone}</strong></span>
				</a>
			{/if}
			{#if model.websiteUrl}
				<a class="v2-tile" href={interactive ? model.websiteUrl : undefined} target="_blank" rel="noopener" onclick={() => track('click_website')}>
					<span class="v2-ico"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 9h-3.1a15 15 0 00-1-5.1A8 8 0 0118.9 11zM12 4.1c.7 1 1.3 2.8 1.6 4.9h-3.2c.3-2.1.9-3.9 1.6-4.9zM4.1 13a8 8 0 010-2h3.3a17 17 0 000 2H4.1zM5.1 13h3.1c.2 1.9.6 3.6 1 5.1A8 8 0 015.1 13zM12 19.9c-.7-1-1.3-2.8-1.6-4.9h3.2c-.3 2.1-.9 3.9-1.6 4.9z"/></svg></span>
					<span><small>WEBSITE</small><strong>{model.websiteLabel}</strong></span>
				</a>
			{/if}
		</div>
		<div class="v2-stripe" aria-hidden="true"><span></span><span></span><span></span></div>
	</article>

	<article class="v2-card">
		<div class="v2-hero-wrap">
			<div class="v2-hero" style="background:#ff0000"></div>
			{#if model.logoLightUrl}
				<img src={model.logoLightUrl} alt="" style="position:absolute;left:50%;top:28px;transform:translateX(-50%);height:36px;width:auto;opacity:.45" />
			{/if}
			<svg class="v2-stroke" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
				<path d="M0,6 C18,6 34,22 50,22 C66,22 82,6 100,6" fill="none" stroke="#c40000" stroke-width="1.6" />
			</svg>
		</div>
		<div class="v2-body">
			{#if model.logoUrl}<img class="v2-logo" src={model.logoUrl} alt="" />{/if}
			<div class="v2-logo-rule"></div>
			{#if model.tagline}<p class="v2-tagline">{model.tagline}</p>{/if}
			{#if services.length}
				<ul class="v2-services">
					{#each services as item}
						<li><i></i><span>{item.title}{#if item.is_example} <small>(Example)</small>{/if}</span></li>
					{/each}
				</ul>
			{/if}
			<div class="v2-rule"></div>
			<div class="v2-address">
				<strong>{model.companyName}</strong>
				{#each model.addressLines as line}<div>{line}</div>{/each}
				{#if model.companyEmail}<div>{model.companyEmail}</div>{/if}
			</div>
		</div>
		<div class="v2-stripe" aria-hidden="true"><span></span><span></span><span></span></div>
	</article>

	{#if interactive}
		<div class="v2-actions">
			{#if model.slug}<a class="save" href="/c/{model.slug}/contact.vcf">Save Contact</a>{/if}
			{#if model.whatsappUrl}
				<a href={model.whatsappUrl} target="_blank" rel="noopener" onclick={() => track('click_whatsapp')}>WhatsApp</a>
			{/if}
			{#if model.mapsUrl}
				<a href={model.mapsUrl} target="_blank" rel="noopener" onclick={() => track('click_directions')}>Directions</a>
			{/if}
			<button type="button" onclick={share}>Share this card</button>
		</div>
	{/if}
{:else}
<article
	class="public-card tpl-{model.template}"
	style="--brand:{model.colors.primary};--accent:{model.colors.accent};--pale:{model.colors.pale};--ink:{model.colors.ink};--paper:{model.colors.paper};--muted:{model.colors.muted}"
>
	<header class="pc-header rise">
		{#if model.theme}
			<div class="pc-theme" aria-hidden="true">
				{#if model.theme.kind === 'gif'}
					<img src={model.theme.src} alt="" />
				{:else}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video muted loop playsinline autoplay poster={model.theme.poster ?? undefined}>
						<source src={model.theme.src} type="video/mp4" />
					</video>
				{/if}
			</div>
		{/if}
		{#if headerLogo}
			<img class="pc-logo" src={headerLogo} alt="" />
		{:else if colorLogo}
			<span class="pc-logo-pad"><img src={colorLogo} alt="" /></span>
		{:else}
			<strong class="pc-logo" style="color:#fff;font-size:22px">{model.companyName}</strong>
		{/if}
	</header>
	<div class="pc-body">
		{#if model.photoUrl}
			<img class="pc-photo rise" src={model.photoUrl} alt="" />
		{/if}
		<div class="rise">
			<div class="pc-name">{model.name}</div>
			{#if model.title}<div class="pc-title">{model.title}</div>{/if}
			{#if model.department}<div class="pc-dept">{model.department}</div>{/if}
			<div class="pc-company">{model.companyName}</div>
		</div>

		{#if model.telUrl || model.whatsappUrl || model.mailUrl || model.websiteUrl}
			<div class="pc-actions rise">
				{#if model.telUrl}
					<a href={interactive ? model.telUrl : undefined} onclick={() => track('click_call')}>Call</a>
				{/if}
				{#if model.whatsappUrl}
					<a href={interactive ? model.whatsappUrl : undefined} target="_blank" rel="noopener" onclick={() => track('click_whatsapp')}>WhatsApp</a>
				{/if}
				{#if model.mailUrl}
					<a href={interactive ? model.mailUrl : undefined} onclick={() => track('click_email')}>Email</a>
				{/if}
				{#if model.websiteUrl}
					<a href={interactive ? model.websiteUrl : undefined} target="_blank" rel="noopener" onclick={() => track('click_website')}>Website</a>
				{/if}
			</div>
		{/if}

		{#if interactive && model.slug}
			<a class="pc-save rise" href="/c/{model.slug}/contact.vcf">Save Contact</a>
		{:else}
			<span class="pc-save rise" aria-disabled="true">Save Contact</span>
		{/if}

		{#if model.video}
			<section class="pc-video rise">
				<h2 class="pc-h2">Watch</h2>
				<div class="frame">
					{#if model.video.kind === 'file'}
						<!-- svelte-ignore a11y_media_has_caption -->
						<video
							bind:this={videoEl}
							controls
							playsinline
							preload="none"
							poster={model.video.poster ?? undefined}
							src={model.video.src}
							onplay={() => track('click_video')}
						></video>
					{:else if showEmbed}
						<iframe
							src={model.video.src}
							title="Video"
							allow="autoplay; encrypted-media; picture-in-picture"
							allowfullscreen
						></iframe>
					{:else}
						<button
							class="pc-facade"
							type="button"
							style={model.video.poster ? `background-image:url("${model.video.poster.replaceAll('"', '')}")` : ''}
							onclick={playEmbed}
						>
							<i></i>
							<span class="sr">Play video</span>
						</button>
					{/if}
				</div>
			</section>
		{/if}

		{#if model.qrUrl || qrSvg}
			<div class="pc-qr rise">
				<div class="pc-h2">Scan for our products & services</div>
				{#if qrSvg}
					<div class="qr-inline">{@html qrSvg}</div>
				{:else if model.qrUrl}
					<img src={model.qrUrl} alt="QR code for this card" />
				{/if}
				<div class="pc-sample">{model.cardUrl}</div>
			</div>
		{/if}

		{#if model.about || model.mission}
			<section class="pc-section rise">
				<h2 class="pc-h2">About {model.companyName.replace(/ Pte Ltd$/, '')}</h2>
				{#if model.about}<p>{model.about}</p>{/if}
				{#if model.mission}<p>{model.mission}</p>{/if}
			</section>
		{/if}

		{#if model.products.length}
			<section class="pc-section rise">
				<h2 class="pc-h2">Products & services</h2>
				{#each model.products as product}
					<div class="pc-product">
						{#if product.is_example}<span class="ex">Example</span>{/if}
						<div>
							<strong>{product.title}</strong>
							{#if product.description}<span>{product.description}</span>{/if}
						</div>
					</div>
				{/each}
			</section>
		{/if}

		{#if model.socials.length}
			<section class="pc-section rise">
				<h2 class="pc-h2">Social</h2>
				<div class="pc-socials">
					{#each model.socials as link}
						<a class="pc-btn" href={interactive ? link.url : undefined} target="_blank" rel="noopener">{link.label}</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if model.address}
			<section class="pc-section rise">
				<h2 class="pc-h2">Address</h2>
				<p>{model.address}</p>
				{#if model.mapsUrl}
					<a class="pc-btn" href={interactive ? model.mapsUrl : undefined} target="_blank" rel="noopener" onclick={() => track('click_directions')}>Directions</a>
				{/if}
			</section>
		{/if}

		<section class="pc-section rise">
			<button class="pc-btn" type="button" onclick={share}>Share this card</button>
		</section>
		<div class="pc-footer">{model.footer}</div>
	</div>
</article>
{/if}

<style>
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
</style>
