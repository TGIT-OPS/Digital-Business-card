<script lang="ts">
	let { data, form } = $props();
</script>

<div class="page-head">
	<div>
		<h1>Settings</h1>
		<p class="lede">Defaults for new cards. A card can override these in Set-up.</p>
	</div>
</div>
{#if form?.message}<p class="banner">{form.message}</p>{/if}
<form class="card" method="POST" action="?/save">
	<label class="check"><input type="checkbox" name="two_way_share" checked={data.twoWay} /> Two-way contact sharing</label>
	<label class="check"><input type="checkbox" name="track_location" checked={data.trackLocation} /> Track IP location</label>
	<p class="hint">Location uses the country and city Cloudflare already attaches to the request. The IP address is not stored.</p>
	<button class="btn btn-primary" type="submit">Save</button>
</form>
