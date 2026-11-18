<script lang="ts">
	let { data, form } = $props();
	const notices: Record<string, string> = {
		setup: 'Supabase is not connected yet.',
		forbidden: 'Only the super admin can sign in.',
		profile: 'The super admin profile could not be saved. Check the service role key.'
	};
</script>

<svelte:head>
	<title>Sign in · TGIT Nexus</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="login-page">
	<div class="blob-gold" aria-hidden="true"></div>
	<div class="blob-pale" aria-hidden="true"></div>
	<div class="blob-red" aria-hidden="true"></div>
	<form class="login-card" method="POST">
		<div class="login-brand">
			<img src="/brand/tgit-logo.png" alt="TGIT" />
			<div class="nexus">NEXUS</div>
		</div>
		<h1>Sign in</h1>
		<p class="login-sub">Digital Business Cards · Super admin</p>
		{#if form?.message}
			<p class="form-error">{form.message}</p>
		{:else if data.notice && notices[data.notice]}
			<p class="form-error">{notices[data.notice]}</p>
		{/if}
		<div class="field">
			<label for="email">Email</label>
			<input id="email" name="email" type="email" autocomplete="username" required value={form && 'email' in form ? form.email : ''} placeholder="you@tgitsolutions.com" />
		</div>
		<div class="field">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" autocomplete="current-password" required />
		</div>
		<button class="btn btn-primary" type="submit">Sign in</button>
		<p class="login-note">Super admin only. There is no public sign-up.</p>
	</form>
</div>
