import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { SUPABASE_SERVICE_ROLE_KEY, SUPER_ADMIN_EMAIL } from '$app/env/private';

export function superAdminEmail() {
	return SUPER_ADMIN_EMAIL;
}

export function serviceClient(): SupabaseClient | null {
	if (!PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

export function anonClient(): SupabaseClient | null {
	if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) return null;
	return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});
}

export async function ensureSuperAdmin(user: User, userClient: SupabaseClient | null) {
	const email = superAdminEmail();
	if (!email || (user.email ?? '').toLowerCase() !== email) return false;
	const service = serviceClient();
	if (!service) {
		if (!userClient) return false;
		const { data } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
		return data?.role === 'super_admin';
	}
	await service.from('profiles').update({ role: 'user' }).eq('role', 'super_admin').neq('id', user.id);
	const { error } = await service.from('profiles').upsert({
		id: user.id,
		email,
		role: 'super_admin'
	});
	return !error;
}

export async function requireAdmin(locals: App.Locals) {
	if (!locals.supabase) return null;
	const user = await locals.getUser();
	if (!user) return null;
	const ok = await ensureSuperAdmin(user, locals.supabase);
	return ok ? locals.supabase : null;
}

export async function recordEvent(
	cardId: string,
	eventType: string,
	place?: { country?: string | null; city?: string | null }
) {
	const service = serviceClient();
	if (!service) return;
	await service.from('card_events').insert({
		card_id: cardId,
		event_type: eventType,
		country: place?.country || null,
		city: place?.city || null
	});
}
