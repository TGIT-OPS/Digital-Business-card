<script lang="ts">
	let { data } = $props();
</script>

<div class="page-head">
	<div>
		<h1>Analytics</h1>
		<p class="lede">Views, saves and clicks by day. Country and city come from the Cloudflare request, never the IP address.</p>
	</div>
	<a class="btn btn-outline" href="/admin/analytics/export">Download CSV</a>
</div>
<div class="card" style="padding:0">
	<table class="data">
		<thead><tr><th>Day</th><th>Views</th><th>Saves</th><th>Clicks</th><th>Leads</th></tr></thead>
		<tbody>
			{#each data.days as day}
				<tr>
					<td>{day.day}</td>
					<td>{day.views}</td>
					<td>{day.saves}</td>
					<td>{day.clicks}</td>
					<td>{day.leads}</td>
				</tr>
			{:else}
				<tr><td colspan="5">No events yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
<div class="section">
	<h2 class="section-title">Places</h2>
	<div class="card" style="padding:0">
		<table class="data">
			<thead><tr><th>City, country</th><th>Events</th></tr></thead>
			<tbody>
				{#each data.places as place}
					<tr><td>{place.place}</td><td>{place.total}</td></tr>
				{:else}
					<tr><td colspan="2">Location is recorded when Track IP location is on and Cloudflare sends a country or city.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
