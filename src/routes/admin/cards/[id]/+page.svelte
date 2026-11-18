<script lang="ts">
	import CardEditor from '#lib/components/CardEditor.svelte';
	let { data, form } = $props();
</script>

<CardEditor
	card={data.card}
	companies={data.companies}
	baseUrl={data.baseUrl}
	supabaseUrl={data.supabaseUrl}
	analytics={data.analytics}
	message={form?.message ?? ''}
/>
