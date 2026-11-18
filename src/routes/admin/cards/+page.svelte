<script lang="ts">
	let { data } = $props();
</script>

<div class="page-head">
	<div>
		<h1>Cards</h1>
		<p class="lede">Search, edit and share a card for each person.</p>
	</div>
	<a class="btn btn-primary" href="/admin/cards/new">New card</a>
</div>
<form class="filters" method="GET">
	<input name="q" value={data.q} placeholder="Search by name" aria-label="Search by name" />
	<select name="company" aria-label="Company" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
		<option value="">All companies</option>
		{#each data.companies as company}
			<option value={company.id} selected={data.company === company.id}>{company.name}</option>
		{/each}
	</select>
	<div class="seg">
		<button class:is-on={data.status === ''} name="status" value="">All</button>
		<button class:is-on={data.status === 'ready'} name="status" value="ready">Ready</button>
		<button class:is-on={data.status === 'draft'} name="status" value="draft">Draft</button>
	</div>
</form>
<div class="card" style="padding:0">
	<table class="data">
		<thead>
			<tr><th>Name</th><th>Title</th><th>Company</th><th>Status</th><th>Views</th><th>Saves</th><th></th></tr>
		</thead>
		<tbody>
			{#each data.cards as card}
				<tr>
					<td>{card.name}</td>
					<td>{card.title}</td>
					<td>{card.companyName}</td>
					<td><span class="badge" class:badge-muted={!card.active}>{card.active ? 'Ready' : 'Draft'}</span></td>
					<td>{card.views}</td>
					<td>{card.saves}</td>
					<td style="display:flex;gap:8px">
						<a class="btn btn-outline btn-sm" href="/admin/cards/{card.id}">Edit</a>
						<a class="btn btn-outline btn-sm" href="/c/{card.slug}" target="_blank" rel="noopener">View public</a>
					</td>
				</tr>
			{:else}
				<tr><td colspan="7">No cards match.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
