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
import { Plus, PackagePlus, X, Barcode, ClipboardList, Eye, Search, Edit2, Trash2 } from "lucide-react"
// Note: Manual searchable select used instead of Popover/Command components

interface LineItem { product_id: string; quantity: number; serial_numbers?: string }

export default function StockInPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const store = useMockStore()
    const [records, setRecords] = useState<any[]>(isSupabaseConfigured ? [] : store.stockIns)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [productsList, setProductsList] = useState<any[]>(isSupabaseConfigured ? [] : store.products)
    const [suppliersList, setSuppliersList] = useState<any[]>(isSupabaseConfigured ? [] : store.suppliers)
    const [warehousesList, setWarehousesList] = useState<any[]>(isSupabaseConfigured ? [] : store.warehouses)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ supplier_id: "", warehouse_id: "", date: new Date().toISOString().split("T")[0], notes: "" })
    const [items, setItems] = useState<LineItem[]>([{ product_id: "", quantity: 1, serial_numbers: "" }])
    const [itemSearch, setItemSearch] = useState<string[]>([]) // Track search text for each row
    const { toast } = useToast()
    const supabase = createClient()

    // Live sync from store in mock mode
    useEffect(() => { 
        if (!isSupabaseConfigured) {
            setRecords(store.stockIns)
            setProductsList(store.products)
            setSuppliersList(store.suppliers)
            setWarehousesList(store.warehouses)
        } 
    }, [store.stockIns, store.products, store.suppliers, store.warehouses])
    useEffect(() => { if (isSupabaseConfigured) { fetchData(); } }, [])

    async function fetchData() {
        setLoading(true)
        const [
            { data: inData },
            { data: prodData },
            { data: supData },
            { data: whData }
        ] = await Promise.all([
            supabase.from("stock_in").select("*, suppliers(name), warehouses(name), stock_in_items(quantity, serial_numbers, products(name, sku, requires_sn))").order("created_at", { ascending: false }).limit(50),
            supabase.from("products").select("id, name, sku, requires_sn").order("sku"),
            supabase.from("suppliers").select("id, name").order("name"),
            supabase.from("warehouses").select("id, name").order("name")
        ])
        setRecords((inData as any) || [])
        if (prodData) setProductsList(prodData)
        if (supData) setSuppliersList(supData)
        if (whData) setWarehousesList(whData)
        setLoading(false)
    }

    function resetForm() { 
        setForm({ supplier_id: "", warehouse_id: "", date: new Date().toISOString().split("T")[0], notes: "" }); 
        setItems([{ product_id: "", quantity: 1, serial_numbers: "" }]);
        setEditingId(null);
        setItemSearch([""]);
    }

    function openEdit(r: any) {
        setEditingId(r.id)
        setForm({
            supplier_id: r.supplier_id || "",
            warehouse_id: r.warehouse_id || "",
            date: r.date,
            notes: r.notes || ""
        })
        const mappedItems = r.stock_in_items.map((i: any) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            serial_numbers: (i.serial_numbers || []).join(",")
        }))
        setItems(mappedItems)
        setItemSearch(mappedItems.map(() => ""))
        setDialogOpen(true)
    }

    async function handleSave() {
        if (!form.warehouse_id || !form.date) { toast({ title: t.warehouseDateRequired, variant: "destructive" }); return }
        const validItems = items.filter((i) => i.product_id && i.quantity > 0)
        if (validItems.length === 0) { toast({ title: t.addAtLeastOne, variant: "destructive" }); return }

        for (const item of validItems) {
            const product = productsList.find(p => p.id === item.product_id)
            if (product?.requires_sn) {
                const sns = (item.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s)
                if (sns.length !== item.quantity) {
                    toast({ title: (t as any).serialNumbers ? `${product.name} needs exactly ${item.quantity} S/N (found ${sns.length})` : "S/N mismatch", variant: "destructive" })
                    return
                }
            }
        }

        if (!isSupabaseConfigured) {
            const wh = store.warehouses.find((w) => w.id === form.warehouse_id)
            const sup = store.suppliers.find((s) => s.id === form.supplier_id)
            const newRecord = {
                id: `si-${Date.now()}`,
                date: form.date, created_at: new Date().toISOString(),
                supplier_id: form.supplier_id || null, warehouse_id: form.warehouse_id, notes: form.notes || null,
                suppliers: sup ? { name: sup.name } : null,
                warehouses: wh ? { name: wh.name } : null,
                stock_in_items: validItems.map((i) => {
                    const p = productsList.find((p) => p.id === i.product_id);
                    const sns = p?.requires_sn ? (i.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s) : [];
                    return { quantity: i.quantity, serial_numbers: sns, products: { name: p?.name || "?", sku: p?.sku || "?", requires_sn: p?.requires_sn || false } }
                }),
            }
            store.setStockIns([newRecord, ...store.stockIns])
            for (const item of validItems) {
                const prod = productsList.find((p) => p.id === item.product_id)
                const sns = prod?.requires_sn ? (item.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s) : [];
                store.addMovement({
                    product_id: item.product_id, warehouse_id: form.warehouse_id,
                    type: "IN", quantity: item.quantity,
                    notes: form.notes ? `Stock In #${newRecord.id.slice(0, 8)} - ${form.notes}` : `Stock In #${newRecord.id.slice(0, 8)}`,
                    products: prod ? { name: prod.name, sku: prod.sku } : null,
                    warehouses: wh ? { name: wh.name } : null,
                    serial_numbers: sns,
                })
            }
            toast({ title: t.stockInRecorded }); setDialogOpen(false); resetForm(); return
        }

        setSaving(true)
        try {
            let stockInId = editingId
            
            if (editingId) {
                // Handle Update Logic
                // 1. Revert Inventory
                const { data: oldItems } = await supabase.from("stock_in_items").select("*").eq("stock_in_id", editingId)
                const oldRecord = records.find(r => r.id === editingId)
                if (oldItems && oldRecord) {
                    for (const oi of (oldItems as any[])) {
                        const { data: ex } = await supabase.from("inventory").select("id, quantity").eq("product_id", oi.product_id).eq("warehouse_id", oldRecord.warehouse_id).single()
                        if (ex) await (supabase.from("inventory") as any).update({ quantity: (ex as any).quantity - oi.quantity } as any).eq("id", (ex as any).id)
                    }
                }
                
                // 2. Clear old movements and items
                await supabase.from("stock_movements").delete().eq("reference_id", editingId)
                await supabase.from("stock_in_items").delete().eq("stock_in_id", editingId)
                
                // 3. Update Header
                const { error: hErr } = await (supabase.from("stock_in") as any).update({ supplier_id: form.supplier_id || null, warehouse_id: form.warehouse_id, date: form.date, notes: form.notes || null } as any).eq("id", editingId)
                if (hErr) throw hErr
            } else {
                // Insert New
                const { data: stockIn, error: hErr } = await (supabase.from("stock_in") as any).insert({ supplier_id: form.supplier_id || null, warehouse_id: form.warehouse_id, date: form.date, notes: form.notes || null, created_by: "admin" } as any).select().single()
                if (hErr) throw hErr
                stockInId = (stockIn as any).id
            }

            // Common Insert Logic for items/movements/inventory
            await (supabase.from("stock_in_items") as any).insert(validItems.map((i) => {
                const product = productsList.find(p => p.id === i.product_id);
                const sns = product?.requires_sn ? (i.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s) : [];
                return { stock_in_id: stockInId, product_id: i.product_id, quantity: i.quantity, serial_numbers: sns }
            }) as any)

            for (const item of validItems) {
                const product = productsList.find(p => p.id === item.product_id);
                const sns = product?.requires_sn ? (item.serial_numbers || "").split(",").map(s => s.trim()).filter(s => s) : [];
                
                // Add Movement
                await (supabase.from("stock_movements") as any).insert({ product_id: item.product_id, warehouse_id: form.warehouse_id, type: "IN", quantity: item.quantity, reference_id: stockInId, notes: form.notes ? `Stock In #${stockInId!.slice(0, 8)} - ${form.notes}` : `Stock In #${stockInId!.slice(0, 8)}`, serial_numbers: sns } as any)
                
                // Update Inventory
                const { data: ex } = await supabase.from("inventory").select("id, quantity").eq("product_id", item.product_id).eq("warehouse_id", form.warehouse_id).single()
                if (ex) await (supabase.from("inventory") as any).update({ quantity: (ex as any).quantity + item.quantity } as any).eq("id", (ex as any).id)
                else await (supabase.from("inventory") as any).insert({ product_id: item.product_id, warehouse_id: form.warehouse_id, quantity: item.quantity } as any)
            }

            toast({ title: editingId ? (t as any).stockInUpdated || "อัปเดตเรียบร้อย" : t.stockInRecorded }); setDialogOpen(false); resetForm(); fetchData()
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }) }
        setSaving(false)
    }

    const totalItems = (r: any) => r.stock_in_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.stockIn} description={t.receiveInventory}
                actions={isAdmin ? <Button onClick={() => { resetForm(); setDialogOpen(true) }} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.newStockIn}</Button> : undefined} />
            <div className="p-6">
                <Card className="border-slate-200"><CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-slate-400"><PackagePlus className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noStockIn}</p></div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t.reference}</TableHead><TableHead>{t.date}</TableHead>
                                <TableHead>{t.supplier}</TableHead><TableHead>{t.warehouse}</TableHead>
                                <TableHead>{t.product}</TableHead><TableHead>{t.note}</TableHead><TableHead className="text-right">{t.totalQty}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {records.map((r) => (
                                    <TableRow key={r.id} onClick={() => { setSelectedRecord(r); setDetailsOpen(true); }} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                        <TableCell><code className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono">#{r.id.slice(0, 8).toUpperCase()}</code></TableCell>
                                        <TableCell className="text-sm text-slate-500">{formatDate(r.date)}</TableCell>
                                        <TableCell className="text-sm text-slate-700">{r.suppliers?.name || "—"}</TableCell>
                                        <TableCell><Badge variant="default">{r.warehouses?.name || "—"}</Badge></TableCell>
                                        <TableCell><div className="flex flex-wrap gap-1">{r.stock_in_items?.slice(0, 2).map((i: any, idx: number) => (<span key={idx} className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{i.products?.name}</span>))}{(r.stock_in_items?.length || 0) > 2 && <span className="text-xs text-slate-400">+{r.stock_in_items.length - 2}</span>}</div></TableCell>
                                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{r.notes || "—"}</TableCell>
                                        <TableCell className="text-right"><span className="text-sm font-semibold text-emerald-600">+{formatNumber(totalItems(r))}</span></TableCell>
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

            <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); setDialogOpen(o); }}>
                <DialogContent className="max-w-none w-screen h-screen m-0 rounded-none overflow-y-auto">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><PackagePlus className="w-5 h-5 text-emerald-600" />{editingId ? (t as any).editProduct || "แก้ไขรายการ" : t.newStockIn}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5"><Label>{t.date} *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>{t.warehouse} *</Label>
                                <Select value={form.warehouse_id} onValueChange={(v) => setForm({ ...form, warehouse_id: v })}>
                                    <SelectTrigger><SelectValue placeholder={t.selectWarehouse} /></SelectTrigger>
                                    <SelectContent>{warehousesList.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>{t.supplier}</Label>
                                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                                    <SelectTrigger><SelectValue placeholder={t.selectSupplier} /></SelectTrigger>
                                    <SelectContent>{suppliersList.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1.5"><Label>{t.note}</Label><Input placeholder={t.note} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between"><Label>{t.products}</Label><Button size="sm" variant="outline" onClick={() => { setItems([...items, { product_id: "", quantity: 1 }]); setItemSearch([...itemSearch, ""]) }} className="gap-1 h-7 text-xs"><Plus className="w-3 h-3" />{t.addRow}</Button></div>
                            <div className="rounded-xl border border-slate-200">
                                <Table className="!overflow-visible" wrapperClassName="!overflow-visible">
                                    <TableHeader className="!overflow-visible"><TableRow className="!overflow-visible"><TableHead>{t.product}</TableHead><TableHead className="w-32">{t.quantity}</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
                                    <TableBody className="!overflow-visible">
                                        {items.map((item, i) => {
                                            const product = productsList.find(p => p.id === item.product_id);
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
                                                                <div className="absolute top-full left-0 w-full min-w-[300px] mt-1 z-[110] bg-white border border-slate-300 rounded-lg shadow-2xl hidden group-focus-within:block max-h-60 overflow-y-auto overflow-x-hidden">
                                                                    {productsList.filter(p => !itemSearch[i] || p.name.toLowerCase().includes(itemSearch[i].toLowerCase()) || p.sku.toLowerCase().includes(itemSearch[i].toLowerCase())).map(p => (
                                                                        <div 
                                                                            key={p.id} 
                                                                            className="px-4 py-2.5 hover:bg-violet-50 cursor-pointer flex flex-col gap-0.5 border-b border-slate-50 last:border-0 transition-colors"
                                                                            onMouseDown={() => {
                                                                                setItems(items.map((x, idx) => idx === i ? { ...x, product_id: p.id } : x))
                                                                                const newSearch = [...itemSearch]
                                                                                newSearch[i] = "" // clear search on select
                                                                                setItemSearch(newSearch)
                                                                            }}
                                                                        >
                                                                            <span className="font-semibold text-slate-800 text-xs">{p.name}</span>
                                                                            <div className="flex items-center gap-2">
                                                                                <code className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">{p.sku}</code>
                                                                                {p.requires_sn && <span className="text-[9px] text-violet-500 font-medium">Requires S/N</span>}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    {productsList.filter(p => !itemSearch[i] || p.name.toLowerCase().includes(itemSearch[i].toLowerCase()) || p.sku.toLowerCase().includes(itemSearch[i].toLowerCase())).length === 0 && (
                                                                        <div className="p-4 text-xs text-slate-400 text-center italic">No products found</div>
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
                                                                    setItems(items.map((x, idx) => idx === i ? { ...x, quantity: val } : x))
                                                                }} 
                                                                className="h-8" 
                                                            />
                                                        </TableCell>
                                                        <TableCell className="py-2"><Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setItems(items.filter((_, idx) => idx !== i)); setItemSearch(itemSearch.filter((_, idx) => idx !== i)) }} disabled={items.length === 1}><X className="w-3.5 h-3.5" /></Button></TableCell>
                                                    </TableRow>
                                                    {product?.requires_sn && (
                                                        <TableRow>
                                                            <TableCell colSpan={3} className="py-2 bg-slate-50 border-b border-slate-100">
                                                                <Input placeholder="Enter S/N separated by commas..." value={item.serial_numbers || ""} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, serial_numbers: e.target.value } : x))} className="text-xs h-8" />
                                                                <div className="text-[10px] text-slate-500 mt-1 pl-1">Found {(item.serial_numbers || "").split(",").filter(s => s.trim()).length} of {item.quantity} required S/Ns</div>
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
                        <Button variant="gradient" onClick={handleSave} disabled={saving} className="gap-2"><PackagePlus className="w-4 h-4" />{saving ? t.processing : t.confirmStockIn}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <ClipboardList className="w-5 h-5" />
                            {selectedRecord ? `${t.stockIn} #${selectedRecord.id.slice(0, 8).toUpperCase()}` : t.reference}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><span className="text-slate-500 block text-xs">{t.date}</span><span className="font-medium">{formatDate(selectedRecord.date)}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.warehouse}</span><span className="font-medium">{selectedRecord.warehouses?.name || "—"}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.supplier}</span><span className="font-medium">{selectedRecord.suppliers?.name || "—"}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.note}</span><span className="font-medium">{selectedRecord.notes || "—"}</span></div>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">{t.products}</h4>
                                <div className="space-y-3">
                                    {selectedRecord.stock_in_items?.map((item: any, i: number) => (
                                        <div key={i} className="border border-slate-200 rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="font-medium text-slate-800">{item.products?.name} {(item.products?.sku || item.products?.requires_sn) && <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded ml-1">{item.products?.sku}</span>}</div>
                                                <div className="text-sm font-semibold text-emerald-600">+{formatNumber(item.quantity)}</div>
                                            </div>
                                            {item.products?.requires_sn && (
                                                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100">
                                                    <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> {(t as any).serialNumbers || "S/N"} ({item.quantity})</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.serial_numbers && item.serial_numbers.length > 0 ? (
                                                            item.serial_numbers.map((sn: string, idx: number) => (
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
