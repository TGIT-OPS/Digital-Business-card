<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
	const total = $derived(data.cards.length);
</script>

<div class="page-head">
	<div>
		<div class="eyebrow">Workspace</div>
		<h1>Cards</h1>
		<p class="lede">Search, edit and share a card for each person, across all companies.</p>
	</div>
	<div class="head-actions">
		<a class="btn btn-outline" href="/admin/contacts"><Icon name="upload" size={16} />Import CSV</a>
		<a class="btn btn-primary" href="/admin/cards/new"><Icon name="plus" size={16} />New card</a>
	</div>
</div>
<div class="card" style="padding:0">
	<form class="filters" method="GET" style="padding:14px 18px;margin:0;border-bottom:1px solid var(--grey)">
		<div class="seg">
			<button class:is-on={data.status === ''} name="status" value="">All</button>
			<button class:is-on={data.status === 'ready'} name="status" value="ready">Ready</button>
			<button class:is-on={data.status === 'draft'} name="status" value="draft">Draft</button>
		</div>
		<select name="company" aria-label="Company" onchange={(event) => event.currentTarget.form?.requestSubmit()}>
			<option value="">All companies</option>
			{#each data.companies as company}
				<option value={company.id} selected={data.company === company.id}>{company.name}</option>
			{/each}
		</select>
		<input name="q" value={data.q} placeholder="Search by name" aria-label="Search by name" style="margin-left:auto" />
	</form>
	<table class="data">
		<thead>
			<tr><th style="width:38%">Card</th><th>Labels</th><th>Status</th><th>Views</th><th>Saves</th><th style="text-align:right">Actions</th></tr>
		</thead>
		<tbody>
			{#each data.cards as card}
				<tr>
					<td>
						<div class="who-cell">
							<div class="mini-thumb" aria-hidden="true"><img src="/brand/tgit-hand-poster.jpg" alt="" loading="lazy" /><svg viewBox="0 0 64 12" preserveAspectRatio="none"><path d="M0 6 C16 0 32 12 48 6 S64 2 64 4 V12 H0Z" fill="#fff"/><path d="M0 6 C16 0 32 12 48 6 S64 2 64 4" fill="none" stroke="#FF0000" stroke-width="1.5"/></svg><i></i><i></i><i></i></div>
							<div>
								<b>{card.name}</b>
								<small>{[card.title, card.companyName].filter(Boolean).join(' · ')}</small>
								<a class="url" href="/c/{card.slug}" target="_blank" rel="noopener">/c/{card.slug}</a>
							</div>
						</div>
					</td>
					<td>{#each card.labels ?? [] as l}<span class="tag" style="margin-right:4px">{l}</span>{/each}</td>
					<td><span class="badge" class:badge-muted={!card.active}>{card.active ? 'Ready' : 'Draft'}</span></td>
					<td class="num">{card.views}</td>
					<td class="num">{card.saves}</td>
					<td>
						<div class="rowact">
							<a class="btn btn-outline btn-sm" href="/admin/cards/{card.id}"><Icon name="edit" size={14} />Edit</a>
							<a class="btn btn-outline btn-sm" href="/c/{card.slug}" target="_blank" rel="noopener"><Icon name="ext" size={14} />View public</a>
							<form method="POST" action="/admin/cards/{card.id}?/duplicate"><button class="btn btn-outline btn-sm" type="submit"><Icon name="copy" size={14} />Duplicate</button></form>
						</div>
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="empty-row" style="text-align:center">No cards match.</td></tr>
			{/each}
		</tbody>
	</table>
	{#if total > 0 && total < 3 && !data.q && !data.status && !data.company}
		<div class="empty-team">
			<span class="chip-i pale"><Icon name="users" size={20} /></span>
			<div><b>Add the rest of your team</b><div class="sub">Duplicate a card or import a CSV to create cards for everyone at once.</div></div>
			<a class="btn btn-primary btn-sm" style="margin-left:auto" href="/admin/cards/new"><Icon name="plus" size={14} />New card</a>
		</div>
	{/if}
</div>
