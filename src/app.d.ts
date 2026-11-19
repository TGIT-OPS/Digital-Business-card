import type { SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient | null;
			configured: boolean;
			getUser: () => Promise<User | null>;
		}
		interface PageData {
			configured?: boolean;
		}
	}
}

export {};
