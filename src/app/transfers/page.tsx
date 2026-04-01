"use client"

import React, { useEffect, useState } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, GitMerge, X, ArrowRight, Barcode, ClipboardList, CheckSquare, Square, Search, Edit2, Eye } from "lucide-react"

interface LineItem { product_id: string; quantity: number; selected_sns: string[] }

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

export default function TransfersPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const store = useMockStore()
    const [records, setRecords] = useState<any[]>(isSupabaseConfigured ? [] : store.transfers)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [productsList, setProductsList] = useState<any[]>(isSupabaseConfigured ? [] : store.products)
    const [warehousesList, setWarehousesList] = useState<any[]>(isSupabaseConfigured ? [] : store.warehouses)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ from_warehouse_id: "", to_warehouse_id: "", date: new Date().toISOString().split("T")[0], notes: "" })
    const [items, setItems] = useState<LineItem[]>([{ product_id: "", quantity: 1, selected_sns: [] }])
    const [itemSearch, setItemSearch] = useState<string[]>([])
    const [availableSnMap, setAvailableSnMap] = useState<Record<number, string[]>>({})
    const [warehouseInventory, setWarehouseInventory] = useState<any[]>([])
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => { 
        if (!isSupabaseConfigured) {
            setRecords(store.transfers)
            setProductsList(store.products)
            setWarehousesList(store.warehouses)
        } 
    }, [store.transfers, store.products, store.warehouses])
    useEffect(() => { if (isSupabaseConfigured) fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        const [
            { data: trData },
            { data: prodData },
            { data: whData }
        ] = await Promise.all([
            supabase.from("stock_transfers").select("*, from_warehouse:warehouses!from_warehouse_id(name), to_warehouse:warehouses!to_warehouse_id(name), stock_transfer_items(product_id, quantity, serial_numbers, products(name, sku, requires_sn))").order("created_at", { ascending: false }).limit(50),
            supabase.from("products").select("id, name, sku, requires_sn").order("sku"),
            supabase.from("warehouses").select("id, name").order("name")
        ])
        setRecords((trData as any) || [])
        if (prodData) setProductsList(prodData)
        if (whData) setWarehousesList(whData)
        setLoading(false)
    }

    function resetForm() {
        setForm({ from_warehouse_id: "", to_warehouse_id: "", date: new Date().toISOString().split("T")[0], notes: "" })
        setItems([{ product_id: "", quantity: 1, selected_sns: [] }])
        setItemSearch([""])
        setAvailableSnMap({})
        setWarehouseInventory([])
        setEditingId(null)
    }

    async function openEdit(r: any) {
        setEditingId(r.id)
        setForm({
            from_warehouse_id: r.from_warehouse_id || "",
            to_warehouse_id: r.to_warehouse_id || "",
            date: r.date,
            notes: r.notes || ""
        })
        const mappedItems = r.stock_transfer_items.map((i: any) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            selected_sns: i.serial_numbers || []
        }))
        setItems(mappedItems)
        setItemSearch(mappedItems.map((i: any) => productsList.find(p => p.id === i.product_id)?.name || ""))
        await onFromWarehouseChange(r.from_warehouse_id, mappedItems)
        setDialogOpen(true)
    }

    async function loadAvailableSns(itemIndex: number, productId: string, warehouseId: string) {
        if (!productId) return
        const product = productsList.find(p => p.id === productId)
        if (!product?.requires_sn) return

        if (!isSupabaseConfigured) {
            const sns = getAvailableSnFromMovements(store.movements, productId, warehouseId || undefined)
            setAvailableSnMap(prev => ({ ...prev, [itemIndex]: sns }))
            return
        }
        let query = supabase.from("stock_movements").select("type, serial_numbers, notes, created_at, warehouse_id").eq("product_id", productId)
        if (warehouseId) query = query.eq("warehouse_id", warehouseId)
        const { data } = await query.order("created_at", { ascending: true })
        const sns = getAvailableSnFromMovements((data as any) || [], productId, warehouseId || undefined)
        setAvailableSnMap(prev => ({ ...prev, [itemIndex]: sns }))
    }

    function onProductChange(i: number, productId: string) {
        setItems(items.map((x, idx) => idx === i ? { ...x, product_id: productId, selected_sns: [] } : x))
        setAvailableSnMap(prev => ({ ...prev, [i]: [] }))
        if (productId && form.from_warehouse_id) loadAvailableSns(i, productId, form.from_warehouse_id)
    }

    async function onFromWarehouseChange(warehouseId: string, currentItems?: LineItem[]) {
        const activeItems = currentItems || items
        setForm(prev => ({ ...prev, from_warehouse_id: warehouseId }))
        activeItems.forEach((item, i) => { if (item.product_id) loadAvailableSns(i, item.product_id, warehouseId) })

        if (!warehouseId) {
            setWarehouseInventory([])
            return
        }

        if (!isSupabaseConfigured) {
            const inv = store.products.map(p => ({ product_id: p.id, quantity: store.getInventoryQty(p.id, warehouseId) })).filter(i => i.quantity > 0)
            setWarehouseInventory(inv)
        } else {
            const { data } = await supabase.from("inventory").select("product_id, quantity").eq("warehouse_id", warehouseId).gt("quantity", 0)
            setWarehouseInventory((data as any) || [])
        }
    }

    function toggleSn(itemIndex: number, sn: string) {
        setItems(prev => prev.map((x, idx) => {
            if (idx !== itemIndex) return x
            const already = x.selected_sns.includes(sn)
            return { ...x, selected_sns: already ? x.selected_sns.filter(s => s !== sn) : [...x.selected_sns, sn] }
        }))
    }

    async function handleSave() {
        if (!form.from_warehouse_id || !form.to_warehouse_id) { toast({ title: t.warehouseDateRequired, variant: "destructive" }); return }
        if (form.from_warehouse_id === form.to_warehouse_id) { toast({ title: "ไม่สามารถโอนไปคลังเดียวกัน", variant: "destructive" }); return }
        const validItems = items.filter((i) => i.product_id && i.quantity > 0)
        if (validItems.length === 0) { toast({ title: t.addAtLeastOne, variant: "destructive" }); return }

        for (const item of validItems) {
            const product = productsList.find(p => p.id === item.product_id)
            if (product?.requires_sn) {
                if (item.selected_sns.length !== item.quantity) {
                    toast({ title: `${product.name}: ต้องเลือก S/N จำนวน ${item.quantity} รายการ (เลือกแล้ว ${item.selected_sns.length})`, variant: "destructive" })
                    return
                }
            }
        }

        if (!isSupabaseConfigured) {
            const fromWH = store.warehouses.find((w) => w.id === form.from_warehouse_id)
            const toWH = store.warehouses.find((w) => w.id === form.to_warehouse_id)
            const newTransfer = {
                id: `tr-${Date.now()}`,
                date: form.date, status: "completed", notes: form.notes || null,
                created_at: new Date().toISOString(),
                from_warehouse_id: form.from_warehouse_id, to_warehouse_id: form.to_warehouse_id,
                from_warehouse: { name: fromWH?.name || "?" }, to_warehouse: { name: toWH?.name || "?" },
                stock_transfer_items: validItems.map((i) => {
                    const p = productsList.find((p) => p.id === i.product_id);
                    return { quantity: i.quantity, serial_numbers: i.selected_sns, products: { name: p?.name || "?", sku: p?.sku || "?", requires_sn: p?.requires_sn || false } }
                }),
            }
            store.setTransfers([newTransfer, ...store.transfers])
            for (const item of validItems) {
                const prod = productsList.find((p) => p.id === item.product_id)
                store.addMovement({ product_id: item.product_id, warehouse_id: form.from_warehouse_id, type: "TRANSFER_OUT", quantity: item.quantity, notes: form.notes ? `Transfer Out to ${toWH?.name} - ${form.notes}` : `Transfer Out to ${toWH?.name}`, products: prod ? { name: prod.name, sku: prod.sku } : null, warehouses: { name: fromWH?.name }, serial_numbers: item.selected_sns })
                store.addMovement({ product_id: item.product_id, warehouse_id: form.to_warehouse_id, type: "TRANSFER_IN", quantity: item.quantity, notes: form.notes ? `Transfer In from ${fromWH?.name} - ${form.notes}` : `Transfer In from ${fromWH?.name}`, products: prod ? { name: prod.name, sku: prod.sku } : null, warehouses: { name: toWH?.name }, serial_numbers: item.selected_sns })
            }
            toast({ title: t.transferRecorded }); setDialogOpen(false); resetForm(); return
        }

        setSaving(true)
        try {
            let trId = editingId
            
            if (editingId) {
                // Revert
                const { data: oldItems } = await supabase.from("stock_transfer_items").select("*").eq("transfer_id", editingId)
                const oldRecord = records.find(r => r.id === editingId)
                if (oldItems && oldRecord) {
                    for (const oi of (oldItems as any[])) {
                        // Return to source
                        const { data: exFrom } = await supabase.from("inventory").select("id, quantity").eq("product_id", oi.product_id).eq("warehouse_id", oldRecord.from_warehouse_id).single()
                        if (exFrom) await (supabase.from("inventory") as any).update({ quantity: (exFrom as any).quantity + oi.quantity } as any).eq("id", (exFrom as any).id)
                        
                        // Remove from destination
                        const { data: exTo } = await supabase.from("inventory").select("id, quantity").eq("product_id", oi.product_id).eq("warehouse_id", oldRecord.to_warehouse_id).single()
                        if (exTo) await (supabase.from("inventory") as any).update({ quantity: Math.max(0, (exTo as any).quantity - oi.quantity) } as any).eq("id", (exTo as any).id)
                    }
                }
                await supabase.from("stock_movements").delete().eq("reference_id", editingId)
                await supabase.from("stock_transfer_items").delete().eq("transfer_id", editingId)
                await (supabase.from("stock_transfers") as any).update({ from_warehouse_id: form.from_warehouse_id, to_warehouse_id: form.to_warehouse_id, date: form.date, notes: form.notes || null } as any).eq("id", editingId)
            } else {
                const { data: tr, error: hErr } = await (supabase.from("stock_transfers") as any).insert({ from_warehouse_id: form.from_warehouse_id, to_warehouse_id: form.to_warehouse_id, date: form.date, status: "completed", notes: form.notes || null, created_by: "admin" } as any).select().single()
                if (hErr) throw hErr
                trId = (tr as any).id
            }

            // Insert
            await (supabase.from("stock_transfer_items") as any).insert(validItems.map((i) => {
                return { transfer_id: trId, product_id: i.product_id, quantity: i.quantity, serial_numbers: i.selected_sns }
            }) as any)

            for (const item of validItems) {
                await (supabase.from("stock_movements") as any).insert([
                    { product_id: item.product_id, warehouse_id: form.from_warehouse_id, type: "TRANSFER_OUT", quantity: item.quantity, reference_id: trId, notes: form.notes ? `Transfer Out - ${form.notes}` : null, serial_numbers: item.selected_sns },
                    { product_id: item.product_id, warehouse_id: form.to_warehouse_id, type: "TRANSFER_IN", quantity: item.quantity, reference_id: trId, notes: form.notes ? `Transfer In - ${form.notes}` : null, serial_numbers: item.selected_sns },
                ] as any)
                const { data: fromInv } = await supabase.from("inventory").select("id, quantity").eq("product_id", item.product_id).eq("warehouse_id", form.from_warehouse_id).single()
                if (fromInv) await ((supabase.from("inventory") as any).update({ quantity: Math.max(0, (fromInv as any).quantity - item.quantity) } as any) as any).eq("id", (fromInv as any).id)
                const { data: toInv } = await supabase.from("inventory").select("id, quantity").eq("product_id", item.product_id).eq("warehouse_id", form.to_warehouse_id).single()
                if (toInv) await ((supabase.from("inventory") as any).update({ quantity: (toInv as any).quantity + item.quantity } as any) as any).eq("id", (toInv as any).id)
                else await (supabase.from("inventory") as any).insert([{ product_id: item.product_id, warehouse_id: form.to_warehouse_id, quantity: item.quantity }] as any)
            }

            toast({ title: editingId ? (t as any).transferUpdated || "อัปเดตเรียบร้อย" : t.transferRecorded }); setDialogOpen(false); resetForm(); fetchData()
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) }
        setSaving(false)
    }

    const totalItems = (r: any) => r.stock_transfer_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.transfers} description={t.transferBetween}
                actions={isAdmin ? <Button onClick={() => { resetForm(); setDialogOpen(true) }} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.newTransfer}</Button> : undefined} />
            <div className="p-6">
                <Card className="border-slate-200"><CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-slate-400"><GitMerge className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noTransfers}</p></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t.reference}</TableHead><TableHead>{t.date}</TableHead>
                                <TableHead>{t.fromWarehouse}</TableHead><TableHead></TableHead>
                                <TableHead>{t.toWarehouse}</TableHead><TableHead>{t.product}</TableHead><TableHead>{t.note}</TableHead>
                                <TableHead className="text-right">{t.totalQty}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {records.map((r) => (
                                    <TableRow key={r.id} onClick={() => { setSelectedRecord(r); setDetailsOpen(true); }} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                        <TableCell><code className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono">#{r.id.slice(0, 8).toUpperCase()}</code></TableCell>
                                        <TableCell className="text-sm text-slate-500">{formatDate(r.date)}</TableCell>
                                        <TableCell><Badge variant="default">{r.from_warehouse?.name || "—"}</Badge></TableCell>
                                        <TableCell><ArrowRight className="w-4 h-4 text-slate-400" /></TableCell>
                                        <TableCell><Badge variant="outline">{r.to_warehouse?.name || "—"}</Badge></TableCell>
                                        <TableCell><div className="flex flex-wrap gap-1">{r.stock_transfer_items?.slice(0, 2).map((i: any, idx: number) => (<span key={idx} className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{i.products?.name}</span>))}</div></TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                                        <TableCell className="text-right"><span className="text-sm font-semibold text-violet-600">{formatNumber(totalItems(r))}</span></TableCell>
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
                <DialogContent className="max-w-none w-screen h-screen m-0 rounded-none overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5 text-violet-600" />{editingId ? (t as any).editProduct || "แก้ไขรายการ" : t.newTransfer}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 items-end">
                            <div className="space-y-1.5"><Label>{t.fromWarehouse} *</Label>
                                <Select value={form.from_warehouse_id} onValueChange={onFromWarehouseChange}>
                                    <SelectTrigger><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                                    <SelectContent>{warehousesList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-center pb-1"><ArrowRight className="w-5 h-5 text-slate-400" /></div>
                            <div className="space-y-1.5"><Label>{t.toWarehouse} *</Label>
                                <Select value={form.to_warehouse_id} onValueChange={(v) => setForm({ ...form, to_warehouse_id: v })}>
                                    <SelectTrigger><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                                    <SelectContent>{warehousesList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-40"><Label>{t.date} *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5" /></div>
                            <div className="flex-1 space-y-1.5"><Label>{t.note}</Label><Input placeholder={t.note} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between"><Label>{t.products}</Label><Button size="sm" variant="outline" onClick={() => { setItems([...items, { product_id: "", quantity: 1, selected_sns: [] }]); setItemSearch([...itemSearch, ""]) }} className="gap-1 h-7 text-xs"><Plus className="w-3 h-3" />{t.addRow}</Button></div>
                            <div className="rounded-xl border border-slate-200">
                                <Table className="!overflow-visible" wrapperClassName="!overflow-visible">
                                    <TableHeader className="!overflow-visible"><TableRow className="!overflow-visible"><TableHead>{t.product}</TableHead><TableHead className="w-32">{t.quantity}</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                                    <TableBody className="!overflow-visible">
                                        {items.map((item, i) => {
                                            const product = productsList.find(p => p.id === item.product_id);
                                            const availSns = availableSnMap[i] || []
                                            return (
                                                <React.Fragment key={i}>
                                                    <TableRow className="!overflow-visible relative focus-within:z-[100] z-0">
                                                        <TableCell className="py-2 !overflow-visible">
                                                            <div className="relative group">
                                                                <Input 
                                                                    placeholder={t.selectProduct} 
                                                                    className="h-8 pr-8 focus:ring-2 focus:ring-violet-500/20"
                                                                    value={itemSearch[i] || (productsList.find(p => p.id === item.product_id)?.name || "")}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value
                                                                        const newSearch = [...itemSearch]
                                                                        newSearch[i] = val
                                                                        setItemSearch(newSearch)
                                                                    }}
                                                                />
                                                                <div className="absolute top-full left-0 w-full min-w-[320px] mt-1 z-[110] bg-white border border-slate-300 rounded-lg shadow-2xl hidden group-focus-within:block max-h-64 overflow-y-auto overflow-x-hidden">
                                                                    {productsList.filter(p => !itemSearch[i] || p.name.toLowerCase().includes(itemSearch[i].toLowerCase()) || p.sku.toLowerCase().includes(itemSearch[i].toLowerCase()))
                                                                        .filter(p => warehouseInventory.some(inv => inv.product_id === p.id))
                                                                        .map(p => {
                                                                            const inv = warehouseInventory.find(inv => inv.product_id === p.id)
                                                                            return (
                                                                                <div 
                                                                                    key={p.id} 
                                                                                    className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors"
                                                                                    onMouseDown={() => {
                                                                                        onProductChange(i, p.id)
                                                                                        const newSearch = [...itemSearch]
                                                                                        newSearch[i] = ""
                                                                                        setItemSearch(newSearch)
                                                                                    }}
                                                                                >
                                                                                    <div className="flex flex-col gap-0.5">
                                                                                        <span className="font-semibold text-slate-800 text-xs">{p.name}</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <code className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{p.sku}</code>
                                                                                            {p.requires_sn && <span className="text-[9px] text-violet-500 font-medium">Requires S/N</span>}
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <span className="text-[10px] uppercase text-slate-400 block font-bold leading-none mb-1">Stock</span>
                                                                                        <Badge variant="outline" className="text-xs py-0 h-5 px-1.5 font-bold text-violet-600 bg-violet-50 border-violet-200">{inv?.quantity}</Badge>
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    {warehouseInventory.length === 0 && (
                                                                        <div className="p-4 text-xs text-slate-400 text-center italic">กรุณาเลือกคลังต้นทางที่มีสินค้า</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-2">
                                                            <Input 
                                                                type="number" 
                                                                value={item.quantity === 0 ? "" : item.quantity} 
                                                                onChange={(e) => {
                                                                    const val = e.target.value === "" ? 0 : (parseInt(e.target.value) || 0)
                                                                    setItems(items.map((x, idx) => idx === i ? { ...x, quantity: val, selected_sns: [] } : x))
                                                                }} 
                                                                className="h-8" 
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-2"><Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setItems(items.filter((_, idx) => idx !== i)); setAvailableSnMap(prev => { const n = { ...prev }; delete n[i]; return n }); setItemSearch(itemSearch.filter((_, idx) => idx !== i)) }} disabled={items.length === 1}><X className="w-3.5 h-3.5" /></Button></TableCell>
                                                    </TableRow>
                                                    {product?.requires_sn && (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="py-2 bg-violet-50/60 border-b border-violet-100">
                                                                <div className="flex items-center gap-1.5 mb-2">
                                                                    <Barcode className="w-3.5 h-3.5 text-violet-500" />
                                                                    <span className="text-xs font-semibold text-violet-700">เลือก S/N ที่จะโอน (จากคลังต้นทาง)</span>
                                                                    <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.selected_sns.length === item.quantity ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                                        {item.selected_sns.length}/{item.quantity} S/N
                                                                    </span>
                                                                </div>
                                                                {availSns.length === 0 ? (
                                                                    <p className="text-[11px] text-slate-400 italic px-1">
                                                                        {!form.from_warehouse_id ? "กรุณาเลือกคลังต้นทางก่อน" : "ไม่พบ S/N ในคลังต้นทาง"}
                                                                    </p>
                                                                ) : (
                                                                    <div className="space-y-3">
                                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar">
                                                                            {Array.from({ length: item.quantity }).map((_, snIdx) => (
                                                                                <div key={snIdx} className="relative group">
                                                                                    <Input 
                                                                                        placeholder={`S/N #${snIdx + 1}`}
                                                                                        className={`text-[10px] h-8 font-mono pl-6 transition-all ${item.selected_sns[snIdx] ? "bg-violet-50 border-violet-300 text-violet-700 font-bold" : "bg-white border-slate-200 focus:border-violet-400 focus:ring-violet-500/10"}`}
                                                                                        value={item.selected_sns[snIdx] || ""}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value.trim()
                                                                                            const newSelected = [...item.selected_sns]
                                                                                            if (availSns.includes(val) && (!newSelected.includes(val) || newSelected[snIdx] === val)) {
                                                                                                newSelected[snIdx] = val
                                                                                                setItems(prev => prev.map((x, idx) => idx === i ? { ...x, selected_sns: newSelected } : x))
                                                                                            } else {
                                                                                                newSelected[snIdx] = val
                                                                                                setItems(prev => prev.map((x, idx) => idx === i ? { ...x, selected_sns: newSelected } : x))
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-300 font-bold group-focus-within:text-violet-400">{snIdx + 1}</span>
                                                                                    {item.selected_sns[snIdx] && !availSns.includes(item.selected_sns[snIdx]) && (
                                                                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" title="S/N invalid or not in stock" />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        <div className="flex flex-col gap-2 pt-2 border-t border-violet-100">
                                                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Available S/N in source:</span>
                                                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                                                                {availSns.map(sn => {
                                                                                    const selectedInAnySlot = item.selected_sns.includes(sn)
                                                                                    return (
                                                                                        <button
                                                                                            key={sn}
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                if (selectedInAnySlot) {
                                                                                                    const newSelected = item.selected_sns.filter(s => s !== sn)
                                                                                                    setItems(prev => prev.map((x, idx) => idx === i ? { ...x, selected_sns: newSelected } : x))
                                                                                                } else {
                                                                                                    const newSelected = [...item.selected_sns]
                                                                                                    const firstEmpty = newSelected.findIndex(s => !s)
                                                                                                    if (firstEmpty !== -1) newSelected[firstEmpty] = sn
                                                                                                    else newSelected.push(sn)
                                                                                                    setItems(prev => prev.map((x, idx) => idx === i ? { ...x, selected_sns: newSelected.slice(0, item.quantity) } : x))
                                                                                                }
                                                                                            }}
                                                                                            className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${selectedInAnySlot ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:bg-violet-50"}`}
                                                                                        >
                                                                                            {sn}
                                                                                        </button>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving} className="gap-2"><GitMerge className="w-4 h-4" />{saving ? t.processing : t.confirmTransfer}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-violet-600">
                            <ClipboardList className="w-5 h-5" />
                            {selectedRecord ? `${t.transfers} #${selectedRecord.id.slice(0, 8).toUpperCase()}` : t.reference}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><span className="text-slate-500 block text-xs">{t.date}</span><span className="font-medium">{formatDate(selectedRecord.date)}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.note}</span><span className="font-medium">{selectedRecord.notes || "—"}</span></div>
                                <div className="grid grid-cols-2 gap-2 col-span-2 mt-2">
                                    <div className="bg-white p-2 border border-slate-200 rounded-lg">
                                        <span className="text-slate-500 block text-xs mb-1">{t.fromWarehouse}</span><span className="font-medium text-slate-800">{selectedRecord.from_warehouse?.name || "—"}</span>
                                    </div>
                                    <div className="bg-white p-2 border border-slate-200 rounded-lg">
                                        <span className="text-slate-500 block text-xs mb-1">{t.toWarehouse}</span><span className="font-medium text-slate-800">{selectedRecord.to_warehouse?.name || "—"}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">{t.products}</h4>
                                <div className="space-y-3">
                                    {selectedRecord.stock_transfer_items?.map((item: any, i: number) => (
                                        <div key={i} className="border border-slate-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-medium text-slate-800">{item.products?.name} {(item.products?.sku || item.products?.requires_sn) && <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded ml-1">{item.products?.sku}</span>}</div>
                                                <div className="text-sm font-semibold text-violet-600">{formatNumber(item.quantity)}</div>
                                            </div>
                                            {item.products?.requires_sn && (
                                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> {(t as any).serialNumbers || "S/N"} ({item.quantity})</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.serial_numbers && item.serial_numbers.length > 0 ? (
                                                            item.serial_numbers.map((sn: string, idx: number) => (
                                                                <code key={idx} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] select-all">{sn}</code>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-400">No S/N recorded</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
