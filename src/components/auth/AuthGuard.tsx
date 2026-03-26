"use client"

import { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Lock, Shield } from "lucide-react"

interface AuthGuardProps {
    children: ReactNode
    message?: string
}

/**
 * Wraps any interactive element.
 * When user is not admin → shows a disabled lock overlay.
 * When user is admin → renders children normally.
 */
export function AuthGuard({ children, message }: AuthGuardProps) {
    const { isAdmin } = useAuth()

    if (isAdmin) {
        return <>{children}</>
    }

    return (
        <div className="relative inline-block">
            <div className="pointer-events-none opacity-40 select-none">{children}</div>
            <div
                className="absolute inset-0 flex items-center justify-center cursor-not-allowed rounded-lg z-10"
                title={message ?? "ต้องเข้าสู่ระบบ Admin ก่อน"}
            >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
            </div>
        </div>
    )
}

/**
 * Inline badge showing admin status. Use in page headers.
 */
export function AdminBadge() {
    const { isAdmin } = useAuth()
    if (!isAdmin) return null
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <Shield className="w-3 h-3" />
            Admin
        </span>
    )
}
