<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
	let video = $state<HTMLVideoElement | null>(null);

	const LABELS: Record<string, [string, string, string]> = {
		view: ['Card viewed', 'eye', 'gold'],
		save: ['Contact saved', 'download', 'pale'],
		click_call: ['Call tapped', 'phone', 'red'],
		click_whatsapp: ['WhatsApp tapped', 'phone', 'red'],
		click_email: ['Email tapped', 'mail', 'red'],
		click_website: ['Website opened', 'ext', 'ink'],
		click_directions: ['Directions opened', 'pin', 'ink'],
		click_share: ['Card shared', 'copy', 'gold'],
		click_video: ['Video played', 'eye', 'ink'],
		lead: ['Contact exchanged', 'inbox', 'red']
	};
	function label(type: string): [string, string, string] {
		return LABELS[type] ?? [type.replace(/^click_/, '').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()), 'sparkle', 'ink'];
	}
	function ago(iso: string) {
		const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
		if (s < 60) return 'just now';
		if (s < 3600) return `${Math.floor(s / 60)} min ago`;
		if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
		return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}
	onMount(() => {
		if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
	});
</script>

<section class="hero">
	<video bind:this={video} autoplay muted loop playsinline preload="metadata" poster="/brand/tgit-hand-poster.jpg" aria-hidden="true">
		<source src="/brand/tgit-hand-loop.mp4" type="video/mp4" />
	</video>
	<div class="copy">
		<div class="eyebrow">Welcome back</div>
		<h1>Your digital business cards, <em>in one place</em></h1>
		<p>Create, share and track digital business cards for your team. Share with a scan, capture every contact.</p>
		<div class="ctas">
			<a class="btn btn-primary" href="/admin/cards/new"><Icon name="plus" size={16} />Create a card</a>
			{#if data.latest}
				<a class="btn btn-outline" href="/c/{data.latest.slug}" target="_blank" rel="noopener"><Icon name="ext" size={16} />View {data.latest.name.split(' ')[0]}’s card</a>
			{/if}
		</div>
	</div>
	<svg class="wave" viewBox="0 0 1200 46" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22 C200 2 400 42 600 22 S1000 2 1200 22 V46 H0Z" fill="#fff"/><path d="M0 22 C200 2 400 42 600 22 S1000 2 1200 22" fill="none" stroke="#FF0000" stroke-width="3"/><path d="M0 29 C200 9 400 49 600 29 S1000 9 1200 29" fill="none" stroke="#FFCF37" stroke-width="1.5"/></svg>
</section>

<div class="grid-4">
	<div class="card kpi"><div class="kpi-icon"><Icon name="card" /></div><div class="kpi-label">Cards</div><div class="kpi-value">{data.cardCount}</div><div class="kpi-foot">{data.readyCount} ready · {data.draftCount} drafts</div></div>
	<div class="card kpi"><div class="kpi-icon gold"><Icon name="eye" /></div><div class="kpi-label">Card views</div><div class="kpi-value">{data.views}</div><div class="kpi-foot">{data.views ? 'All time' : 'No live traffic yet'}</div></div>
	<div class="card kpi"><div class="kpi-icon pale"><Icon name="download" /></div><div class="kpi-label">Contact saves</div><div class="kpi-value">{data.saves}</div><div class="kpi-foot">vCard downloads</div></div>
	<div class="card kpi"><div class="kpi-icon ink"><Icon name="inbox" /></div><div class="kpi-label">Leads</div><div class="kpi-value">{data.leads}</div><div class="kpi-foot"><a href="/admin/contacts">From Exchange Contacts →</a></div></div>
</div>

<div class="grid2">
	<section class="panel">
		<div class="panel-h"><h2>Recent activity</h2><a class="more" href="/admin/analytics">View analytics →</a></div>
		<div class="panel-b">
			<ul class="act">
				{#each data.activity as item}
					{@const [text, icon, tone] = label(item.type)}
					<li><span class="chip-i {tone}"><Icon name={icon} size={16} /></span><div><div class="t">{text}</div><div class="d">{item.name}{item.slug ? ` · /c/${item.slug}` : ''}</div></div><span class="when">{ago(item.at)}</span></li>
				{:else}
					<li class="empty-row">No activity yet. Share a card to see views and saves here.</li>
				{/each}
			</ul>
		</div>
	</section>
	<section class="panel">
		<div class="panel-h"><h2>Quick actions</h2></div>
		<div class="panel-b">
			<div class="qa">
				<a href="/admin/cards/new"><span class="chip-i red"><Icon name="plus" /></span><b>New card</b><small>Build a card with the guided wizard</small></a>
				<a href="/admin/contacts"><span class="chip-i gold"><Icon name="upload" /></span><b>Contacts</b><small>Leads and CSV import or export</small></a>
				<a href="/admin/companies"><span class="chip-i pale"><Icon name="building" /></span><b>Companies</b><small>Logos, colours, services and address</small></a>
				<a href="/admin/assets"><span class="chip-i ink"><Icon name="image" /></span><b>Asset library</b><small>Logos, videos and images</small></a>
			</div>
		</div>
	</section>
</div>

{#if data.services.length}
	<section class="panel section">
		<div class="panel-h"><h2>Our services</h2><span class="sub">Shown on the back of each card</span><a class="more" href="/admin/services">Manage →</a></div>
		<div class="panel-b">
			<div class="svc-grid">
				{#each data.services as service}
					<div class="svc"><img src={service.image} alt="" loading="lazy" decoding="async" width="640" height="480" /><div class="lbl">{service.title}</div></div>
				{/each}
			</div>
		</div>
	</section>
{/if}
