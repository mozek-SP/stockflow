"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { formatNumber, formatDateTime, getMovementTypeBadge } from "@/lib/utils"
import { BarChart2, TrendingUp, TrendingDown, Minus, Package } from "lucide-react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"

interface ProductOption { id: string; name: string; sku: string }
interface Movement {
    id: string; type: string; quantity: number; created_at: string
    notes?: string | null; serial_numbers?: string[] | null
    warehouses: { name: string } | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-lg">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                {payload.map((e: any, i: number) => (
                    <p key={i} className="text-sm font-semibold" style={{ color: e.color }}>
                        {e.name}: {formatNumber(e.value)}
                    </p>
                ))}
            </div>
        )
    }
    return null
}

export default function StockHistoryPage() {
    const { t, lang } = useLang()
    const store = useMockStore()
    const [products, setProducts] = useState<ProductOption[]>(isSupabaseConfigured ? [] : store.products.map(p => ({ id: p.id, name: p.name, sku: p.sku })))
    const [selectedId, setSelectedId] = useState("")
    const [movements, setMovements] = useState<Movement[]>([])
    const [chartData, setChartData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isSupabaseConfigured) {
            supabase.from("products").select("id, name, sku").order("name")
                .then(({ data }) => { if (data) setProducts(data) })
        }
    }, [])

    useEffect(() => {
        if (!selectedId) return
        loadHistory(selectedId)
    }, [selectedId])

    async function loadHistory(productId: string) {
        setLoading(true)
        setMovements([])
        setChartData([])

        if (!isSupabaseConfigured) {
            const filtered = store.movements.filter((m) => {
                const p = store.products.find((x) => x.id === productId)
                return p && m.products?.name === p.name
            })
            // Sort ascending for chart
            const ascFiltered = [...filtered].reverse()
            setMovements(ascFiltered as any)
            buildChart(ascFiltered as any)
            setLoading(false)
            return
        }

        const { data } = await supabase
            .from("stock_movements")
            .select("id, type, quantity, created_at, notes, serial_numbers, warehouses(name)")
            .eq("product_id", productId)
            .order("created_at", { ascending: true })

        setMovements((data as any) || [])
        buildChart((data as any) || [])
        setLoading(false)
    }

    function buildChart(data: Movement[]) {
        let running = 0
        const built = data.map((m) => {
            const qty = m.type === "IN" || m.type === "TRANSFER_IN" ? m.quantity : -m.quantity
            running += qty
            return {
                date: new Date(m.created_at).toLocaleDateString("th-TH", { month: "short", day: "numeric" }),
                balance: running,
                qty: m.quantity,
                type: m.type,
            }
        })
        setChartData(built)
    }

    const totalIn = movements.filter((m) => m.type === "IN" || m.type === "TRANSFER_IN").reduce((s, m) => s + m.quantity, 0)
    const totalOut = movements.filter((m) => m.type === "OUT" || m.type === "TRANSFER_OUT").reduce((s, m) => s + m.quantity, 0)
    const netChange = totalIn - totalOut
    const selectedProduct = products.find((p) => p.id === selectedId)

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.historyTitle} description={t.historyDesc} />

            <div className="p-6 space-y-4">
                {/* Product selector */}
                <Card className="border-slate-200">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex-1 min-w-[260px]">
                                <p className="text-xs font-medium text-slate-500 mb-1.5">
                                    {lang === "TH" ? "เลือกสินค้า" : "Select Product"}
                                </p>
                                <Select value={selectedId} onValueChange={setSelectedId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={lang === "TH" ? "เลือกสินค้า..." : "Select a product..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                <span className="font-medium">{p.name}</span>
                                                <span className="text-slate-400 ml-2 text-xs">{p.sku}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                {selectedId && !loading && movements.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: t.allMovements, value: movements.length, icon: BarChart2, color: "violet" },
                            { label: t.totalIn, value: `+${formatNumber(totalIn)}`, icon: TrendingUp, color: "emerald" },
                            { label: t.totalOut, value: `-${formatNumber(totalOut)}`, icon: TrendingDown, color: "red" },
                            { label: t.netChange, value: (netChange >= 0 ? "+" : "") + formatNumber(netChange), icon: Minus, color: netChange >= 0 ? "emerald" : "red" },
                        ].map((stat) => {
                            const Icon = stat.icon
                            const colorMap: Record<string, string> = {
                                violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600",
                                red: "bg-red-50 text-red-600",
                            }
                            const valMap: Record<string, string> = {
                                violet: "text-violet-700", emerald: "text-emerald-600", red: "text-red-600",
                            }
                            return (
                                <Card key={stat.label} className="border-slate-200">
                                    <CardContent className="p-4">
                                        <div className={`w-8 h-8 rounded-lg ${colorMap[stat.color]} flex items-center justify-center mb-2`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <p className={`text-xl font-bold ${valMap[stat.color]}`}>{stat.value}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* Chart */}
                {selectedId && chartData.length > 0 && (
                    <Card className="border-slate-200">
                        <CardHeader>
                            <CardTitle>{lang === "TH" ? "กราฟยอดสต๊อก" : "Stock Balance Trend"}</CardTitle>
                            <p className="text-xs text-slate-400">
                                {selectedProduct?.name} — {lang === "TH" ? "ยอดสะสม" : "Running balance"}
                            </p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.12} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="balance" name={(t as any).lang === "TH" ? "ยอดสต๊อก" : "Balance"}
                                        stroke="#7c3aed" strokeWidth={2} fill="url(#histGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {/* Movement table */}
                {selectedId && !loading && movements.length > 0 && (
                    <Card className="border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle>{lang === "TH" ? "รายการการเคลื่อนไหว" : "Movement History"}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "วันที่" : "Date"}</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "ประเภท" : "Type"}</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "หมายเหตุ" : "Notes"}</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "S/N" : "Serial Numbers"}</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "คลัง" : "Warehouse"}</th>
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{lang === "TH" ? "จำนวน" : "Qty"}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...movements].reverse().map((m) => (
                                        <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(m.created_at)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMovementTypeBadge(m.type)}`}>
                                                    {m.type.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-[200px]">
                                                    {m.notes ? <span className="text-xs text-slate-600 line-clamp-2" title={m.notes}>{m.notes}</span> : <span className="text-xs text-slate-300">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="max-w-[200px]">
                                                    {m.serial_numbers && m.serial_numbers.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {m.serial_numbers.map(sn => (
                                                                <code key={sn} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{sn}</code>
                                                            ))}
                                                        </div>
                                                    ) : <span className="text-xs text-slate-300">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{(m.warehouses as any)?.name || "—"}</td>
                                            <td className="px-4 py-3 text-right font-bold font-mono">
                                                <span className={m.type === "IN" || m.type === "TRANSFER_IN" ? "text-emerald-600" : "text-red-500"}>
                                                    {m.type === "IN" || m.type === "TRANSFER_IN" ? "+" : "-"}{formatNumber(m.quantity)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!selectedId && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Package className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium text-slate-500">{t.selectProduct}</p>
                    </div>
                )}

                {selectedId && !loading && movements.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <BarChart2 className="w-10 h-10 mb-3 opacity-20" />
                        <p className="text-sm">{lang === "TH" ? "ยังไม่มีประวัติการเคลื่อนไหว" : "No movement history yet"}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
