<script lang="ts">
	import { storagePublicUrl, formatAddress } from '#lib/format';
	let { data, form } = $props();
	let open = $state(false);
</script>

<div class="page-head">
	<div>
		<h1>Companies</h1>
		<p class="lede">Each company can have its own branding, layout and cards.</p>
	</div>
	<button class="btn btn-primary" type="button" onclick={() => (open = true)}>Add company</button>
</div>
{#if form?.message}<p class="form-error">{form.message}</p>{/if}
{#each data.companies as company}
	<div class="company-row">
		<div class="co-logo">
			{#if company.logo_path}
				<img src={storagePublicUrl(data.supabaseUrl, company.logo_path)} alt="" />
			{:else}
				<strong>{company.name.slice(0, 2).toUpperCase()}</strong>
			{/if}
		</div>
		<div class="meta">
			<h2>{company.name}</h2>
			<p>
				{formatAddress(company) || 'No address yet'}
				· {company.cards?.length ?? 0} card{company.cards?.length === 1 ? '' : 's'}
				{#if !company.active} · Inactive{/if}
			</p>
		</div>
		<a class="btn btn-outline" href="/admin/companies/{company.id}">Company settings</a>
	</div>
{:else}
	<div class="card"><p>No companies yet.</p></div>
{/each}

{#if open}
	<div class="modal-back" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) open = false; }}>
		<form class="modal" method="POST" action="?/create">
			<h1>Add company</h1>
			<p class="hint">You can add other companies later, each with its own layout, colours and cards.</p>
			<div class="field"><label>Company name</label><input name="name" required placeholder="Company name" /></div>
			<div style="display:flex;gap:8px;justify-content:flex-end">
				<button class="btn btn-outline" type="button" onclick={() => (open = false)}>Cancel</button>
				<button class="btn btn-primary" type="submit">Create company</button>
			</div>
		</form>
	</div>
{/if}
