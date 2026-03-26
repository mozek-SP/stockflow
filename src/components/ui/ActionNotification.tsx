"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { CheckCircle2, XCircle, FileSpreadsheet, FileText, Loader2 } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
export type NotifType = "success" | "error" | "export-excel" | "export-pdf" | "loading"

interface Notification {
    id: number
    type: NotifType
    message: string
}

// ─── Global store (singleton, no context needed) ──────────────────────────────
let _listeners: Array<(n: Notification) => void> = []
let _counter = 0

export function showNotification(type: NotifType, message: string) {
    const notif: Notification = { id: ++_counter, type, message }
    _listeners.forEach(fn => fn(notif))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useNotification() {
    const notify = useCallback((type: NotifType, message: string) => {
        showNotification(type, message)
    }, [])

    const success = useCallback((message: string) => showNotification("success", message), [])
    const error   = useCallback((message: string) => showNotification("error",   message), [])
    const excelOk = useCallback((message: string) => showNotification("export-excel", message), [])
    const pdfOk   = useCallback((message: string) => showNotification("export-pdf",   message), [])

    return { notify, success, error, excelOk, pdfOk }
}

// ─── Icon per type ────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: NotifType }) {
    if (type === "success")      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
    if (type === "error")        return <XCircle      className="w-5 h-5 text-red-500 shrink-0" />
    if (type === "export-excel") return <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
    if (type === "export-pdf")   return <FileText     className="w-5 h-5 text-red-500 shrink-0" />
    return <Loader2 className="w-5 h-5 text-violet-500 shrink-0 animate-spin" />
}

function bgColor(type: NotifType) {
    if (type === "success")      return "bg-emerald-50 border-emerald-200"
    if (type === "error")        return "bg-red-50 border-red-200"
    if (type === "export-excel") return "bg-emerald-50 border-emerald-200"
    if (type === "export-pdf")   return "bg-red-50 border-red-200"
    return "bg-violet-50 border-violet-200"
}

// ─── Single Notification Chip ─────────────────────────────────────────────────
function NotifChip({ notif, onDone }: { notif: Notification; onDone: () => void }) {
    useEffect(() => {
        const t = setTimeout(onDone, 2600)
        return () => clearTimeout(t)
    }, [onDone])

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl shadow-slate-200/60 backdrop-blur-sm animate-float-up pointer-events-none select-none ${bgColor(notif.type)}`}
            style={{ minWidth: 220, maxWidth: 340 }}
        >
            <NotifIcon type={notif.type} />
            <span className="text-sm font-semibold text-slate-800 leading-tight">{notif.message}</span>
        </div>
    )
}

// ─── Container (mount once in layout) ────────────────────────────────────────
export function ActionNotificationContainer() {
    const [notifs, setNotifs] = useState<Notification[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const fn = (n: Notification) => setNotifs(prev => [...prev, n])
        _listeners.push(fn)
        return () => { _listeners = _listeners.filter(f => f !== fn) }
    }, [])

    const remove = useCallback((id: number) => {
        setNotifs(prev => prev.filter(n => n.id !== id))
    }, [])

    if (!mounted) return null

    return createPortal(
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 pointer-events-none"
            aria-live="polite"
        >
            {notifs.map(n => (
                <NotifChip key={n.id} notif={n} onDone={() => remove(n.id)} />
            ))}
        </div>,
        document.body
    )
}
