import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured =
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 20

export function createClient() {
    if (!isSupabaseConfigured) {
        // Return a no-op client that won't crash the app
        return createBrowserClient<Database>(
            'https://xyzcompany.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.placeholder'
        )
    }
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
