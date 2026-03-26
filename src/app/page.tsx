"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { ConfigBanner } from "@/components/layout/ConfigBanner"
import { TopBar } from "@/components/layout/TopBar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { formatCurrency, formatNumber, formatDateTime, getMovementTypeBadge } from "@/lib/utils"
import { mockChartData, mockTopProducts } from "@/lib/mock-data"
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts"
import { Box, PackagePlus, DollarSign, AlertTriangle, Activity } from "lucide-react"

interface DashboardStats { totalProducts: number; totalStockQty: number; inventoryValue: number; lowStockCount: number }
interface RecentMovement { id: string; type: string; quantity: number; created_at: string; products: any; warehouses: any }

const COLORS = ["#7c3aed", "#6366f1", "#2563eb", "#0891b2", "#059669"]

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-lg">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>{entry.name}: {formatNumber(entry.value)}</p>
                ))}
            </div>
        )
    }
    return null
}

export default function DashboardPage() {
    const { t } = useLang()
    const store = useMockStore()

    // Dynamic mock stats
    const mockStats = useMemo(() => {
        let tStock = 0, val = 0, low = 0
        store.products.forEach((p) => {
            const q = store.getInventoryQty(p.id)
            tStock += q
            val += q * (p.net_price || 0)
            if (q <= (p.minimum_stock || 0)) low++
        })
        return { totalProducts: store.products.length, totalStockQty: tStock, inventoryValue: val, lowStockCount: low }
    }, [store.products, store.inventoryMap])

    const [stats, setStats] = useState<DashboardStats>(mockStats)
    const [recentMovements, setRecentMovements] = useState<RecentMovement[]>(store.movements.slice(0, 8) as any)
    const [chartData, setChartData] = useState<any[]>(mockChartData)
    const [topProducts, setTopProducts] = useState<any[]>(mockTopProducts)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const supabase = createClient()

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setRecentMovements(store.movements.slice(0, 8) as any)
            setStats(mockStats)
        }
    }, [store.movements, mockStats])

    useEffect(() => { if (isSupabaseConfigured) fetchDashboardData() }, [])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            // ── Stats ─────────────────────────────────────────────────────────
            const { count: productCount } = await supabase.from("products").select("*", { count: "exact", head: true })
            const { data: inventoryData } = await supabase.from("inventory").select("quantity, products(net_price, minimum_stock)")
            let totalQty = 0, inventoryValue = 0, lowStockCount = 0
            inventoryData?.forEach((item: any) => {
                const qty = item.quantity || 0
                totalQty += qty
                inventoryValue += qty * (item.products?.net_price || 0)
                if (qty <= (item.products?.minimum_stock || 0)) lowStockCount++
            })
            setStats({ totalProducts: productCount || 0, totalStockQty: totalQty, inventoryValue, lowStockCount })

            // ── Recent movements ──────────────────────────────────────────────
            const { data: moves } = await supabase
                .from("stock_movements")
                .select("id, type, quantity, created_at, products(name, sku), warehouses(name)")
                .order("created_at", { ascending: false })
                .limit(8)
            setRecentMovements((moves as any) || [])

            // ── Chart: last 7 days IN/OUT from real movements ─────────────────
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
            sevenDaysAgo.setHours(0, 0, 0, 0)

            const { data: chartMoves } = await supabase
                .from("stock_movements")
                .select("type, quantity, created_at")
                .gte("created_at", sevenDaysAgo.toISOString())
                .in("type", ["IN", "OUT"])

            // Build 7-day buckets
            const days: Record<string, { date: string; IN: number; OUT: number }> = {}
            for (let i = 6; i >= 0; i--) {
                const d = new Date()
                d.setDate(d.getDate() - i)
                const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                days[d.toDateString()] = { date: key, IN: 0, OUT: 0 }
            }
            chartMoves?.forEach((m: any) => {
                const key = new Date(m.created_at).toDateString()
                if (days[key]) {
                    if (m.type === "IN") days[key].IN += m.quantity
                    else if (m.type === "OUT") days[key].OUT += m.quantity
                }
            })
            const builtChart = Object.values(days)
            setChartData(builtChart.some(d => d.IN > 0 || d.OUT > 0) ? builtChart : mockChartData)

            // ── Top Products: by OUT quantity from real movements ──────────────
            const { data: outMoves } = await supabase
                .from("stock_movements")
                .select("quantity, products(name)")
                .eq("type", "OUT")

            const productTotals: Record<string, { name: string; total_qty: number }> = {}
            outMoves?.forEach((m: any) => {
                const name = m.products?.name
                if (!name) return
                const short = name.length > 18 ? name.slice(0, 16) + "…" : name
                if (!productTotals[name]) productTotals[name] = { name: short, total_qty: 0 }
                productTotals[name].total_qty += m.quantity
            })
            const top5 = Object.values(productTotals)
                .sort((a, b) => b.total_qty - a.total_qty)
                .slice(0, 5)
            setTopProducts(top5.length > 0 ? top5 : mockTopProducts)

        } catch (e) { console.error(e) }
        setLoading(false)
    }

    const statCards = [
        { title: t.totalProducts, value: formatNumber(stats.totalProducts), icon: Box, color: "text-violet-600", bg: "bg-violet-100" },
        { title: t.totalStockQty, value: formatNumber(stats.totalStockQty), icon: PackagePlus, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: t.inventoryValue, value: formatCurrency(stats.inventoryValue), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-100" },
        { title: t.lowStockItems, value: formatNumber(stats.lowStockCount), icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100" },
    ]

    return (
        <div className="flex flex-col min-h-full">
            {!isSupabaseConfigured && <ConfigBanner />}
            <TopBar title={t.dashboard} description={t.stockOverview} />
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, i) => (
                        <Card key={i} className="border-slate-200 shadow-sm relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-1 h-full ${stat.bg.replace("100", "500")}`} />
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start">
                                    <div><p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p><h3 className="text-2xl font-bold text-slate-800">{loading ? "..." : stat.value}</h3></div>
                                    <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center ${stat.bg}`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="col-span-1 lg:col-span-2 border-slate-200 shadow-sm"><CardHeader className="pb-2 border-b border-slate-100"><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500" />{t.stockMovements}</CardTitle><p className="text-xs text-slate-400">{t.last7Days}</p></CardHeader><CardContent className="p-0 pt-6"><div className="h-[280px] w-full px-2"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient><linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" name="IN" dataKey="IN" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" activeDot={{ r: 6, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }} /><Area type="monotone" name="OUT" dataKey="OUT" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" activeDot={{ r: 6, fill: "#ffffff", stroke: "#ef4444", strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div></CardContent></Card>
                    <Card className="border-slate-200 shadow-sm"><CardHeader className="pb-2 border-b border-slate-100"><CardTitle>{t.topMovingProducts}</CardTitle><p className="text-xs text-slate-400">{t.byStockOut}</p></CardHeader><CardContent className="p-0 pt-6"><div className="h-[280px] w-full pr-4 pb-2"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 0, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={120} /><Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} /><Bar dataKey="total_qty" radius={[0, 4, 4, 0]} barSize={20}>{topProducts.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}</Bar></BarChart></ResponsiveContainer></div></CardContent></Card>
                </div>

                <Card className="border-slate-200 shadow-sm"><CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between"><CardTitle>{t.recentMovements}</CardTitle><a href="/movements" className="text-sm font-medium text-violet-600 hover:text-violet-700">{t.viewAll}</a></CardHeader><CardContent className="p-0">{loading ? (<div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>) : recentMovements.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-slate-400"><p className="text-sm">{t.noMovements}</p></div>) : (<div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-slate-500 uppercase bg-slate-50/50"><tr><th className="px-4 py-3 font-medium rounded-tl-lg">{t.type}</th><th className="px-4 py-3 font-medium">{t.date}</th><th className="px-4 py-3 font-medium">{t.product}</th><th className="px-4 py-3 font-medium">{t.warehouse}</th><th className="px-4 py-3 font-medium text-right rounded-tr-lg">{t.quantity}</th></tr></thead><tbody className="divide-y divide-slate-100">{recentMovements.map((move) => (<tr key={move.id} className="hover:bg-slate-50 transition-colors"><td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMovementTypeBadge(move.type)}`}>{move.type.replace("_", " ")}</span></td><td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(move.created_at)}</td><td className="px-4 py-2.5 font-medium text-slate-800">{move.products?.name || "—"}</td><td className="px-4 py-2.5 text-slate-600">{move.warehouses?.name || "—"}</td><td className={`px-4 py-2.5 text-right font-bold ${move.type === "IN" || move.type === "TRANSFER_IN" ? "text-emerald-600" : "text-red-500"}`}>{move.type === "IN" || move.type === "TRANSFER_IN" ? "+" : "-"}{move.quantity}</td></tr>))}</tbody></table></div>)}</CardContent></Card>
            </div>
        </div>
    )
}
