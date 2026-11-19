<script lang="ts">
	import { onMount } from 'svelte';
	import type { CardView } from '#lib/card-view';

	let {
		model,
		interactive = true,
		trackViews = false,
		showExchange = true
	}: {
		model: CardView;
		interactive?: boolean;
		trackViews?: boolean;
		showExchange?: boolean;
	} = $props();

	let flipped = $state(false);
	let reduce = $state(false);
	let leadOpen = $state(false);
	let leadNote = $state('');
	let stageWidth = $state(390);
	let stage: HTMLDivElement | undefined = $state();
	let stop = false;

	const scale = $derived(Math.min(1, stageWidth / 390));
	const qrSrc = $derived(
		model.slug ? `/c/${model.slug}/qr.png?template=${model.qrTemplate || 'logo'}` : null
	);

	function track(event: string) {
		if (!interactive || !model.slug) return;
		const body = JSON.stringify({ slug: model.slug, event });
		if (navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
		else fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
	}

	function sleep(ms: number) {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}

	onMount(() => {
		reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (trackViews) track('view');
		const box = stage;
		const measure = () => {
			if (box) stageWidth = box.clientWidth;
		};
		measure();
		const observer = new ResizeObserver(measure);
		if (box) observer.observe(box);
		let alive = true;
		if (interactive && !reduce) {
			void (async () => {
				while (alive && !stop) {
					flipped = false;
					await sleep(6000);
					if (!alive || stop) break;
					flipped = true;
					await sleep(13000);
					if (!alive || stop) break;
					flipped = false;
					await sleep(1000);
				}
			})();
		}
		return () => {
			alive = false;
			observer.disconnect();
		};
	});

	function tapFlip(event: MouseEvent) {
		const hit = (event.target as HTMLElement).closest('a[href], button');
		if (hit) return;
		stop = true;
		flipped = !flipped;
	}

	async function sendLead(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const response = await fetch('/api/leads', { method: 'POST', body: new FormData(form) });
		leadNote = response.ok ? 'Saved. Thank you.' : 'Please check the form and try again.';
		if (response.ok) form.reset();
	}
</script>

<div class="flip-stage" bind:this={stage} style="height:{636.3636 * scale}px">
	<div class="flip-scale" style="transform:scale({scale})">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="flipper" class:is-back={flipped} onclick={tapFlip}>
			<article class="v8 face front">
				<div class="media">
					<div class="media-clip">
						{#if model.theme?.poster}<img class="poster" src={model.theme.poster} alt="" />{/if}
						{#if model.theme?.kind === 'video' && !reduce}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video autoplay muted loop playsinline poster={model.theme.poster ?? undefined}>
								<source src={model.theme.src} type="video/mp4" />
							</video>
						{:else if model.theme?.kind === 'gif' && !reduce}
							<img class="poster" src={model.theme.src} alt="" style="display:block" />
						{/if}
						<div class="media-fade"></div>
					</div>
					<svg class="wave-line" viewBox="0 0 390 386" preserveAspectRatio="none" aria-hidden="true">
						<path d="M 0,380.5 C 8,380 32.5,379.6 48.8,377.9 C 65,376.3 81,373.6 97.5,370.5 C 114,367.5 130,363.5 146,359.5 C 162.5,355.5 179,350.8 195,346.5 C 211,342.2 227.5,337.5 244,333.5 C 260,329.5 276,325.5 292.5,322.5 C 309,319.4 325,316.8 341,315.1 C 357.5,313.4 382,312.9 390,312.5" fill="none" stroke="#FFCF37" stroke-width="1.5" />
						<path d="M 0,374.5 C 8,374 32.5,373.6 48.8,371.9 C 65,370.3 81,367.6 97.5,364.5 C 114,361.5 130,357.5 146,353.5 C 162.5,349.5 179,344.8 195,340.5 C 211,336.2 227.5,331.5 244,327.5 C 260,323.5 276,319.5 292.5,316.5 C 309,313.4 325,310.8 341,309.1 C 357.5,307.4 382,306.9 390,306.5" fill="none" stroke="#FF0000" stroke-width="3.75" />
					</svg>
					{#if model.logoUrl}<div class="logo-corner"><img src={model.logoUrl} alt="" /></div>{/if}
					<p class="motto">{model.tagline || 'Transforming IT into reality'}</p>
				</div>
				<div class="body">
					<div class="ident">
						<div class="ident-bar"></div>
						<div>
							<h1>{model.name}</h1>
							{#if model.title}<div class="title">{model.title}</div>{/if}
							{#if model.department}<div class="dept">{model.department}</div>{/if}
							<div class="co">{model.companyName}</div>
						</div>
					</div>
					<ul class="contacts">
						{#if model.phone}
							<li>
								<a href={interactive ? model.whatsappUrl || model.telUrl : undefined}>
									<span class="icon"><svg viewBox="0 0 24 24"><path fill="#FF0000" d="M6.62 10.79a15 15 0 006.59 6.59l2.2-2.2a1 1 0 011-.24 11 11 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.57 3.58 1 1 0 01-.24 1z"/></svg></span>
									<span class="txt"><span class="sub">WhatsApp / Call</span><span class="value">{model.phone}</span></span>
								</a>
							</li>
						{/if}
						{#if model.email}
							<li>
								<a href={interactive ? model.mailUrl : undefined}>
									<span class="icon"><svg viewBox="0 0 24 24"><path fill="#FF0000" d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5z"/></svg></span>
									<span class="txt"><span class="sub">Email us</span><span class="value">{model.email}</span></span>
								</a>
							</li>
						{/if}
						{#if model.websiteLabel}
							<li>
								<a href={interactive ? model.websiteUrl : undefined} target="_blank" rel="noopener">
									<span class="icon"><svg viewBox="0 0 24 24"><path fill="#FF0000" d="M12 2a10 10 0 100 20 10 10 0 000-20zm7 9h-3a15 15 0 00-1-5 8 8 0 014 5zM12 4c.7 1 1.3 3 1.6 5h-3.2C10.7 7 11.3 5 12 4zM4 13a8 8 0 010-2h3.3a17 17 0 000 2H4z"/></svg></span>
									<span class="txt"><span class="sub">Visit us</span><span class="value">{model.websiteLabel}</span></span>
								</a>
							</li>
						{/if}
					</ul>
					{#if model.socials.length}
						<div class="socials">
							{#each model.socials as link}
								<a href={link.url} target="_blank" rel="noopener" title={link.label}>{link.label.slice(0, 1)}</a>
							{/each}
						</div>
					{/if}
				</div>
				<div class="stripe"><i class="r"></i><i class="g"></i><i class="y"></i></div>
			</article>

			<article class="v8 face back">
				<div class="media back-media">
					<div class="media-clip back-clip">
						{#if model.theme?.poster}<img class="poster" src={model.theme.poster} alt="" />{/if}
						{#if model.theme?.kind === 'video' && !reduce}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video autoplay muted loop playsinline poster={model.theme.poster ?? undefined}>
								<source src={model.theme.src} type="video/mp4" />
							</video>
						{/if}
						<div class="media-fade back-fade"></div>
					</div>
					<svg class="wave-line" viewBox="0 0 390 262" preserveAspectRatio="none" aria-hidden="true">
						<path d="M 0,259 C 8,258.8 32.5,258.5 48.8,257.5 C 65,256.5 81,255 97.5,253 C 114,251.3 130,249 146,246.7 C 162.5,244.3 179,241.6 195,239 C 211,236.5 227.5,233.7 244,231.4 C 260,229 276,226.7 292.5,224.9 C 309,223 325,221.5 341,220.5 C 357.5,219.6 382,219.3 390,219" fill="none" stroke="#FFCF37" stroke-width="1.5" />
						<path d="M 0,254 C 8,253.8 32.5,253.5 48.8,252.5 C 65,251.5 81,250 97.5,248 C 114,246.3 130,244 146,241.7 C 162.5,239.3 179,236.6 195,234 C 211,231.5 227.5,228.7 244,226.4 C 260,224 276,221.7 292.5,219.9 C 309,218 325,216.5 341,215.5 C 357.5,214.6 382,214.3 390,214" fill="none" stroke="#FF0000" stroke-width="3.5" />
					</svg>
					{#if model.logoUrl}<div class="logo-corner"><img src={model.logoUrl} alt="" /></div>{/if}
					<p class="motto">{model.tagline || 'Transforming IT into reality'}</p>
				</div>
				<div class="body back-body">
					<div class="qr-block">
						<div class="qr-tile">
							{#if qrSrc}<img src={qrSrc} alt="QR code for this card" />{/if}
						</div>
						<div class="qr-label">Scan to view our company profile</div>
					</div>
					<div class="tagline">Our Services</div>
					<div class="rule"></div>
					<ul class="services">
						{#each model.products as item}
							{#if !item.is_example}<li>{item.title}</li>{/if}
						{/each}
					</ul>
					{#if model.address}
						<a class="addr" href={interactive ? model.mapsUrl : undefined} target="_blank" rel="noopener">
							<span class="icon"><svg viewBox="0 0 24 24"><path fill="#FF0000" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5 2.5 2.5 0 0112 11.5z"/></svg></span>
							<span>
								<strong>{model.companyName}</strong>
								<span class="addr-line">{model.addressLines.join(', ')}{#if model.uen} · UEN {model.uen}{/if}</span>
							</span>
						</a>
					{/if}
				</div>
				<div class="stripe"><i class="r"></i><i class="g"></i><i class="y"></i></div>
			</article>
		</div>
	</div>
</div>

{#if interactive}
	<div class="under-card">
		{#if model.slug}<a class="btn btn-outline" href="/c/{model.slug}/contact.vcf">Save Contact</a>{/if}
		<button class="btn btn-outline" type="button" onclick={() => (flipped = !flipped)}>Flip card</button>
	</div>
{/if}

{#if interactive && showExchange}
	<button class="exchange" type="button" onclick={() => (leadOpen = true)}>Exchange Contacts</button>
{/if}

{#if leadOpen}
	<div class="modal-back" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) leadOpen = false; }}>
		<form class="modal" onsubmit={sendLead}>
			<h1>Exchange contacts</h1>
			<p class="hint">Share your details with {model.name}.</p>
			<input class="hp" name="company_url" tabindex="-1" autocomplete="off" />
			<input type="hidden" name="slug" value={model.slug} />
			<div class="field"><label>Name</label><input name="name" required /></div>
			<div class="field"><label>Email</label><input name="email" type="email" required /></div>
			<div class="field"><label>Company</label><input name="company" required /></div>
			<div class="field"><label>Phone</label><input name="phone" /></div>
			<div class="field"><label>Note</label><textarea name="note" rows="3"></textarea></div>
			<label class="check"><input type="checkbox" name="consent" /> I agree to be contacted about this introduction.</label>
			{#if leadNote}<p class="hint">{leadNote}</p>{/if}
			<div style="display:flex;gap:8px;justify-content:flex-end">
				<button class="btn btn-outline" type="button" onclick={() => (leadOpen = false)}>Close</button>
				<button class="btn btn-primary" type="submit">Send</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.flip-stage { width: min(390px, 100%); margin: 0 auto; position: relative; }
	.flip-scale { width: 390px; height: 636.3636px; transform-origin: top left; }
	.flipper { width: 390px; height: 636.3636px; position: relative; transform-style: preserve-3d; transition: transform 1s ease; cursor: pointer; }
	.flipper.is-back { transform: rotateY(180deg); }
	.face { position: absolute; inset: 0; backface-visibility: hidden; background: #fff; overflow: hidden; }
	.face.back { transform: rotateY(180deg); }
	.v8 { font-family: Selawik, "Segoe UI", Arial, sans-serif; color: #000; }
	.media { position: absolute; left: 0; top: 0; right: 0; height: 386px; z-index: 2; pointer-events: none; }
	.back-media { height: 262px; }
	.media-clip { position: absolute; inset: 0; overflow: hidden; background: #fff; clip-path: path("M0,0 L390,0 L390,306.5 C357.5,307.4 308.75,313.4 292.5,316.5 C260,323.5 211.25,336.2 195,340.5 C162.5,349.5 113.75,361.5 97.5,364.5 C65,370.3 8.12,374.1 0,374.5 Z"); }
	.back-clip { clip-path: path("M0,0 L390,0 L390,214 C357.5,214.6 308.75,218 292.5,219.9 C260,224 211.25,231.5 195,234 C162.5,239.3 113.75,246.3 97.5,248.1 C65,251.5 8.12,253.8 0,254 Z"); }
	video, .poster { position: absolute; top: 0; left: 0; width: 390px; height: 292.5px; object-fit: fill; }
	.back-clip video, .back-clip .poster { top: -69px; }
	.poster { display: none; }
	.media-fade { position: absolute; left: 0; top: 228px; width: 390px; height: 72px; background: linear-gradient(to bottom, rgba(255,255,255,0), #fff); }
	.back-fade { top: 145px; height: 100px; }
	.wave-line { position: absolute; left: 0; top: 0; width: 390px; height: 386px; }
	.back-media .wave-line { height: 262px; }
	.logo-corner { position: absolute; top: 32px; right: 32px; z-index: 4; }
	.logo-corner img { height: 40px; width: auto; }
	.motto { position: absolute; top: 80px; right: 32px; z-index: 4; font-weight: 300; font-size: 12px; color: #ff0000; letter-spacing: 0.06em; opacity: 0.68; }
	.body { position: absolute; inset: 0; padding: 390px 22px 26px; display: flex; flex-direction: column; z-index: 1; }
	.back-body { padding: 256px 22px 22px; }
	.ident { display: flex; align-items: stretch; gap: 12px; margin-bottom: 4px; }
	.ident-bar { width: 3px; background: #ff0000; }
	h1 { font-weight: 600; font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; }
	.title { font-size: 17px; line-height: 1.2; margin-top: 6px; }
	.dept { display: inline-block; margin-top: 8px; font-weight: 600; font-size: 13px; line-height: 1.2; background: #ffffe5; border: 1px solid #e6e6e6; padding: 3px 8px; border-radius: 100px; }
	.co { font-style: italic; font-size: 15px; line-height: 1.2; margin-top: 5px; }
	.contacts { list-style: none; border-top: 1px solid #e6e6e6; margin-top: auto; padding: 2px 0; }
	.contacts li { border-bottom: 1px solid #e6e6e6; }
	.contacts li:last-child { border-bottom: none; }
	.contacts a { display: flex; gap: 10px; align-items: center; padding: 1px 0; text-decoration: none; color: #000; width: 100%; }
	.icon { width: 24px; height: 24px; border-radius: 50%; background: #ffe5e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.icon svg { width: 13px; height: 13px; }
	.sub { display: block; font-size: 10.5px; line-height: 1.15; color: rgba(0,0,0,0.6); }
	.value { font-size: 14.5px; line-height: 1.2; }
	.socials { display: flex; gap: 8px; margin-top: 8px; }
	.socials a { width: 28px; height: 28px; border-radius: 50%; background: #ffe5e5; color: #ff0000; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none; }
	.qr-block { text-align: center; }
	.qr-tile { display: inline-block; border: 1px solid #e6e6e6; border-radius: 6px; padding: 5px; }
	.qr-tile img { width: 86px; height: 86px; }
	.qr-label { font-weight: 600; font-size: 12px; margin-top: 5px; }
	.tagline { font-weight: 600; font-size: 17px; margin-top: 8px; }
	.rule { width: 40px; height: 3px; background: #ff0000; margin: 6px 0; }
	.services { list-style: none; }
	.services li { font-size: 15px; padding: 2px 0 2px 18px; position: relative; }
	.services li::before { content: ""; position: absolute; left: 0; top: 0.55em; width: 8px; height: 8px; background: #ff0000; }
	.addr { margin-top: auto; border-top: 1px solid #e6e6e6; padding-top: 8px; display: flex; gap: 10px; align-items: center; text-decoration: none; color: #000; }
	.addr strong { display: block; font-size: 15px; }
	.addr-line { font-size: 13px; }
	.stripe { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; display: flex; z-index: 3; }
	.stripe i { display: block; height: 100%; }
	.r { width: 44%; background: #ff0000; }
	.g { width: 28%; background: #ffcf37; }
	.y { width: 28%; background: #ffffa1; }
	.under-card { max-width: 390px; margin: 12px auto; display: flex; gap: 8px; justify-content: center; }
	.exchange { position: sticky; bottom: 0; display: block; width: min(390px, 100%); margin: 12px auto 0; background: #ff0000; color: #000; border: 0; font: 700 16px/1.2 Selawik, "Segoe UI", Arial, sans-serif; padding: 14px; cursor: pointer; z-index: 5; }
	.hp { position: absolute; left: -9999px; }
	@media (prefers-reduced-motion: reduce) {
		.flipper { transition: none; }
		video { display: none; }
		.poster { display: block; }
	}
</style>
