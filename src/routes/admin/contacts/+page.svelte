<script lang="ts">
	let { data, form } = $props();
</script>

<div class="page-head">
	<div>
		<h1>Contact Manager</h1>
		<p class="lede">People who exchanged contacts from a card.</p>
	</div>
	<a class="btn btn-outline" href="/admin/contacts/export">Download CSV</a>
</div>
{#if form?.message}<p class="form-error">{form.message}</p>{/if}
<form class="filters" method="GET">
	<input name="q" value={data.q} placeholder="Search name, email or company" aria-label="Search contacts" />
	<button class="btn btn-outline" type="submit">Search</button>
</form>
<div class="card" style="padding:0">
	<table class="data">
		<thead>
			<tr><th>Name</th><th>Email</th><th>Company</th><th>Phone</th><th>Card</th><th>Place</th><th>Note</th><th></th></tr>
		</thead>
		<tbody>
			{#each data.leads as lead}
				<tr>
					<td>{lead.name}</td>
					<td>{lead.email}</td>
					<td>{lead.company}</td>
					<td>{lead.phone}</td>
					<td>{lead.cardName}</td>
					<td>{[lead.city, lead.country].filter(Boolean).join(', ')}</td>
					<td>
						<form method="POST" action="?/note">
							<input type="hidden" name="id" value={lead.id} />
							<input name="note" value={lead.note ?? ''} aria-label="Note for {lead.name}" />
							<button class="btn btn-outline btn-sm" type="submit">Save</button>
						</form>
					</td>
					<td>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={lead.id} />
							<button class="btn btn-outline btn-sm" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="8">No contacts yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
