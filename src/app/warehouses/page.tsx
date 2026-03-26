"use client"

import { useEffect, useState } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Search, Edit2, Trash2, Warehouse, MapPin, User } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { mockWarehouses } from "@/lib/mock-data"

interface WarehouseItem { id: string; name: string; location: string | null; manager: string | null; created_at: string }

export default function WarehousesPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>(isSupabaseConfigured ? [] : mockWarehouses)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selected, setSelected] = useState<WarehouseItem | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: "", location: "", manager: "" })
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => { if (isSupabaseConfigured) fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        const { data } = await supabase.from("warehouses").select("*").order("name")
        setWarehouses(data || [])
        setLoading(false)
    }

    function openCreate() { setSelected(null); setForm({ name: "", location: "", manager: "" }); setDialogOpen(true) }
    function openEdit(w: WarehouseItem) { setSelected(w); setForm({ name: w.name, location: w.location || "", manager: w.manager || "" }); setDialogOpen(true) }

    async function handleSave() {
        if (!form.name) { toast({ title: t.nameRequired, variant: "destructive" }); return }
        if (!isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        setSaving(true)
        const payload = { name: form.name, location: form.location || null, manager: form.manager || null }
        const op = selected ? (supabase.from("warehouses") as any).update(payload as any).eq("id", selected.id) : (supabase.from("warehouses") as any).insert(payload as any)
        const { error } = await op
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: selected ? t.warehouseUpdated : t.warehouseCreated }); setDialogOpen(false); fetchData() }
        setSaving(false)
    }

    async function handleDelete() {
        if (!selected || !isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        const { error } = await supabase.from("warehouses").delete().eq("id", selected.id)
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: t.warehouseDeleted }); setDeleteDialogOpen(false); fetchData() }
    }

    const filtered = warehouses.filter((w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.location || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.warehouses} description={`${warehouses.length} ${t.warehouses.toLowerCase()}`}
                actions={isAdmin ? <Button onClick={openCreate} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.addWarehouse}</Button> : undefined} />
            <div className="p-6 space-y-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="border-slate-200"><CardContent className="p-6">
                                <div className="h-4 w-24 bg-slate-100 rounded shimmer mb-3" />
                                <div className="h-3 w-32 bg-slate-100 rounded shimmer mb-2" />
                                <div className="h-3 w-20 bg-slate-100 rounded shimmer" />
                            </CardContent></Card>
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center py-16 text-slate-400">
                            <Warehouse className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noWarehouses}</p>
                        </div>
                    ) : (
                        filtered.map((w) => (
                            <Card key={w.id} className="border-slate-200 hover:border-slate-300 transition-colors group">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Warehouse className="w-5 h-5 text-emerald-600" /></div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(w)}><Edit2 className="w-3.5 h-3.5" /></Button>}
                                            {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setSelected(w); setDeleteDialogOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm text-slate-800 mb-2">{w.name}</h3>
                                    {w.location && <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{w.location}</span></div>}
                                    {w.manager && <div className="flex items-center gap-1.5 text-xs text-slate-500"><User className="w-3 h-3 flex-shrink-0" /><span>{w.manager}</span></div>}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-400">{formatDate(w.created_at)}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{selected ? t.editWarehouse : t.addWarehouse}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5"><Label>{t.warehouseName} *</Label><Input placeholder={t.warehouseName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>{t.location}</Label><Input placeholder={t.location} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>{t.manager}</Label><Input placeholder={t.manager} value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving}>{saving ? t.saving : selected ? t.update : t.create}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{t.deleteWarehouse}</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">{t.confirmDelete}</p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="destructive" onClick={handleDelete}>{t.delete}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
