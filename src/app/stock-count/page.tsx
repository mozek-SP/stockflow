"use client"

import { useEffect, useState } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { useMockStore } from "@/lib/mock-store"
import { formatNumber } from "@/lib/utils"
import { ClipboardList, CheckCircle2, AlertTriangle, Save, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountRow {
    productId: string; sku: string; name: string; unit: string
    systemQty: number; actualQty: string; difference: number
}

export default function StockCountPage() {
    const { t, lang } = useLang()
    const store = useMockStore()
    const { toast } = useToast()
    const [warehouseId, setWarehouseId] = useState("")
    const [warehouses, setWarehouses] = useState<any[]>(isSupabaseConfigured ? [] : store.warehouses)
    const [rows, setRows] = useState<CountRow[]>([])
    const [started, setStarted] = useState(false)
    const [saving, setSaving] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isSupabaseConfigured) {
            supabase.from("warehouses").select("id, name").then(({ data }) => { if (data) setWarehouses(data) })
        }
    }, [])

    async function handleStart() {
        if (!warehouseId) return
        setStarted(false)
        setRows([])

        if (!isSupabaseConfigured) {
            // Use mock data from store
            const countRows: CountRow[] = store.products.map((p) => ({
                productId: p.id,
                sku: p.sku,
                name: p.name,
                unit: p.unit,
                systemQty: store.getInventoryQty(p.id, warehouseId),
                actualQty: "",
                difference: 0,
            }))
            setRows(countRows)
            setStarted(true)
            return
        }

        const { data: inventory } = await supabase
            .from("inventory")
            .select("quantity, products(id, sku, name, unit)")
            .eq("warehouse_id", warehouseId)

        const countRows: CountRow[] = (inventory || []).map((inv: any) => ({
            productId: inv.products.id,
            sku: inv.products.sku,
            name: inv.products.name,
            unit: inv.products.unit,
            systemQty: inv.quantity,
            actualQty: "",
            difference: 0,
        }))
        setRows(countRows)
        setStarted(true)
    }

    function updateActual(index: number, value: string) {
        setRows((prev) => {
            const next = [...prev]
            const actual = parseFloat(value) || 0
            next[index] = { ...next[index], actualQty: value, difference: actual - next[index].systemQty }
            return next
        })
    }

    async function handleSave() {
        const filledRows = rows.filter((r) => r.actualQty !== "")
        if (filledRows.length === 0) {
            toast({ title: lang === "TH" ? "กรอกยอดที่นับก่อน" : "Enter actual quantities first", variant: "destructive" })
            return
        }
        if (!isSupabaseConfigured) {
            for (const row of filledRows) {
                const actual = parseFloat(row.actualQty)
                const diff = actual - row.systemQty
                const wh = store.warehouses.find(w => w.id === warehouseId)
                const p = store.products.find(x => x.id === row.productId)
                const newAdj = {
                    id: `adj-${Date.now()}-${Math.random()}`,
                    product_id: row.productId, warehouse_id: warehouseId,
                    system_qty: row.systemQty, actual_qty: actual,
                    difference: diff, reason: "Stock Count", created_at: new Date().toISOString(),
                    products: { name: p?.name }, warehouses: { name: wh?.name }
                }
                store.setAdjustments([newAdj, ...store.adjustments])
                store.addMovement({
                    product_id: row.productId, warehouse_id: warehouseId,
                    type: "ADJUSTMENT", quantity: Math.abs(diff), notes: `Stock Count: ${diff > 0 ? "+" : ""}${diff}`,
                    products: p ? { name: p.name, sku: p.sku } : null, warehouses: { name: wh?.name }
                })
                store.updateInventory(row.productId, warehouseId, diff)
            }
            toast({ title: t.countSaved })
            setStarted(false)
            setRows([])
            return
        }
        setSaving(true)
        for (const row of filledRows) {
            const actual = parseFloat(row.actualQty)
            const diff = actual - row.systemQty
            await (supabase.from("stock_adjustments") as any).insert({
                product_id: row.productId, warehouse_id: warehouseId,
                system_qty: row.systemQty, actual_qty: actual,
                difference: diff, reason: "Stock Count",
            } as any)
            await (supabase.from("stock_movements") as any).insert({
                product_id: row.productId, warehouse_id: warehouseId,
                type: "ADJUSTMENT", quantity: Math.abs(diff),
                notes: `Stock Count: ${diff >= 0 ? "+" : ""}${diff}`,
            })
            await (supabase.from("inventory") as any).upsert({
                product_id: row.productId, warehouse_id: warehouseId, quantity: actual,
            }, { onConflict: "product_id,warehouse_id" })
        }
        setSaving(false)
        toast({ title: t.countSaved })
        setStarted(false)
        setRows([])
    }

    const changed = rows.filter((r) => r.actualQty !== "" && r.difference !== 0)
    const overCount = changed.filter((r) => r.difference > 0).length
    const underCount = changed.filter((r) => r.difference < 0).length

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.stockCountTitle} description={t.stockCountDesc} />

            <div className="p-6 space-y-4">
                {/* Setup */}
                <Card className="border-slate-200">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <p className="text-xs font-medium text-slate-500 mb-1.5">{t.selectWarehouse}</p>
                                <Select value={warehouseId} onValueChange={setWarehouseId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.selectWarehouse} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="gradient" onClick={handleStart} disabled={!warehouseId} className="gap-2">
                                <ClipboardList className="w-4 h-4" />{t.startCount}
                            </Button>
                            {started && (
                                <Button variant="outline" onClick={() => { setStarted(false); setRows([]) }} className="gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    {lang === "TH" ? "เริ่มใหม่" : "Reset"}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Summary badges */}
                {started && changed.length > 0 && (
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-700">
                                +{overCount} {lang === "TH" ? "เกิน" : "over"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-red-700">
                                {underCount} {lang === "TH" ? "ขาด" : "short"}
                            </span>
                        </div>
                        <Button variant="gradient" onClick={handleSave} disabled={saving} className="gap-2 ml-auto">
                            <Save className="w-4 h-4" />
                            {saving ? (lang === "TH" ? "กำลังบันทึก..." : "Saving...") : t.saveCount}
                        </Button>
                    </div>
                )}

                {/* Count Table */}
                {started && (
                    <Card className="border-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">
                                {lang === "TH" ? `กรอกยอดที่นับจริง (${rows.length} รายการ)` : `Enter actual counts (${rows.length} items)`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === "TH" ? "สินค้า" : "Product"}</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">{t.systemQty}</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">{t.actualQty}</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">{t.difference}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, i) => {
                                            const diff = row.actualQty !== "" ? row.difference : null
                                            return (
                                                <tr key={row.productId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-slate-800">{row.name}</p>
                                                        <p className="text-xs text-slate-400">{row.sku}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-slate-600 font-mono">{formatNumber(row.systemQty)}</span>
                                                        <span className="text-xs text-slate-400 ml-1">{row.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            placeholder="0"
                                                            value={row.actualQty}
                                                            onChange={(e) => updateActual(i, e.target.value)}
                                                            className={cn(
                                                                "text-center w-full",
                                                                diff !== null && diff > 0 && "border-emerald-300 bg-emerald-50 focus:ring-emerald-500",
                                                                diff !== null && diff < 0 && "border-red-300 bg-red-50 focus:ring-red-500",
                                                            )}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold font-mono">
                                                        {diff === null ? (
                                                            <span className="text-slate-300">—</span>
                                                        ) : diff === 0 ? (
                                                            <span className="text-slate-500">0</span>
                                                        ) : diff > 0 ? (
                                                            <span className="text-emerald-600">+{formatNumber(diff)}</span>
                                                        ) : (
                                                            <span className="text-red-500">{formatNumber(diff)}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {!started && (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <ClipboardList className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium text-slate-500">
                            {lang === "TH" ? "เลือกคลังสินค้าและกด 'เริ่มนับ'" : "Select a warehouse and click 'Start Count'"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
