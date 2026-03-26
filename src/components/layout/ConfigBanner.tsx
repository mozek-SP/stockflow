"use client"

import { AlertTriangle, ExternalLink } from "lucide-react"

export function ConfigBanner() {
    return (
        <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
                <p className="font-semibold text-amber-800 mb-0.5">Supabase not configured — showing demo data</p>
                <p className="text-amber-700/80 text-xs leading-relaxed">
                    Update{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">.env.local</code> with your{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                    <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
                    then run <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800">supabase/schema.sql</code> in{" "}
                    <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
                        className="text-amber-700 underline inline-flex items-center gap-0.5 hover:text-amber-900">
                        Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                </p>
            </div>
        </div>
    )
}
