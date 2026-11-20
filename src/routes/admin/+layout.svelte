<script lang="ts">
	import '#lib/admin/admin.css';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	let { children, data } = $props();
	const path = $derived(page.url.pathname);
	const saved = $derived(page.url.searchParams.get('saved') === '1');
	const nav = $derived(
		path.startsWith('/admin/cards') ? 'cards'
		: path.startsWith('/admin/companies') ? 'companies'
		: path.startsWith('/admin/contacts') ? 'contacts'
		: path.startsWith('/admin/analytics') ? 'analytics'
		: path.startsWith('/admin/assets') ? 'assets'
		: path.startsWith('/admin/templates') ? 'templates'
		: path.startsWith('/admin/services') ? 'services'
		: path.startsWith('/admin/settings') ? 'settings'
		: path.startsWith('/admin/help') ? 'help'
		: 'overview'
	);
	const groups = [
		{ label: 'Workspace', items: [
			{ id: 'overview', href: '/admin', icon: 'home', label: 'Overview' },
			{ id: 'cards', href: '/admin/cards', icon: 'card', label: 'Cards' },
			{ id: 'contacts', href: '/admin/contacts', icon: 'users', label: 'Contacts' },
			{ id: 'analytics', href: '/admin/analytics', icon: 'chart', label: 'Analytics' }
		] },
		{ label: 'Library', items: [
			{ id: 'assets', href: '/admin/assets', icon: 'image', label: 'Assets' },
			{ id: 'templates', href: '/admin/templates', icon: 'layout', label: 'Templates' },
			{ id: 'services', href: '/admin/services', icon: 'sparkle', label: 'Services' }
		] },
		{ label: 'Admin', items: [
			{ id: 'companies', href: '/admin/companies', icon: 'building', label: 'Companies' },
			{ id: 'settings', href: '/admin/settings', icon: 'gear', label: 'Settings' },
			{ id: 'help', href: '/admin/help', icon: 'help', label: 'Help' }
		] }
	];
	const current = $derived(groups.flatMap((g) => g.items).find((item) => item.id === nav)?.label ?? 'Overview');
	const initials = $derived((data.email ?? 'SA').slice(0, 2).toUpperCase());
</script>

<svelte:head>
	<title>{current} · Digital Business Cards</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="app-shell">
	<aside class="sidebar">
		<a class="side-logo" href="/admin"><img src="/brand/tgit-logo.png" alt="TGIT" /></a>
		<nav aria-label="Main">
			{#each groups as group}
				<div class="nav-label">{group.label}</div>
				{#each group.items as item}
					<a class="nav-item" class:is-on={nav === item.id} href={item.href} aria-current={nav === item.id ? 'page' : undefined}>
						<Icon name={item.icon} />{item.label}
					</a>
				{/each}
			{/each}
		</nav>
		<div class="side-foot">
			<div class="avatar" aria-hidden="true">{initials}</div>
			<div class="who"><b title={data.email}>{data.email}</b><small>Super admin</small></div>
			<form method="POST" action="/logout"><button type="submit" title="Sign out" aria-label="Sign out"><Icon name="logout" /></button></form>
		</div>
	</aside>
	<header class="topbar">
		<a class="top-logo" href="/admin"><img src="/brand/tgit-logo.png" alt="TGIT" /></a>
		<div class="crumbs"><a class="ws" href="/admin/companies"><Icon name="building" size={14} />All companies</a><span>/</span><b>{current}</b></div>
		<form class="top-search" method="GET" action="/admin/cards" role="search">
			<Icon name="search" size={16} />
			<input name="q" placeholder="Search cards…" aria-label="Search cards" />
		</form>
		<a class="btn btn-primary" href="/admin/cards/new"><Icon name="plus" size={16} />New card</a>
	</header>
	<main class="content">
		{#if saved}<p class="banner" style="margin-bottom:16px">Saved.</p>{/if}
		{@render children()}
	</main>
	<nav class="mtab" aria-label="Quick">
		<a class:is-on={nav === 'overview'} href="/admin"><Icon name="home" size={20} />Overview</a>
		<a class:is-on={nav === 'cards'} href="/admin/cards"><Icon name="card" size={20} />Cards</a>
		<a class:is-on={nav === 'contacts'} href="/admin/contacts"><Icon name="users" size={20} />Contacts</a>
		<a class:is-on={nav === 'analytics'} href="/admin/analytics"><Icon name="chart" size={20} />Analytics</a>
		<details class="more-menu">
			<summary class:is-on={!['overview', 'cards', 'contacts', 'analytics'].includes(nav)}><Icon name="more" size={20} />More</summary>
			<div class="sheet">
				{#each groups.flatMap((g) => g.items).slice(4) as item}
					<a class:is-on={nav === item.id} href={item.href}><Icon name={item.icon} />{item.label}</a>
				{/each}
				<form method="POST" action="/logout"><button type="submit"><Icon name="logout" />Sign out</button></form>
			</div>
		</details>
	</nav>
</div>
