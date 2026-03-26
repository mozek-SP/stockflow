"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"

export function AppShell({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const isLoginPage = pathname === "/login"

    if (isLoginPage) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-slate-50">
                {children}
            </main>
        </div>
    )
}
