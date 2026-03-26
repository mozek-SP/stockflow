"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"

// Admin password — set NEXT_PUBLIC_ADMIN_PASSWORD in .env.local to override
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin1234"
const STORAGE_KEY = "stockflow_admin"

interface AuthContextValue {
    isAdmin: boolean
    unlock: (password: string) => boolean // returns true if correct
    lock: () => void
}

const AuthContext = createContext<AuthContextValue>({
    isAdmin: false,
    unlock: () => false,
    lock: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false)

    // Restore session from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved === "true") setIsAdmin(true)
        } catch {}
    }, [])

    function unlock(password: string): boolean {
        if (password === ADMIN_PASSWORD) {
            setIsAdmin(true)
            try { localStorage.setItem(STORAGE_KEY, "true") } catch {}
            return true
        }
        return false
    }

    function lock() {
        setIsAdmin(false)
        try { localStorage.removeItem(STORAGE_KEY) } catch {}
    }

    return (
        <AuthContext.Provider value={{ isAdmin, unlock, lock }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
