"use client"

import { useEffect, useState } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { useAuth } from "@/contexts/AuthContext"
import { formatDate, formatNumber } from "@/lib/utils"
import { Plus, Sliders, TrendingUp, TrendingDown, Barcode, ClipboardList, CheckSquare, Square, Search, Edit2, Eye } from "lucide-react"

function getAvailableSnFromMovements(movements: any[], productId: string, warehouseId?: string): string[] {
    const relevant = movements.filter(m => {
        if (m.product_id !== productId) return false
        if (warehouseId && m.warehouse_id !== warehouseId) return false
        return true
    }).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const snMap = new Map<string, boolean>()
    for (const m of relevant) {
        if (!m.serial_numbers || !Array.isArray(m.serial_numbers)) continue
        const isIn = m.type === "IN" || m.type === "TRANSFER_IN" || (m.type === "ADJUSTMENT" && m.notes?.includes("+"))
        const isOut = m.type === "OUT" || m.type === "TRANSFER_OUT" || (m.type === "ADJUSTMENT" && m.notes && !m.notes.includes("+"))
        for (const sn of m.serial_numbers) {
            if (isIn) snMap.set(sn, true)
            else if (isOut) snMap.delete(sn)
        }
    }
    return Array.from(snMap.keys())
}

export default function AdjustmentsPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const store = useMockStore()
    const [records, setRecords] = useState<any[]>(isSupabaseConfigured ? [] : store.adjustments)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [productsList, setProductsList] = useState<any[]>(isSupabaseConfigured ? [] : store.products)
    const [warehousesList, setWarehousesList] = useState<any[]>(isSupabaseConfigured ? [] : store.warehouses)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [systemQty, setSystemQty] = useState(0)
    const [form, setForm] = useState({ product_id: "", warehouse_id: "", actual_qty: "", reason: "", serial_numbers: "", selected_sns: [] as string[] })
    const [itemSearch, setItemSearch] = useState("")
    const [availableSns, setAvailableSns] = useState<string[]>([])
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setRecords(store.adjustments)
            setProductsList(store.products)
            setWarehousesList(store.warehouses)
        }
    }, [store.adjustments, store.products, store.warehouses])

    useEffect(() => { if (isSupabaseConfigured) { fetchData(); } }, [])

    async function fetchData() {
        setLoading(true)
        const [
            { data: adjData },
            { data: prodData },
            { data: whData }
        ] = await Promise.all([
            supabase.from("stock_adjustments").select("*, products(name, sku, requires_sn), warehouses(name)").order("created_at", { ascending: false }).limit(50),
            supabase.from("products").select("id, name, sku, requires_sn").order("sku"),
            supabase.from("warehouses").select("id, name").order("name")
        ])
        setRecords((adjData as any) || [])
        if (prodData) setProductsList(prodData)
        if (whData) setWarehousesList(whData)
        setLoading(false)
    }

    function resetForm() { 
        setForm({ product_id: "", warehouse_id: "", actual_qty: "", reason: "", serial_numbers: "", selected_sns: [] }); 
        setSystemQty(0); 
        setAvailableSns([]); 
        setItemSearch("");
        setEditingId(null);
    }

    async function openEdit(r: any) {
        setEditingId(r.id)
        setForm({
            product_id: r.product_id,
            warehouse_id: r.warehouse_id,
            actual_qty: r.actual_qty.toString(),
            reason: r.reason || "",
            serial_numbers: r.difference > 0 ? (r.serial_numbers || []).join(",") : "",
            selected_sns: r.difference < 0 ? (r.serial_numbers || []) : []
        })
        setSystemQty(r.system_qty)
        setItemSearch(r.products?.name || "")
        await loadAvailableSns(r.product_id, r.warehouse_id)
        setDialogOpen(true)
    }

    async function loadAvailableSns(productId: string, warehouseId: string) {
        if (!productId || !warehouseId) return
        const product = productsList.find(p => p.id === productId)
        if (!product?.requires_sn) return
        if (!isSupabaseConfigured) {
            setAvailableSns(getAvailableSnFromMovements(store.movements, productId, warehouseId))
            return
        }
        const { data } = await supabase.from("stock_movements").select("type, serial_numbers, notes, created_at, warehouse_id").eq("product_id", productId).eq("warehouse_id", warehouseId).order("created_at", { ascending: true })
        setAvailableSns(getAvailableSnFromMovements((data as any) || [], productId, warehouseId))
    }

    function onProductWarehouseChange(productId: string, warehouseId: string) {
        if (!productId || !warehouseId) return
        if (!isSupabaseConfigured) {
            setSystemQty(store.getInventoryQty(productId, warehouseId))
            loadAvailableSns(productId, warehouseId)
            return
        }
        supabase.from("inventory").select("quantity").eq("product_id", productId).eq("warehouse_id", warehouseId).single()
            .then(({ data }) => setSystemQty((data as any)?.quantity || 0))
        loadAvailableSns(productId, warehouseId)
    }

    const difference = form.actual_qty !== "" ? parseInt(form.actual_qty) - systemQty : 0

    async function handleSave() {
        if (!form.product_id || !form.warehouse_id || form.actual_qty === "") {
            toast({ title: t.validationError, description: `${t.product}, ${t.warehouse}, ${t.actualQty}`, variant: "destructive" }); return
        }
        const actualQty = parseInt(form.actual_qty)
        const diff = actualQty - systemQty

        const prod = productsList.find((p) => p.id === form.product_id)
        if (prod?.requires_sn && diff !== 0) {
            if (diff < 0) {
                // Removing: must select from existing stock S/N
                if (form.selected_sns.length !== Math.abs(diff)) {
                    toast({ title: `${prod.name}: ต้องเลือก S/N จำนวน ${Math.abs(diff)} รายการ (เลือกแล้ว ${form.selected_sns.length})`, variant: "destructive" })
                    return
                }
            } else {
                // Adding: must enter new S/N
                const sns = (form.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s)
                if (sns.length !== diff) {
                    toast({ title: `${prod.name}: ต้องระบุ S/N จำนวน ${diff} รายการ (พบ ${sns.length})`, variant: "destructive" })
                    return
                }
            }
        }

        if (!isSupabaseConfigured) {
            const prod = productsList.find((p) => p.id === form.product_id)
            const wh = store.warehouses.find((w) => w.id === form.warehouse_id)
            const newAdj = {
                id: `adj-${Date.now()}`,
                product_id: form.product_id, warehouse_id: form.warehouse_id,
                system_qty: systemQty, actual_qty: parseInt(form.actual_qty), difference: diff,
                reason: form.reason || null, created_at: new Date().toISOString(),
                products: prod ? { name: prod.name, sku: prod.sku, requires_sn: prod.requires_sn } : null,
                warehouses: wh ? { name: wh.name } : null,
            }
            const sns = prod?.requires_sn && diff !== 0
                ? (diff < 0 ? form.selected_sns : (form.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s))
                : []
            store.setAdjustments([newAdj, ...store.adjustments])
            store.addMovement({ product_id: form.product_id, warehouse_id: form.warehouse_id, type: "ADJUSTMENT", quantity: Math.abs(diff), notes: `Adjustment: ${diff >= 0 ? "+" : ""}${diff}. Reason: ${form.reason || "N/A"}`, products: { name: prod?.name, sku: prod?.sku }, warehouses: { name: wh?.name }, serial_numbers: sns })
            // Directly update inventory to actual qty
            store.updateInventory(form.product_id, form.warehouse_id, diff)
            toast({ title: t.adjustmentRecorded }); setDialogOpen(false); resetForm(); return
        }

        setSaving(true)
        try {
            const sns = prod?.requires_sn && diff !== 0
                ? (diff < 0 ? form.selected_sns : (form.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s))
                : []
            
            let adjId = editingId
            if (editingId) {
                const oldRecord = records.find(r => r.id === editingId)
                if (oldRecord) {
                    const { data: ex } = await supabase.from("inventory").select("id, quantity").eq("product_id", oldRecord.product_id).eq("warehouse_id", oldRecord.warehouse_id).single()
                    if (ex) await (supabase.from("inventory") as any).update({ quantity: (ex as any).quantity - oldRecord.difference } as any).eq("id", (ex as any).id)
                }
                await supabase.from("stock_movements").delete().eq("reference_id", editingId)
                await (supabase.from("stock_adjustments") as any).update({ product_id: form.product_id, warehouse_id: form.warehouse_id, system_qty: systemQty, actual_qty: actualQty, difference: diff, reason: form.reason || null } as any).eq("id", editingId)
            } else {
                const { data: adj, error: hErr } = await (supabase.from("stock_adjustments") as any).insert({ product_id: form.product_id, warehouse_id: form.warehouse_id, system_qty: systemQty, actual_qty: actualQty, difference: diff, reason: form.reason || null, created_by: "admin" } as any).select().single()
                if (hErr) throw hErr
                adjId = (adj as any).id
            }

            if (diff !== 0) {
                 await (supabase.from("stock_movements") as any).insert({ product_id: form.product_id, warehouse_id: form.warehouse_id, type: "ADJUSTMENT", quantity: Math.abs(diff), notes: `Adjustment: ${diff > 0 ? "+" : ""}${diff}. Reason: ${form.reason || "N/A"}`, reference_id: adjId, serial_numbers: sns } as any)
            }
            const { data: inv } = await supabase.from("inventory").select("id, quantity").eq("product_id", form.product_id).eq("warehouse_id", form.warehouse_id).single()
            if (inv) await (supabase.from("inventory") as any).update({ quantity: (inv as any).quantity + diff } as any).eq("id", (inv as any).id)
            else await (supabase.from("inventory") as any).insert({ product_id: form.product_id, warehouse_id: form.warehouse_id, quantity: actualQty } as any)

            toast({ title: editingId ? (t as any).adjustmentUpdated || "อัปเดตเรียบร้อย" : t.adjustmentRecorded }); setDialogOpen(false); resetForm(); fetchData()
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) }
        setSaving(false)
    }

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.adjustments} description={t.manualCorrections}
                actions={isAdmin ? <Button onClick={() => { resetForm(); setDialogOpen(true) }} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.newAdjustment}</Button> : undefined} />
            <div className="p-6">
                <Card className="border-slate-200"><CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-slate-400"><Sliders className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noAdjustments}</p></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t.date}</TableHead><TableHead>{t.product}</TableHead>
                                <TableHead>{t.warehouse}</TableHead><TableHead className="text-right">{t.systemQty}</TableHead>
                                <TableHead className="text-right">{t.actualQty}</TableHead><TableHead className="text-right">{t.difference}</TableHead>
                                <TableHead>{t.reason}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {records.map((r) => (
                                    <TableRow key={r.id} onClick={() => { setSelectedRecord(r); setDetailsOpen(true); }} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                        <TableCell className="text-sm text-slate-500">{formatDate(r.created_at)}</TableCell>
                                        <TableCell className="text-sm font-medium text-slate-800">{r.products?.name || "—"}</TableCell>
                                        <TableCell><Badge variant="default">{r.warehouses?.name || "—"}</Badge></TableCell>
                                        <TableCell className="text-right text-sm text-slate-500">{formatNumber(r.system_qty)}</TableCell>
                                        <TableCell className="text-right text-sm font-medium">{formatNumber(r.actual_qty)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {r.difference > 0 ? (<><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">+{formatNumber(r.difference)}</span></>)
                                                    : r.difference < 0 ? (<><TrendingDown className="w-3.5 h-3.5 text-red-500" /><span className="text-sm font-semibold text-red-500">{formatNumber(r.difference)}</span></>)
                                                        : <span className="text-sm text-slate-400">0</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-[180px] truncate">{r.reason || "—"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-violet-50 hover:text-violet-600" onClick={(e) => { e.stopPropagation(); setSelectedRecord(r); setDetailsOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                                                {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-blue-50 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Edit2 className="w-3.5 h-3.5" /></Button>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent></Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Sliders className="w-5 h-5 text-violet-600" />{editingId ? (t as any).editProduct || "แก้ไขรายการ" : t.newAdjustment}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5"><Label>{t.product} *</Label>
                            <div className="relative group">
                                <Input 
                                    placeholder={t.selectProduct} 
                                    className="h-9 pr-8 transition-all focus:ring-2 focus:ring-violet-500/20"
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                />
                                <div className="absolute top-full left-0 w-full min-w-[320px] mt-1 z-[110] bg-white border border-slate-300 rounded-lg shadow-2xl hidden group-focus-within:block max-h-64 overflow-y-auto overflow-x-hidden transition-all">
                                    {productsList.filter(p => !itemSearch || p.name.toLowerCase().includes(itemSearch.toLowerCase()) || p.sku.toLowerCase().includes(itemSearch.toLowerCase())).map(p => (
                                        <div 
                                            key={p.id} 
                                            className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer flex flex-col gap-0.5 border-b border-slate-50 last:border-0 transition-colors"
                                            onMouseDown={() => {
                                                setForm({ ...form, product_id: p.id }); 
                                                onProductWarehouseChange(p.id, form.warehouse_id)
                                                setItemSearch(p.name)
                                            }}
                                        >
                                            <span className="font-semibold text-slate-800 text-xs">{p.name}</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{p.sku}</code>
                                                {p.requires_sn && <span className="text-[9px] text-violet-500 font-medium">Requires S/N</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>{t.warehouse} *</Label>
                            <Select value={form.warehouse_id} onValueChange={(v) => { setForm({ ...form, warehouse_id: v }); onProductWarehouseChange(form.product_id, v) }}>
                                <SelectTrigger><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                                <SelectContent>{warehousesList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex justify-between text-sm"><span className="text-slate-500">{t.systemQuantity}</span><span className="font-semibold">{formatNumber(systemQty)}</span></div>
                            <div className="space-y-1.5"><Label>{t.actualQuantity}</Label>
                                <Input 
                                    type="number" 
                                    min={0} 
                                    placeholder="0" 
                                    value={form.actual_qty === "" ? "" : form.actual_qty} 
                                    onChange={(e) => setForm({ ...form, actual_qty: e.target.value })} 
                                />
                            </div>
                            {form.actual_qty !== "" && (
                                <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                                    <span className="text-slate-500">{t.difference}</span>
                                    <span className={`font-semibold ${difference > 0 ? "text-emerald-600" : difference < 0 ? "text-red-500" : "text-slate-500"}`}>{difference > 0 ? "+" : ""}{formatNumber(difference)}</span>
                                </div>
                            )}
                        </div>
                        {productsList.find(p => p.id === form.product_id)?.requires_sn && difference !== 0 && (
                            <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <Label className={difference > 0 ? "text-emerald-600" : "text-red-500"}>
                                    {difference > 0 ? `S/N สินค้าที่เพิ่มเข้า (${difference} รายการ)` : `เลือก S/N ที่จะตัดออก (${Math.abs(difference)} รายการ)`}
                                </Label>
                                {difference > 0 ? (
                                    // Adding stock → type new S/N
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                            {Array.from({ length: difference }).map((_, snIdx) => (
                                                <div key={snIdx} className="relative group">
                                                    <Input 
                                                        placeholder={`S/N #${snIdx + 1}`}
                                                        className="text-[10px] h-8 font-mono bg-white border-slate-200 focus:border-emerald-400 focus:ring-emerald-500/10 transition-all pl-6"
                                                        value={(form.serial_numbers || "").split(",")[snIdx] || ""}
                                                        onChange={(e) => {
                                                            const currentSns = (form.serial_numbers || "").split(",")
                                                            const newSns = Array.from({ length: difference }, (_, j) => currentSns[j] || "")
                                                            newSns[snIdx] = e.target.value.trim()
                                                            setForm({ ...form, serial_numbers: newSns.join(",") })
                                                        }}
                                                    />
                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold group-focus-within:text-emerald-400">{snIdx + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`text-[10px] pl-1 font-semibold ${(form.serial_numbers || "").split(",").filter(s => s.trim()).length === difference ? "text-emerald-600" : "text-amber-600"}`}>
                                            ระบุแล้ว {(form.serial_numbers || "").split(",").filter(s => s.trim()).length}/{difference} รายการ
                                        </div>
                                    </div>
                                ) : (
                                    // Removing stock → pick from existing S/N
                                    availableSns.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic">ไม่พบ S/N ในสต็อกที่คลังนี้</p>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                                                {availableSns.map(sn => {
                                                    const selected = form.selected_sns.includes(sn)
                                                    const disabled = !selected && form.selected_sns.length >= Math.abs(difference)
                                                    return (
                                                        <button
                                                            key={sn}
                                                            type="button"
                                                            disabled={disabled}
                                                            onClick={() => {
                                                                const already = form.selected_sns.includes(sn)
                                                                setForm({ ...form, selected_sns: already ? form.selected_sns.filter(s => s !== sn) : [...form.selected_sns, sn] })
                                                            }}
                                                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all ${selected ? "bg-red-500 text-white border-red-500 shadow-sm" : disabled ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed" : "bg-white text-slate-700 border-slate-200 hover:border-red-400 hover:bg-red-50 cursor-pointer"}`}
                                                        >
                                                            {selected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                                                            {sn}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <div className={`text-[10px] mt-1 pl-1 font-semibold ${form.selected_sns.length === Math.abs(difference) ? "text-emerald-600" : "text-amber-600"}`}>
                                                เลือกแล้ว {form.selected_sns.length}/{Math.abs(difference)} รายการ
                                            </div>
                                        </>
                                    )
                                )}
                            </div>
                        )}
                        <div className="space-y-1.5"><Label>{t.reason}</Label><Textarea placeholder={`${t.reason}...`} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving || !form.product_id || !form.warehouse_id || form.actual_qty === ""} className="gap-2"><Sliders className="w-4 h-4" />{saving ? t.processing : (t as any).confirmAdjustment}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-violet-600">
                            <ClipboardList className="w-5 h-5" />
                            {selectedRecord ? `${(t as any).stockAdjustments} #${selectedRecord.id.slice(0, 8).toUpperCase()}` : t.reference}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><span className="text-slate-500 block text-xs">{t.date}</span><span className="font-medium">{formatDate(selectedRecord.created_at)}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.warehouse}</span><span className="font-medium">{selectedRecord.warehouses?.name || "—"}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.reason}</span><span className="font-medium">{selectedRecord.reason || "—"}</span></div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">{t.products}</h4>
                                <div className="space-y-3">
                                    <div className="border border-slate-200 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="font-medium text-slate-800">{selectedRecord.products?.name} {(selectedRecord.products?.sku || selectedRecord.products?.requires_sn) && <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded ml-1">{selectedRecord.products?.sku}</span>}</div>
                                            <div className="flex items-center gap-2">
                                                {selectedRecord.difference > 0 ? (<><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-sm font-semibold text-emerald-600">+{formatNumber(selectedRecord.difference)}</span></>)
                                                    : selectedRecord.difference < 0 ? (<><TrendingDown className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-red-500">{formatNumber(selectedRecord.difference)}</span></>)
                                                        : <span className="text-sm text-slate-400">0</span>}
                                            </div>
                                        </div>
                                        {selectedRecord.products?.requires_sn && Math.abs(selectedRecord.difference) > 0 && (
                                            <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                <div className={`text-xs font-semibold mb-1 flex items-center gap-1 ${selectedRecord.difference > 0 ? "text-emerald-600" : "text-red-500"}`}><Barcode className="w-3.5 h-3.5" /> {(t as any).serialNumbers || "S/N"} ({Math.abs(selectedRecord.difference)})</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {(selectedRecord.serial_numbers && selectedRecord.serial_numbers.length > 0) ? (
                                                        selectedRecord.serial_numbers.map((sn: string, idx: number) => (
                                                            <code key={idx} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] select-all">
                                                                {sn}
                                                            </code>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400">No S/N recorded</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
