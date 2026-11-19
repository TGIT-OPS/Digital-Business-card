<script lang="ts">
	let { data, form } = $props();
	let copied = $state('');

	async function copy(url: string) {
		await navigator.clipboard.writeText(url);
		copied = url;
	}
</script>

<div class="page-head">
	<div>
		<h1>Asset Library</h1>
		<p class="lede">Files in the media bucket. Videos stay under 8 MB.</p>
	</div>
</div>
{#if form?.message}<p class="banner">{form.message}</p>{/if}
<form class="card" method="POST" action="?/upload" enctype="multipart/form-data">
	<div class="field"><label for="asset">Upload</label><input id="asset" name="file" type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4" required /></div>
	<button class="btn btn-primary" type="submit">Upload</button>
</form>
<div class="card" style="padding:0;margin-top:16px">
	<table class="data">
		<thead><tr><th>File</th><th>Size</th><th></th></tr></thead>
		<tbody>
			{#each data.files as file}
				<tr>
					<td>{file.path}</td>
					<td>{Math.ceil(file.size / 1024)} KB</td>
					<td style="display:flex;gap:8px">
						{#if file.url}<button class="btn btn-outline btn-sm" type="button" onclick={() => copy(file.url!)}>{copied === file.url ? 'Copied' : 'Copy URL'}</button>{/if}
						<form method="POST" action="?/delete">
							<input type="hidden" name="path" value={file.path} />
							<button class="btn btn-outline btn-sm" type="submit">Delete</button>
						</form>
					</td>
				</tr>
			{:else}
				<tr><td colspan="3">No files yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
