import { defineEnvVars } from '@sveltejs/kit/env';

/** Empty string when unset so `vite build` does not need production secrets. */
function optional(fallback = '') {
	return (value: string | undefined) => {
		const trimmed = value?.trim();
		return trimmed ? trimmed : fallback;
	};
}

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		description: 'Supabase project URL, for example https://xxxx.supabase.co',
		schema: optional('')
	},
	PUBLIC_SUPABASE_ANON_KEY: {
		public: true,
		description: 'Supabase anon key. Protected by row level security.',
		schema: optional('')
	},
	PUBLIC_BASE_URL: {
		public: true,
		description: 'Public origin used in QR codes and shared links.',
		schema: (value: string | undefined) => {
			const trimmed = value?.trim().replace(/\/$/, '');
			return trimmed || 'https://cards.tgitsolutions.com';
		}
	},
	SUPABASE_SERVICE_ROLE_KEY: {
		description: 'Supabase service role key. Server only. Never expose it to the browser.',
		schema: optional('')
	},
	SUPER_ADMIN_EMAIL: {
		description: 'Email address of the sole super admin.',
		schema: (value: string | undefined) => (value ?? '').trim().toLowerCase()
	}
});
