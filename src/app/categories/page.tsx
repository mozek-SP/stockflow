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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { useAuth } from "@/contexts/AuthContext"
import { Plus, Search, Edit2, Trash2, Tag, Barcode } from "lucide-react"
import { mockCategories } from "@/lib/mock-data"

interface Category { id: string; name: string; description: string | null; created_at: string }

export default function CategoriesPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [] : mockCategories)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selected, setSelected] = useState<Category | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: "", description: "" })
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => { if (isSupabaseConfigured) fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        const { data } = await supabase.from("categories").select("*").order("name")
        setCategories(data || [])
        setLoading(false)
    }

    function openCreate() { setSelected(null); setForm({ name: "", description: "" }); setDialogOpen(true) }
    function openEdit(cat: Category) { setSelected(cat); setForm({ name: cat.name, description: cat.description || "" }); setDialogOpen(true) }

    async function handleSave() {
        if (!form.name) { toast({ title: t.nameRequired, variant: "destructive" }); return }
        if (!isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        setSaving(true)
        const payload = { name: form.name, description: form.description || null } as any
        const op = selected ? (supabase.from("categories") as any).update(payload as any).eq("id", selected.id) : (supabase.from("categories") as any).insert(payload as any)
        const { error } = await op
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: selected ? t.categoryUpdated : t.categoryCreated }); setDialogOpen(false); fetchData() }
        setSaving(false)
    }

    async function handleDelete() {
        if (!selected || !isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        const { error } = await supabase.from("categories").delete().eq("id", selected.id)
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: t.categoryDeleted }); setDeleteDialogOpen(false); fetchData() }
    }

    const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.categories} description={`${categories.length} ${t.categories.toLowerCase()}`}
                actions={isAdmin ? <Button onClick={openCreate} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.addCategory}</Button> : undefined} />
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
                            <div className="flex flex-col items-center py-16 text-slate-400"><Tag className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">{t.noCategories}</p></div>
                        ) : (
                            <Table>
                                <TableHeader><TableRow><TableHead>{t.name}</TableHead><TableHead>{t.description}</TableHead><TableHead className="text-right">{t.actions}</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filtered.map((cat) => (
                                        <TableRow key={cat.id}>
                                            <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><Tag className="w-3.5 h-3.5 text-violet-600" /></div><span className="font-medium text-sm text-slate-800">{cat.name}</span></div></TableCell>
                                            <TableCell><span className="text-sm text-slate-500">{cat.description || "—"}</span></TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>}
                                                    {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setSelected(cat); setDeleteDialogOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                                </div>
                                            </TableCell>
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
                    <DialogHeader><DialogTitle>{selected ? t.editCategory : t.addCategory}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-1.5"><Label>{t.name} *</Label><Input placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label>{t.description}</Label><Textarea placeholder={t.description} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving}>{saving ? t.saving : selected ? t.update : t.create}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{t.deleteCategory}</DialogTitle></DialogHeader>
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
