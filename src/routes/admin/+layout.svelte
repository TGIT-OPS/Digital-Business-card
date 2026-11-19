<script lang="ts">
	import { page } from '$app/state';
	let { children } = $props();
	const path = $derived(page.url.pathname);
	const saved = $derived(page.url.searchParams.get('saved') === '1');
	const nav = $derived(
		path.startsWith('/admin/cards') ? 'cards'
		: path.startsWith('/admin/companies') ? 'companies'
		: path.startsWith('/admin/contacts') ? 'contacts'
		: path.startsWith('/admin/analytics') ? 'analytics'
		: path.startsWith('/admin/assets') ? 'assets'
		: path.startsWith('/admin/templates') ? 'templates'
		: path.startsWith('/admin/settings') ? 'settings'
		: path.startsWith('/admin/help') ? 'help'
		: 'overview'
	);
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
			<a class="nav-item" class:is-on={nav === 'overview'} href="/admin">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 7v-8h8v8h-8z"/></svg>
				Overview
			</a>
			<a class="nav-item" class:is-on={nav === 'contacts'} href="/admin/contacts">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H5z"/></svg>
				Contacts
			</a>
			<a class="nav-item" class:is-on={nav === 'analytics'} href="/admin/analytics">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 19h16v2H4v-2zM6 10h3v7H6v-7zm5-6h3v13h-3V4zm5 9h3v4h-3v-4z"/></svg>
				Analytics
			</a>
			<a class="nav-item" class:is-on={nav === 'assets'} href="/admin/assets">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"/></svg>
				Assets
			</a>
			<a class="nav-item" class:is-on={nav === 'templates'} href="/admin/templates">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z"/></svg>
				Templates
			</a>
			<a class="nav-item" class:is-on={nav === 'cards'} href="/admin/cards">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16v6H4V4zm0 8h16v8H4v-8zm2 2v4h5v-4H6z"/></svg>
				Cards
			</a>
			<a class="nav-item" class:is-on={nav === 'companies'} href="/admin/companies">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 21V7h8V3h10v18H3zm2-2h4v-4H5v4zm0-6h4v-4H5v4zm6 6h4v-4h-4v4zm0-6h4v-4h-4v4zm6 6h4V5h-8v2h4v12z"/></svg>
				Companies
			</a>
			<a class="nav-item" class:is-on={nav === 'settings'} href="/admin/settings">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.8 7.8 0 000-2l2-1.2-2-3.4-2.2.6a8 8 0 00-1.7-1L15 4h-4l-.5 2a8 8 0 00-1.7 1L6.6 6.4l-2 3.4L6.6 11a7.8 7.8 0 000 2l-2 1.2 2 3.4 2.2-.6a8 8 0 001.7 1l.5 2h4l.5-2a8 8 0 001.7-1l2.2.6 2-3.4-2-1.2zM12 15.2A3.2 3.2 0 1112 8.8a3.2 3.2 0 010 6.4z"/></svg>
				Settings
			</a>
			<a class="nav-item" class:is-on={nav === 'help'} href="/admin/help">
				<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm1.1-6.5l-.9.9A2.5 2.5 0 0012 14h-1v-.5c0-.8.3-1.5.9-2.1l1.2-1.2a1.5 1.5 0 10-2.5-1.1H9a3.5 3.5 0 116.1 2.4z"/></svg>
				Help
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
