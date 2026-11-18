<script lang="ts">
	import CardEditor from '#lib/components/CardEditor.svelte';
	let { data, form } = $props();
</script>

<CardEditor companies={data.companies} baseUrl={data.baseUrl} supabaseUrl={data.supabaseUrl} message={form?.message ?? ''} />
