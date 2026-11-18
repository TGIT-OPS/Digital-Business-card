<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const path = $derived(page.url.pathname);
	const saved = $derived(page.url.searchParams.get('saved') === '1');
	const nav = $derived(path.startsWith('/admin/cards') ? 'cards' : path.startsWith('/admin/companies') ? 'companies' : 'dashboard');
</script>

<svelte:head>
	<title>TGIT Nexus · Digital Business Cards</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="app-shell">
	<header class="topbar">
		<a class="topbar-brand" href="/admin">
			<img src="/brand/tgit-logo.png" alt="TGIT" />
			<span class="nexus">NEXUS</span>
		</a>
		<div class="topbar-right">
			<div class="who">
				<strong>Super admin</strong>
				<span>Digital Business Cards</span>
			</div>
			<div class="avatar" title="Super admin">SA</div>
		</div>
	</header>
	<aside class="sidebar">
		<nav aria-label="Main">
			<a class="nav-item" class:is-on={nav === 'dashboard'} href="/admin">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 7v-8h8v8h-8z"/></svg>
				Dashboard
			</a>
			<a class="nav-item" class:is-on={nav === 'cards'} href="/admin/cards">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v6H4V4zm0 8h16v8H4v-8zm2 2v4h5v-4H6z"/></svg>
				Cards
			</a>
			<a class="nav-item" class:is-on={nav === 'companies'} href="/admin/companies">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 21V7h8V3h10v18H3zm2-2h4v-4H5v4zm0-6h4v-4H5v4zm6 6h4v-4h-4v4zm0-6h4v-4h-4v4zm6 6h4V5h-8v2h4v12z"/></svg>
				Companies
			</a>
		</nav>
		<form class="signout" method="POST" action="/logout">
			<button class="btn btn-outline btn-sm" type="submit">Sign out</button>
		</form>
	</aside>
	<main class="content">
		{#if saved}<p class="banner">Saved.</p>{/if}
		{@render children()}
	</main>
</div>
