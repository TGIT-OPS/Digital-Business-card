<script lang="ts">
	let { data, form } = $props();
</script>

<div class="page-head">
	<div>
		<h1>Templates</h1>
		<p class="lede">New cards start from each company’s default template.</p>
	</div>
</div>
{#if form?.message}<p class="banner">{form.message}</p>{/if}
<div class="card" style="padding:0">
	<table class="data">
		<thead><tr><th>Name</th><th>Company</th><th>Layout</th><th>Default</th><th></th></tr></thead>
		<tbody>
			{#each data.templates as template}
				<tr>
					<td>{template.name}</td>
					<td>{template.companyName}</td>
					<td>{template.layout}</td>
					<td>{template.is_default ? 'Yes' : ''}</td>
					<td>
						{#if !template.is_default}
							<form method="POST" action="?/default">
								<input type="hidden" name="id" value={template.id} />
								<input type="hidden" name="company_id" value={template.company_id} />
								<button class="btn btn-outline btn-sm" type="submit">Make default</button>
							</form>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="5">No templates yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
<form class="card" method="POST" action="?/create" style="margin-top:16px">
	<h2>Add a template</h2>
	<div class="field"><label for="t-name">Name</label><input id="t-name" name="name" required /></div>
	<div class="field">
		<label for="t-co">Company</label>
		<select id="t-co" name="company_id">
			{#each data.companies as company}<option value={company.id}>{company.name}</option>{/each}
		</select>
	</div>
	<button class="btn btn-primary" type="submit">Add</button>
</form>
