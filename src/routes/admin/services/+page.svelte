<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	let { data } = $props();
</script>

<div class="page-head">
	<div>
		<div class="eyebrow">Library</div>
		<h1>Services</h1>
		<p class="lede">The services listed under “Our Services” on the back of each card, per company.</p>
	</div>
</div>

{#each data.companies as company}
	<section class="panel section">
		<div class="panel-h">
			<h2>{company.name}</h2>
			<span class="sub">{company.services.length} {company.services.length === 1 ? 'service' : 'services'}</span>
			<a class="btn btn-outline btn-sm" style="margin-left:auto" href="/admin/companies/{company.id}"><Icon name="edit" size={14} />Edit services</a>
		</div>
		<div class="panel-b">
			{#if company.services.length}
				<div class="svc-grid svc-big">
					{#each company.services as service, i}
						<div class="svc" style="position:relative">
							<img src={service.image} alt="" loading="lazy" decoding="async" width="640" height="480" />
							<span class="ord">{String(i + 1).padStart(2, '0')}</span>
							<div class="lbl"><div>{service.title}{#if service.description}<small>{service.description}</small>{/if}</div><span class="badge" class:badge-muted={service.example}>{service.example ? 'Example' : 'On card'}</span></div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-row">No services yet. Add them on the company page.</p>
			{/if}
		</div>
	</section>
{:else}
	<div class="card">No companies yet.</div>
{/each}
<p class="hint" style="margin-top:14px">Images are picked automatically from the service name. Service text is edited on each company page.</p>
