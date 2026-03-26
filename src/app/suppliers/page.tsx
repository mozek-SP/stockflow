"use client"

import { useEffect, useState } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Search, Edit2, Trash2, Truck, Mail, Phone, MapPin, User } from "lucide-react"
import { mockSuppliers } from "@/lib/mock-data"

interface Supplier { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; created_at: string }

export default function SuppliersPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const [suppliers, setSuppliers] = useState<Supplier[]>(isSupabaseConfigured ? [] : mockSuppliers)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Supplier | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" })
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => { if (isSupabaseConfigured) fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        const { data } = await supabase.from("suppliers").select("*").order("name")
        setSuppliers(data || [])
        setLoading(false)
    }

    function openCreate() { setSelected(null); setForm({ name: "", contact_person: "", phone: "", email: "", address: "" }); setDialogOpen(true) }
    function openEdit(s: Supplier) { setSelected(s); setForm({ name: s.name, contact_person: s.contact_person || "", phone: s.phone || "", email: s.email || "", address: s.address || "" }); setDialogOpen(true) }

    async function handleSave() {
        if (!form.name) { toast({ title: t.nameRequired, variant: "destructive" }); return }
        if (!isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        setSaving(true)
        const payload = { name: form.name, contact_person: form.contact_person || null, phone: form.phone || null, email: form.email || null, address: form.address || null }
        const op = selected ? (supabase.from("suppliers") as any).update(payload as any).eq("id", selected.id) : (supabase.from("suppliers") as any).insert(payload as any)
        const { error } = await op
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: selected ? t.supplierUpdated : t.supplierCreated }); setDialogOpen(false); fetchData() }
        setSaving(false)
    }

    async function handleDelete() {
        if (!selected || !isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        const { error } = await supabase.from("suppliers").delete().eq("id", selected.id)
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: t.supplierDeleted }); setDeleteDialogOpen(false); fetchData() }
    }

    const filtered = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.suppliers} description={`${suppliers.length} ${t.suppliers.toLowerCase()}`}
                actions={isAdmin ? <Button onClick={openCreate} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.addSupplier}</Button> : undefined} />
            <div className="p-6 space-y-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Card className="border-slate-200">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-slate-400"><Truck className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noSuppliers}</p></div>
                        ) : (
                            <Table>
                                <TableHeader><TableRow>
                                    <TableHead>{t.companyName}</TableHead><TableHead>{t.contactPerson}</TableHead>
                                    <TableHead>{t.phone}</TableHead><TableHead>{t.email}</TableHead>
                                    <TableHead>{t.address}</TableHead><TableHead className="text-right">{t.actions}</TableHead>
                                </TableRow></TableHeader>
                                <TableBody>
                                    {filtered.map((s) => (
                                        <TableRow key={s.id}>
                                            <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Truck className="w-3.5 h-3.5 text-blue-600" /></div><span className="font-medium text-sm text-slate-800">{s.name}</span></div></TableCell>
                                            <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-500">{s.contact_person ? <><User className="w-3 h-3" />{s.contact_person}</> : "—"}</div></TableCell>
                                            <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-500">{s.phone ? <><Phone className="w-3 h-3" />{s.phone}</> : "—"}</div></TableCell>
                                            <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-500">{s.email ? <><Mail className="w-3 h-3" />{s.email}</> : "—"}</div></TableCell>
                                            <TableCell><div className="flex items-center gap-1.5 text-sm text-slate-500 max-w-[180px]">{s.address ? <><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{s.address}</span></> : "—"}</div></TableCell>
                                            <TableCell className="text-right"><div className="flex justify-end gap-1">
                                                {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(s)}><Edit2 className="w-3.5 h-3.5" /></Button>}
                                                {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setSelected(s); setDeleteDialogOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                            </div></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{selected ? t.editSupplier : t.addSupplier}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5"><Label>{t.companyName} *</Label><Input placeholder={t.companyName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>{t.contactPerson}</Label><Input placeholder={t.contactPerson} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>{t.phone}</Label><Input placeholder="+66 2 xxx xxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                        </div>
                        <div className="space-y-1.5"><Label>{t.email}</Label><Input type="email" placeholder="email@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>{t.address}</Label><Textarea placeholder={t.address} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving}>{saving ? t.saving : selected ? t.update : t.create}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{t.deleteSupplier}</DialogTitle></DialogHeader>
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
