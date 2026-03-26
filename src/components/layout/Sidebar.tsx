"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard, Box, Tag, Truck, Warehouse,
    PackagePlus, PackageMinus, GitMerge, Sliders,
    History, ChevronLeft, ChevronRight, BarChart2,
    ScanBarcode, ClipboardList, Shield, ShieldCheck,
    LogOut, Eye, EyeOff, Lock, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef, FormEvent } from "react"
import { useLang } from "@/lib/i18n"
import { useAuth } from "@/contexts/AuthContext"

export function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { t, lang, setLang } = useLang()
    const { isAdmin, unlock, lock } = useAuth()

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [error, setError] = useState(false)
    const [shake, setShake] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const navGroups = [
        {
            label: t.overview,
            items: [{ label: t.dashboard, href: "/", icon: LayoutDashboard }],
        },
        {
            label: t.masterData,
            items: [
                { label: t.products, href: "/products", icon: Box },
                { label: t.categories, href: "/categories", icon: Tag },
                { label: t.suppliers, href: "/suppliers", icon: Truck },
                { label: t.warehouses, href: "/warehouses", icon: Warehouse },
            ],
        },
        {
            label: t.movements,
            items: [
                { label: t.stockIn, href: "/stock-in", icon: PackagePlus },
                { label: t.stockOut, href: "/stock-out", icon: PackageMinus },
                { label: t.transfers, href: "/transfers", icon: GitMerge },
                { label: t.adjustments, href: "/adjustments", icon: Sliders },
            ],
        },
        {
            label: t.reports,
            items: [
                { label: t.movementLog, href: "/movements", icon: History },
                { label: t.stockCount, href: "/stock-count", icon: ClipboardList },
                { label: t.stockHistory, href: "/stock-history", icon: BarChart2 },
                { label: "ส่งออกรายงาน", href: "/reports", icon: FileText },
            ],
        },
        {
            label: t.tools,
            items: [
                { label: t.barcodeScan, href: "/barcode", icon: ScanBarcode },
            ],
        },
    ]

    function openModal() {
        setPassword("")
        setError(false)
        setShowPw(false)
        setModalOpen(true)
        setTimeout(() => inputRef.current?.focus(), 80)
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault()
        const ok = unlock(password)
        if (ok) {
            setModalOpen(false)
            setPassword("")
        } else {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 500)
            setPassword("")
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }

    return (
        <>
            <aside className={cn(
                "relative flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-200 bg-white transition-all duration-300",
                collapsed ? "w-16" : "w-60"
            )}>
                {/* Logo */}
                <div className={cn(
                    "flex items-center gap-2.5 px-4 py-4 border-b border-slate-100",
                    collapsed && "justify-center px-2"
                )}>
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                        <Box className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-sm font-bold text-slate-800 leading-none">StockFlow</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Inventory System</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                    {navGroups.map((group) => (
                        <div key={group.label}>
                            {!collapsed && (
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-2 mb-1">
                                    {group.label}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            title={collapsed ? item.label : undefined}
                                            className={cn(
                                                "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all",
                                                collapsed && "justify-center px-2",
                                                active
                                                    ? "bg-violet-50 text-violet-700"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                            )}
                                        >
                                            <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-violet-600" : "text-slate-400")} />
                                            {!collapsed && <span>{item.label}</span>}
                                            {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Language Toggle */}
                {!collapsed && (
                    <div className="px-3 pb-2">
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                            {(["TH", "EN"] as const).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={cn(
                                        "flex-1 text-xs font-semibold py-1.5 rounded-md transition-all",
                                        lang === l
                                            ? "bg-white text-violet-700 shadow-sm"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {l === "TH" ? "🇹🇭 ไทย" : "🇺🇸 EN"}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Admin Footer */}
                <div className="px-3 py-3 border-t border-slate-100">
                    {isAdmin ? (
                        /* Admin logged in */
                        !collapsed ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50">
                                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-emerald-700">Admin Mode</p>
                                        <p className="text-[10px] text-emerald-500">แก้ไขข้อมูลได้</p>
                                    </div>
                                </div>
                                <button
                                    onClick={lock}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>ออกจาก Admin</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center" title="Admin Mode">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                </div>
                                <button onClick={lock} title="ออกจาก Admin" className="text-slate-400 hover:text-red-500 transition-colors">
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )
                    ) : (
                        /* Guest — show Admin button */
                        !collapsed ? (
                            <button
                                id="admin-login-btn"
                                onClick={openModal}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-violet-300 hover:bg-violet-50 text-slate-500 hover:text-violet-700 text-xs font-medium transition-all group"
                            >
                                <Shield className="w-3.5 h-3.5 group-hover:text-violet-500 transition-colors" />
                                <span>เข้าใช้งาน Admin</span>
                                <span className="ml-auto text-[10px] bg-slate-100 group-hover:bg-violet-100 text-slate-400 group-hover:text-violet-500 px-1.5 py-0.5 rounded-full transition-colors">🔒</span>
                            </button>
                        ) : (
                            <div className="flex justify-center">
                                <button
                                    onClick={openModal}
                                    title="เข้าใช้งาน Admin"
                                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-violet-100 flex items-center justify-center text-slate-400 hover:text-violet-600 transition-colors"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )
                    )}
                </div>

                {/* Collapse button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-16 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-600 z-10"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </aside>

            {/* Admin Password Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
                >
                    <div className={cn(
                        "bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 transition-all",
                        shake && "animate-[shake_0.4s_ease]"
                    )}>
                        {/* Header */}
                        <div className="flex flex-col items-center mb-5">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                error ? "bg-red-100" : "bg-violet-100"
                            )}>
                                {error
                                    ? <Lock className="w-5 h-5 text-red-500" />
                                    : <Shield className="w-5 h-5 text-violet-600" />
                                }
                            </div>
                            <h2 className="text-base font-bold text-slate-800">เข้าใช้งาน Admin</h2>
                            <p className="text-xs text-slate-400 mt-0.5">ใส่รหัสเพื่อเปิดสิทธิ์แก้ไขข้อมูล</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-3 py-2 mb-4 text-center">
                                รหัสไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <input
                                    id="admin-password-input"
                                    ref={inputRef}
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(false) }}
                                    placeholder="ใส่รหัสผ่าน Admin"
                                    className={cn(
                                        "w-full border rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 transition",
                                        error
                                            ? "border-red-300 focus:ring-red-200"
                                            : "border-slate-200 focus:ring-violet-200 focus:border-violet-400"
                                    )}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                                >
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-500 hover:bg-slate-50 transition"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    id="admin-password-submit"
                                    type="submit"
                                    disabled={!password}
                                    className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
                                >
                                    เข้าสู่ระบบ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-8px); }
                    40% { transform: translateX(8px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
            `}</style>
        </>
    )
}
