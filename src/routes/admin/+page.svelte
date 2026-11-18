<script lang="ts">
	let { data } = $props();
	const cardFoot = $derived(
		data.cardCount === 1 && data.firstCard
			? `${data.firstCard.name} · ${companyName(data.firstCard.company)}`
			: `${data.cardCount} in the workspace`
	);
	const companyFoot = $derived(data.companyCount === 1 && data.firstCompany ? data.firstCompany.name : `${data.companyCount} companies`);
	function companyName(company: { name: string } | { name: string }[] | null) {
		if (!company) return '';
		return Array.isArray(company) ? company[0]?.name ?? '' : company.name;
	}
</script>

<div class="page-head">
	<div>
		<h1>Dashboard</h1>
		<p class="lede">Your workspace as the sole super admin.</p>
	</div>
	{#if data.recent[0]}
		<a class="btn btn-primary" href="/admin/cards/{data.recent[0].id}">Open {data.recent[0].name}’s card</a>
	{/if}
</div>
<div class="grid-4">
	<div class="card kpi accent">
		<div class="kpi-icon"><svg viewBox="0 0 24 24"><path fill="#000" d="M4 4h16v6H4V4zm0 8h16v8H4v-8zm2 2v4h5v-4H6z"/></svg></div>
		<div class="kpi-label">Cards</div>
		<div class="kpi-value">{data.cardCount}</div>
		<div class="kpi-foot">{cardFoot}</div>
	</div>
	<div class="card kpi accent">
		<div class="kpi-icon"><svg viewBox="0 0 24 24"><path fill="#000" d="M3 21V7h8V3h10v18H3zm2-2h4v-4H5v4zm6 0h4v-4h-4v4zm6 0h4V5h-8v2h4v12z"/></svg></div>
		<div class="kpi-label">Companies</div>
		<div class="kpi-value">{data.companyCount}</div>
		<div class="kpi-foot">{companyFoot}</div>
	</div>
	<div class="card kpi accent">
		<div class="kpi-icon"><svg viewBox="0 0 24 24"><path fill="#000" d="M12 5a7 7 0 017 7h2A9 9 0 003 12h2a7 7 0 017-7zm0 4a3 3 0 013 3h2a5 5 0 00-10 0h2a3 3 0 013-3zm0 8a2 2 0 110-4 2 2 0 010 4z"/></svg></div>
		<div class="kpi-label">Total views</div>
		<div class="kpi-value">{data.views}</div>
		<div class="kpi-foot">{data.views ? 'Across all public cards' : 'No live traffic yet'}</div>
	</div>
	<div class="card kpi accent">
		<div class="kpi-icon"><svg viewBox="0 0 24 24"><path fill="#000" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
		<div class="kpi-label">Contacts saved</div>
		<div class="kpi-value">{data.saves}</div>
		<div class="kpi-foot">{data.saves ? 'vCard downloads' : 'No live traffic yet'}</div>
	</div>
</div>
<div class="section">
	<h2 class="section-title">Recent cards</h2>
	<div class="card" style="padding:0">
		<table class="data">
			<thead><tr><th>Name</th><th>Title</th><th>Company</th><th>Status</th><th></th></tr></thead>
			<tbody>
				{#each data.recent as card}
					<tr>
						<td>{card.name}</td>
						<td>{card.title}</td>
						<td>{card.companyName}</td>
						<td><span class="badge" class:badge-muted={!card.active}>{card.active ? 'Ready' : 'Draft'}</span></td>
						<td><a class="btn btn-outline btn-sm" href="/admin/cards/{card.id}">Edit</a></td>
					</tr>
				{:else}
					<tr><td colspan="5">No cards yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
