<script lang="ts">
	import { onMount } from 'svelte';
	import type { CardView } from '#lib/card-view';

	let {
		model,
		interactive = true,
		trackViews = false,
		showExchange = true,
		fill = false
	}: {
		model: CardView;
		interactive?: boolean;
		trackViews?: boolean;
		showExchange?: boolean;
		fill?: boolean;
	} = $props();

	let flipped = $state(false);
	let reduce = $state(false);
	let leadOpen = $state(false);
	let leadNote = $state('');
	let holding = $state(false);
	let stageW = $state(390);
	let stageH = $state(844);
	let stage: HTMLDivElement | undefined = $state();
	let generation = 0;

	const scale = $derived.by(() => {
		const width = Math.max(stageW, 1);
		const height = Math.max(stageH, 1);
		if (!fill) return Math.min(1, width / 390);
		const byWidth = width / 390;
		if (height / byWidth >= 636) return byWidth;
		return Math.min(byWidth, height / 636);
	});
	const innerH = $derived(fill ? Math.max(636, stageH / scale) : 636);
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
			if (!box) return;
			stageW = box.clientWidth;
			stageH = box.clientHeight || box.clientWidth * (90 / 55);
		};
		measure();
		const observer = new ResizeObserver(measure);
		if (box) observer.observe(box);
		let alive = true;
		const shown = async (ms: number, token: number) => {
			let left = ms;
			while (left > 0) {
				if (!alive || generation !== token) return false;
				if (holding || leadOpen) {
					await sleep(100);
					continue;
				}
				await sleep(100);
				left -= 100;
			}
			return alive && generation === token;
		};
		if (interactive && !reduce) {
			void (async () => {
				while (alive) {
					const token = generation;
					const hold = flipped ? 12000 : 6000;
					if (!(await shown(hold, token))) continue;
					if (!alive || generation !== token) continue;
					flipped = !flipped;
					await shown(1000, generation);
				}
			})();
		}
		const release = () => (holding = false);
		window.addEventListener('pointerup', release);
		window.addEventListener('pointercancel', release);
		return () => {
			alive = false;
			observer.disconnect();
			window.removeEventListener('pointerup', release);
			window.removeEventListener('pointercancel', release);
		};
	});

	function manualFlip(event?: MouseEvent) {
		event?.stopPropagation();
		generation += 1;
		flipped = !flipped;
	}

	function tapFlip(event: MouseEvent) {
		const hit = (event.target as HTMLElement).closest('a[href], button, .front-dock');
		if (hit) return;
		manualFlip();
	}

	async function sendLead(event: SubmitEvent) {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const response = await fetch('/api/leads', { method: 'POST', body: new FormData(form) });
		leadNote = response.ok ? 'Saved. Thank you.' : 'Please check the form and try again.';
		if (response.ok) form.reset();
	}
</script>

<div
	class="flip-stage"
	class:fill
	bind:this={stage}
	style={fill ? '' : `height:${636.3636 * scale}px`}
	onpointerdown={() => (holding = true)}
	onpointerup={() => (holding = false)}
	onpointercancel={() => (holding = false)}
>
	<div class="flip-scale" style="transform:scale({scale}); height:{innerH}px">
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="flipper" class:is-back={flipped} style="height:{innerH}px" onclick={tapFlip}>
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
					</div>
					<svg class="wave-cap" viewBox="0 0 390 90" preserveAspectRatio="none" aria-hidden="true">
						<path fill="#fff" d="M0,80.5 C8,80 32.5,79.6 48.8,77.9 C65,76.3 81,73.6 97.5,70.5 C114,67.5 130,63.5 146,59.5 C162.5,55.5 179,50.8 195,46.5 C211,42.2 227.5,37.5 244,33.5 C260,29.5 276,25.5 292.5,22.5 C309,19.4 325,16.8 341,15.1 C357.5,13.4 382,12.9 390,12.5 L390,90 L0,90 Z" />
						<path d="M0,86.5 C8,86 32.5,85.6 48.8,83.9 C65,82.3 81,79.6 97.5,76.5 C114,73.5 130,69.5 146,65.5 C162.5,61.5 179,56.8 195,52.5 C211,48.2 227.5,43.5 244,39.5 C260,35.5 276,31.5 292.5,28.5 C309,25.4 325,22.8 341,21.1 C357.5,19.4 382,18.9 390,18.5" fill="none" stroke="#FFCF37" stroke-width="1.5" />
						<path d="M0,80.5 C8,80 32.5,79.6 48.8,77.9 C65,76.3 81,73.6 97.5,70.5 C114,67.5 130,63.5 146,59.5 C162.5,55.5 179,50.8 195,46.5 C211,42.2 227.5,37.5 244,33.5 C260,29.5 276,25.5 292.5,22.5 C309,19.4 325,16.8 341,15.1 C357.5,13.4 382,12.9 390,12.5" fill="none" stroke="#FF0000" stroke-width="3.75" />
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
				<div class="front-dock">
					<div class="stripe"><i class="r"></i><i class="g"></i><i class="y"></i></div>
					<div class="front-actions">
						{#if interactive && model.slug}
							<a class="mini" href="/c/{model.slug}/contact.vcf">
								<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10.2l3.2-3.2 1.4 1.4L12 16.9 7.4 11.4l1.4-1.4 3.2 3.2V3h2zm-7 16h14v2H5v-2z"/></svg>
								Save
							</a>
						{:else}
							<span class="mini">
								<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3v10.2l3.2-3.2 1.4 1.4L12 16.9 7.4 11.4l1.4-1.4 3.2 3.2V3h2zm-7 16h14v2H5v-2z"/></svg>
								Save
							</span>
						{/if}
						<button class="mini" type="button" onclick={manualFlip} aria-label="Flip card">
							<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 6V3L8 7l4 4V8a4 4 0 014 4 4 4 0 01-4 4v2a6 6 0 000-12zm-2 8l-4-4 4-4v2a6 6 0 010 12v-2a4 4 0 000-8v2z"/></svg>
							Flip
						</button>
					</div>
					{#if showExchange}
						<button class="exchange" type="button" onclick={() => { if (interactive) leadOpen = true; }}>Exchange Contacts</button>
					{/if}
				</div>
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
					</div>
					<svg class="wave-cap" viewBox="0 0 390 58" preserveAspectRatio="none" aria-hidden="true">
						<path fill="#fff" d="M0,46 C8,45.8 32.5,45.5 48.8,44.5 C65,43.5 81,42 97.5,40 C114,38.3 130,36 146,33.7 C162.5,31.3 179,28.6 195,26 C211,23.5 227.5,20.7 244,18.4 C260,16 276,13.7 292.5,11.9 C309,10 325,8.5 341,7.5 C357.5,6.6 382,6.3 390,6 L390,58 L0,58 Z" />
						<path d="M0,51 C8,50.8 32.5,50.5 48.8,49.5 C65,48.5 81,47 97.5,45 C114,43.3 130,41 146,38.7 C162.5,36.3 179,33.6 195,31 C211,28.5 227.5,25.7 244,23.4 C260,21 276,18.7 292.5,16.9 C309,15 325,13.5 341,12.5 C357.5,11.6 382,11.3 390,11" fill="none" stroke="#FFCF37" stroke-width="1.5" />
						<path d="M0,46 C8,45.8 32.5,45.5 48.8,44.5 C65,43.5 81,42 97.5,40 C114,38.3 130,36 146,33.7 C162.5,31.3 179,28.6 195,26 C211,23.5 227.5,20.7 244,18.4 C260,16 276,13.7 292.5,11.9 C309,10 325,8.5 341,7.5 C357.5,6.6 382,6.3 390,6" fill="none" stroke="#FF0000" stroke-width="3.5" />
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
				<button class="flip-back" type="button" onclick={manualFlip} aria-label="Show the front">
					<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 6V3L8 7l4 4V8a4 4 0 014 4 4 4 0 01-4 4v2a6 6 0 000-12zm-2 8l-4-4 4-4v2a6 6 0 010 12v-2a4 4 0 000-8v2z"/></svg>
				</button>
				<div class="stripe"><i class="r"></i><i class="g"></i><i class="y"></i></div>
			</article>
		</div>
	</div>
</div>

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
	.flip-stage.fill { position: absolute; top: 0; bottom: 0; left: 50%; width: min(390px, 100%); height: auto; transform: translateX(-50%); }
	.flip-scale { width: 390px; height: 636.3636px; transform-origin: top left; }
	.fill .flip-scale { position: absolute; top: 0; left: 0; }
	.flipper { width: 390px; height: 636.3636px; position: relative; transform-style: preserve-3d; transition: transform 1s ease; cursor: pointer; }
	.flipper.is-back { transform: rotateY(180deg); }
	.face { position: absolute; inset: 0; backface-visibility: hidden; background: #fff; overflow: hidden; display: flex; flex-direction: column; }
	.face.back { transform: rotateY(180deg); }
	.v8 { font-family: Selawik, "Segoe UI", Arial, sans-serif; color: #000; }
	.media { position: relative; flex: 1 1 auto; min-height: 168px; z-index: 2; pointer-events: none; }
	.media-clip { position: absolute; inset: 0; overflow: hidden; background: #fff; }
	video, .poster { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
	.poster { display: none; }
	.wave-cap { position: absolute; left: 0; right: 0; bottom: -1px; width: 100%; height: 90px; z-index: 3; }
	.back-media .wave-cap { height: 58px; }
	.logo-corner { position: absolute; top: 32px; right: 32px; z-index: 4; }
	.logo-corner img { height: 40px; width: auto; }
	.motto { position: absolute; top: 80px; right: 32px; z-index: 4; font-weight: 300; font-size: 12px; color: #ff0000; letter-spacing: 0.06em; opacity: 0.68; }
	.body { position: relative; flex: 0 0 auto; padding: 14px 22px; display: flex; flex-direction: column; gap: 14px; z-index: 1; }
	.back-body { padding: 14px 22px; }
	.ident { display: flex; align-items: stretch; gap: 12px; }
	.ident-bar { width: 3px; background: #ff0000; }
	h1 { font-weight: 600; font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; }
	.title { font-size: 17px; line-height: 1.2; margin-top: 6px; }
	.dept { display: inline-block; margin-top: 8px; margin-left: -8px; font-weight: 600; font-size: 13px; line-height: 1.2; background: #ffffe5; border: 1px solid #e6e6e6; padding: 3px 8px; border-radius: 100px; }
	.co { font-style: italic; font-size: 15px; line-height: 1.2; margin-top: 5px; }
	.contacts { list-style: none; border-top: 1px solid #e6e6e6; margin: 0; padding: 0; }
	.contacts li { border-bottom: 1px solid #e6e6e6; }
	.contacts li:last-child { border-bottom: none; }
	.contacts a { display: flex; gap: 10px; align-items: center; padding: 7px 0; text-decoration: none; color: #000; width: 100%; }
	.icon { width: 24px; height: 24px; border-radius: 50%; background: #ffe5e5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	.icon svg { width: 13px; height: 13px; }
	.sub { display: block; font-size: 10.5px; line-height: 1.15; color: rgba(0,0,0,0.6); }
	.value { font-size: 14.5px; line-height: 1.2; }
	.socials { display: flex; gap: 8px; }
	.socials a { width: 28px; height: 28px; border-radius: 50%; background: #ffe5e5; color: #ff0000; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; text-decoration: none; }
	.qr-block { text-align: center; }
	.qr-tile { display: inline-block; border: 1px solid #e6e6e6; border-radius: 6px; padding: 5px; }
	.qr-tile img { width: 86px; height: 86px; }
	.qr-label { font-weight: 600; font-size: 12px; margin-top: 5px; }
	.tagline { font-weight: 600; font-size: 17px; }
	.rule { width: 40px; height: 3px; background: #ff0000; margin: 6px 0 4px; }
	.services { list-style: none; }
	.services li { font-size: 15px; line-height: 1.35; padding: 3px 0 3px 18px; position: relative; }
	.services li::before { content: ""; position: absolute; left: 0; top: 0.55em; width: 8px; height: 8px; background: #ff0000; }
	.addr { border-top: 1px solid #e6e6e6; padding-top: 12px; display: flex; gap: 10px; align-items: center; text-decoration: none; color: #000; }
	.addr strong { display: block; font-size: 15px; }
	.addr-line { font-size: 13px; }
	.stripe { height: 6px; display: flex; }
	.face.back .stripe { position: relative; flex: 0 0 auto; }
	.stripe i { display: block; height: 100%; }
	.r { width: 44%; background: #ff0000; }
	.g { width: 28%; background: #ffcf37; }
	.y { width: 28%; background: #ffffa1; }
	.front-dock { position: relative; flex: 0 0 auto; z-index: 4; background: #fff; }
	.front-actions { display: flex; gap: 8px; padding: 0 22px 10px; }
	.mini {
		flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
		height: 34px; border: 1.5px solid #000; background: #fff; color: #000;
		font: 700 13px/1 Selawik, "Segoe UI", Arial, sans-serif; text-decoration: none; cursor: pointer;
	}
	.mini svg { width: 16px; height: 16px; }
	.exchange {
		display: block; width: 100%; border: 0; background: #ff0000; color: #fff;
		font: 700 16px/1 Selawik, "Segoe UI", Arial, sans-serif; padding: 13px 10px; cursor: pointer;
	}
	.flip-back {
		position: absolute; top: 16px; left: 16px; z-index: 5; width: 36px; height: 36px;
		border: 0; border-radius: 50%; background: #fff; color: #000; cursor: pointer;
		display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 1px #e6e6e6;
	}
	.flip-back svg { width: 18px; height: 18px; }
	.hp { position: absolute; left: -9999px; }
	@media (prefers-reduced-motion: reduce) {
		.flipper { transition: none; }
		video { display: none; }
		.poster { display: block; }
	}
</style>
