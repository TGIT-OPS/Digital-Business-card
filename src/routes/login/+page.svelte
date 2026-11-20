<script lang="ts">
	import '#lib/admin/admin.css';
	import { onMount } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { SERVICE_IMAGES } from '#lib/admin/services';
	let { data, form } = $props();
	let video = $state<HTMLVideoElement | null>(null);
	const notices: Record<string, string> = {
		setup: 'Supabase is not connected yet.',
		forbidden: 'This account does not have admin access.',
		profile: 'The admin profile could not be saved. Check the service role key.'
	};
	onMount(() => {
		if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) video.pause();
	});
</script>

<svelte:head>
	<title>Sign in · Digital Business Cards</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="login-v2">
	<section class="art">
		<video bind:this={video} autoplay muted loop playsinline preload="metadata" poster="/brand/tgit-hand-poster.jpg" aria-hidden="true">
			<source src="/brand/tgit-hand-loop.mp4" type="video/mp4" />
		</video>
		<svg class="wv" viewBox="0 0 600 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26 C120 4 240 48 360 26 S540 6 600 20" fill="none" stroke="#FF0000" stroke-width="3"/><path d="M0 33 C120 11 240 55 360 33 S540 13 600 27" fill="none" stroke="#FFCF37" stroke-width="1.5"/></svg>
		<div class="artcopy">
			<h1>Your Digital<br />Business Card</h1>
			<p>Create, share and track digital business cards for your team. Share with a scan, capture every contact.</p>
			<ul class="strip">
				{#each SERVICE_IMAGES as service}
					<li><img src={service.image} alt="" loading="lazy" decoding="async" width="640" height="480" /><span>{service.title}</span></li>
				{/each}
			</ul>
		</div>
	</section>
	<section class="form-side">
		<form class="fbox" method="POST">
			<img src="/brand/tgit-logo.png" alt="TGIT" />
			<h2>Sign in</h2>
			<p class="sub">Admin access only. Sign in with your admin account.</p>
			{#if form?.message}
				<p class="err" role="alert">{form.message}</p>
			{:else if data.notice && notices[data.notice]}
				<p class="err" role="alert">{notices[data.notice]}</p>
			{/if}
			<label for="email">Email</label>
			<div class="inp"><Icon name="mail" size={16} /><input id="email" name="email" type="email" autocomplete="username" required value={form && 'email' in form ? form.email : ''} placeholder="name@company.com" /></div>
			<label for="password">Password</label>
			<div class="inp"><Icon name="lock" size={16} /><input id="password" name="password" type="password" autocomplete="current-password" required /></div>
			<button class="btn btn-primary" type="submit">Sign in <Icon name="arrow" size={16} /></button>
			<p class="sec"><Icon name="shield" size={16} />Admin only · there is no public sign-up</p>
		</form>
	</section>
	<div class="lfoot">TGIT Pte Ltd</div>
</div>
