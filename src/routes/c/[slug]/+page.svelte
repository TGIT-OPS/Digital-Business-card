<script lang="ts">
	import V8Card from '#lib/components/V8Card.svelte';
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.view.name} · {data.view.companyName}</title>
	<meta name="description" content="{data.view.title ? data.view.title + ' at ' : ''}{data.view.companyName}" />
	<link rel="canonical" href={data.view.cardUrl} />
	<meta property="og:title" content="{data.view.name} · {data.view.companyName}" />
	<meta property="og:url" content={data.view.cardUrl} />
	{#if data.view.logoUrl}<meta property="og:image" content={data.view.logoUrl} />{/if}
</svelte:head>

<div class="public-page">
	{#if data.draft}<p class="draft-banner">This card is not public yet.</p>{/if}
	<div class="public-fit">
		<V8Card model={data.view} fill={true} interactive={true} trackViews={data.trackViews} showExchange={data.showExchange} />
	</div>
</div>

<style>
	:global(html:has(.public-page)),
	:global(body:has(.public-page)) {
		height: 100%;
		overflow: hidden;
	}
</style>
