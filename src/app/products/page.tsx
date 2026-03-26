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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/components/ui/ActionNotification"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { Plus, Search, Edit2, Trash2, Box, AlertTriangle, Package, Barcode, UploadCloud, X, Image as ImageIcon, ChevronLeft, ChevronRight } from "lucide-react"

interface Product {
    id: string; sku: string; barcode: string | null; name: string
    category_id: string | null; unit: string; dealer_price: number; net_price: number; retail_price: number
    minimum_stock: number; image_url: string | null; image_urls?: string[] | null; requires_sn?: boolean; created_at: string
    categories?: { name: string } | null
}
interface Category { id: string; name: string }

const UNITS = ["pcs", "box", "kg", "liter", "meter", "set", "dozen", "pack", "roll", "bag"]

export default function ProductsPage() {
    const { t } = useLang()
    const { isAdmin } = useAuth()
    const { success, error: notifError } = useNotification()
    const store = useMockStore()
    const [products, setProducts] = useState<Product[]>(isSupabaseConfigured ? [] : store.products as any)
    const [categories, setCategories] = useState<Category[]>(isSupabaseConfigured ? [] : store.categories)
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [saving, setSaving] = useState(false)
    const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({})
    const [snDialogOpen, setSnDialogOpen] = useState(false)
    const [selectedSnProduct, setSelectedSnProduct] = useState<Product | null>(null)
    const [activeItems, setActiveItems] = useState<{ sn: string, date: string, isSn: boolean, qty: number }[]>([])
    const [loadingSns, setLoadingSns] = useState(false)
    const [form, setForm] = useState({ sku: "", barcode: "", name: "", category_id: "", unit: "pcs", dealer_price: "", net_price: "", retail_price: "", minimum_stock: "0", image_url: "", image_urls: [] as string[], requires_sn: false })
    const [uploading, setUploading] = useState(false)
    const [previewImages, setPreviewImages] = useState<{ file?: File, url: string }[]>([])
    const [galleryOpen, setGalleryOpen] = useState(false)
    const [galleryProduct, setGalleryProduct] = useState<Product | null>(null)
    const [galleryIndex, setGalleryIndex] = useState(0)
    const { toast } = useToast()
    const supabase = createClient()

    useEffect(() => {
        if (isSupabaseConfigured) { fetchProducts(); fetchCategories() }
    }, [])

    // Track mock inventory changes live
    useEffect(() => {
        if (!isSupabaseConfigured) {
            const map: Record<string, number> = {}
            store.products.forEach((p: any) => { map[p.id] = store.getInventoryQty(p.id) })
            setInventoryMap(map)
        }
    }, [store.products, store.inventoryMap])

    async function fetchProducts() {
        setLoading(true)
        const { data } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false })
        setProducts((data as any) || [])
        const { data: inv } = await supabase.from("inventory").select("product_id, quantity")
        const map: Record<string, number> = {}
        inv?.forEach((i: any) => { map[i.product_id] = (map[i.product_id] || 0) + i.quantity })
        setInventoryMap(map)
        setLoading(false)
    }

    async function fetchCategories() {
        const { data } = await supabase.from("categories").select("id, name").order("name")
        setCategories(data || [])
    }

    function openCreate() {
        setSelectedProduct(null)
        setForm({ sku: "", barcode: "", name: "", category_id: "", unit: "pcs", dealer_price: "", net_price: "", retail_price: "", minimum_stock: "0", image_url: "", image_urls: [], requires_sn: false })
        setPreviewImages([])
        setDialogOpen(true)
    }

    function openEdit(p: Product) {
        setSelectedProduct(p)
        const urls = p.image_urls || (p.image_url ? [p.image_url] : [])
        setForm({ sku: p.sku, barcode: p.barcode || "", name: p.name, category_id: p.category_id || "", unit: p.unit, dealer_price: p.dealer_price.toString(), net_price: p.net_price.toString(), retail_price: p.retail_price.toString(), minimum_stock: p.minimum_stock.toString(), image_url: p.image_url || "", image_urls: urls, requires_sn: p.requires_sn || false })
        setPreviewImages(urls.map(url => ({ url })))
        setDialogOpen(true)
    }

    async function openSn(p: Product) {
        setSelectedSnProduct(p)
        setActiveItems([])
        setSnDialogOpen(true)
        setLoadingSns(true)

        try {
            let moves: any[] = []
            if (isSupabaseConfigured) {
                const { data } = await supabase.from("stock_movements").select("type, quantity, serial_numbers, created_at, notes, warehouses(id)").eq("product_id", p.id).order("created_at", { ascending: true })
                moves = data || []
            } else {
                moves = store.movements.filter(m => m.products?.sku === p.sku).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            }

            if (p.requires_sn) {
                const snMap = new Map<string, string>() // sn -> receive date
                for (const m of moves) {
                    if (!m.serial_numbers || !Array.isArray(m.serial_numbers)) continue;
                    for (const sn of m.serial_numbers) {
                        if (["IN", "TRANSFER_IN"].includes(m.type) || (m.type === "ADJUSTMENT" && m.notes?.includes("+"))) {
                            snMap.set(sn, m.created_at)
                        } else if (["OUT", "TRANSFER_OUT"].includes(m.type) || (m.type === "ADJUSTMENT" && m.notes && !m.notes?.includes("+"))) {
                            snMap.delete(sn)
                        }
                    }
                }

                let snActive = Array.from(snMap.entries()).map(([sn, date]) => ({ sn, date, isSn: true, qty: 1 }))

                // Reconcile with actual total inventory to handle missing initial IN movements
                const actualTotal = inventoryMap[p.id] || 0
                if (actualTotal > snActive.length) {
                    const diff = actualTotal - snActive.length;
                    for (let i = 0; i < diff; i++) {
                        snActive.push({
                            sn: `Unknown S/N (System/Initial) - ${i + 1}`,
                            date: p.created_at || new Date().toISOString(),
                            isSn: true,
                            qty: 1
                        })
                    }
                } else if (actualTotal < snActive.length) {
                    // Randomly trim if actual is less than tracked (data inconsistency)
                    snActive = snActive.slice(0, actualTotal)
                }

                setActiveItems(snActive)
            } else {
                let lots: { date: string, qty: number }[] = []
                for (const m of moves) {
                    const isAddition = m.type === "IN" || (m.type === "ADJUSTMENT" && m.notes && m.notes.includes("+"))
                    const isRemoval = m.type === "OUT" || (m.type === "ADJUSTMENT" && m.notes && !m.notes.includes("+"))

                    if (isAddition) {
                        lots.push({ date: m.created_at, qty: m.quantity })
                    } else if (isRemoval) {
                        let qtyToRemove = m.quantity
                        for (let i = 0; i < lots.length && qtyToRemove > 0; i++) {
                            if (lots[i].qty > 0) {
                                if (lots[i].qty <= qtyToRemove) {
                                    qtyToRemove -= lots[i].qty
                                    lots[i].qty = 0
                                } else {
                                    lots[i].qty -= qtyToRemove
                                    qtyToRemove = 0
                                }
                            }
                        }
                    }
                }
                lots = lots.filter(l => l.qty > 0)

                // Reconcile with actual total inventory to handle missing initial IN movements or DB inconsistencies
                const calculatedTotal = lots.reduce((sum, l) => sum + l.qty, 0)
                const actualTotal = inventoryMap[p.id] || 0

                if (actualTotal > calculatedTotal) {
                    lots.unshift({
                        date: p.created_at || new Date().toISOString(),
                        qty: actualTotal - calculatedTotal
                    })
                } else if (actualTotal < calculatedTotal) {
                    let diff = calculatedTotal - actualTotal
                    for (let i = 0; i < lots.length && diff > 0; i++) {
                        if (lots[i].qty <= diff) {
                            diff -= lots[i].qty
                            lots[i].qty = 0
                        } else {
                            lots[i].qty -= diff
                            diff = 0
                        }
                    }
                    lots = lots.filter(l => l.qty > 0)
                }

                setActiveItems(lots.map(l => ({
                    sn: `Lot ${new Date(l.date).toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}`,
                    date: l.date,
                    isSn: false,
                    qty: l.qty
                })))
            }
        } catch (e) {
            console.error(e)
        }
        setLoadingSns(false)
    }

    function calculateAge(dateStr: string) {
        const received = new Date(dateStr)
        const now = new Date()
        let diffMs = now.getTime() - received.getTime()
        if (diffMs < 0) diffMs = 0

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        const years = Math.floor(days / 365)
        const remainingDays = days % 365
        const months = Math.floor(remainingDays / 30)
        const finalDays = remainingDays % 30

        const parts = []
        if (years > 0) parts.push(`${years} ปี`)
        if (months > 0) parts.push(`${months} เดือน`)
        if (finalDays > 0 || parts.length === 0) parts.push(`${finalDays} วัน`)

        return parts.join(" ")
    }

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files) return
        const files = Array.from(e.target.files)
        if (previewImages.length + files.length > 5) {
            toast({ title: "Limit Reached", description: "You can only upload up to 5 images", variant: "destructive" }); return
        }

        const newPreviews = files.map(file => ({
            file,
            url: URL.createObjectURL(file)
        }))
        setPreviewImages([...previewImages, ...newPreviews])
    }

    function removeImage(index: number) {
        const updated = [...previewImages]
        const removed = updated.splice(index, 1)[0]
        if (removed.file) URL.revokeObjectURL(removed.url)
        setPreviewImages(updated)
    }

    async function uploadImages() {
        const urls: string[] = []
        setUploading(true)
        for (const item of previewImages) {
            if (!item.file) {
                urls.push(item.url)
                continue
            }
            const fileName = `${Date.now()}-${item.file.name}`
            const { data, error } = await supabase.storage.from("products").upload(fileName, item.file)
            if (error) {
                console.error("Upload error:", error)
                continue
            }
            const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName)
            urls.push(publicUrl)
        }
        setUploading(false)
        return urls
    }

    function openGallery(p: Product, index: number = 0) {
        setGalleryProduct(p)
        setGalleryIndex(index)
        setGalleryOpen(true)
    }

    async function handleSave() {
        if (!form.name || !form.sku) {
            toast({ title: t.validationError, description: "Name and SKU are required", variant: "destructive" }); return
        }
        if (!isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        setSaving(true)

        try {
            const uploadedUrls = await uploadImages()
            const payload = {
                sku: form.sku,
                barcode: form.barcode || null,
                name: form.name,
                category_id: form.category_id || null,
                unit: form.unit,
                dealer_price: parseFloat(form.dealer_price) || 0,
                net_price: parseFloat(form.net_price) || 0,
                retail_price: parseFloat(form.retail_price) || 0,
                minimum_stock: parseInt(form.minimum_stock) || 0,
                image_url: uploadedUrls[0] || null,
                image_urls: uploadedUrls,
                requires_sn: form.requires_sn
            }
            if (selectedProduct) {
                const { error } = await (supabase.from("products") as any).update(payload as any).eq("id", selectedProduct.id)
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
                else { toast({ title: t.productUpdated }); success(t.productUpdated); setDialogOpen(false); fetchProducts() }
            } else {
                const { error } = await (supabase.from("products") as any).insert([payload])
                if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
                else { toast({ title: t.productCreated }); success(t.productCreated); setDialogOpen(false); fetchProducts() }
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" })
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!selectedProduct || !isSupabaseConfigured) { toast({ title: t.demoMode, variant: "destructive" }); return }
        const { error } = await supabase.from("products").delete().eq("id", selectedProduct.id)
        if (error) toast({ title: "Error", description: error.message, variant: "destructive" })
        else { toast({ title: t.productDeleted }); setDeleteDialogOpen(false); fetchProducts() }
    }

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.products} description={`${products.length} ${t.products.toLowerCase()}`}
                actions={isAdmin ? <Button onClick={openCreate} variant="gradient" size="sm" className="gap-2"><Plus className="w-4 h-4" />{t.addProduct}</Button> : undefined} />
            <div className="p-6 space-y-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Card className="border-slate-200"><CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-16 text-slate-400">
                            <Box className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm font-medium">{t.noProducts}</p>
                            <p className="text-xs mt-1">{t.addFirstProduct}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader><TableRow>
                                <TableHead>{t.product}</TableHead><TableHead>{t.sku}</TableHead>
                                <TableHead>{t.category}</TableHead><TableHead>{t.unit}</TableHead>
                                <TableHead className="text-right">Dealer</TableHead>
                                <TableHead className="text-right">Net</TableHead>
                                <TableHead className="text-right">Retail</TableHead>
                                <TableHead className="text-right">{t.inStock}</TableHead>
                                <TableHead className="text-right">{t.minStock}</TableHead>
                                <TableHead className="text-right">{t.actions}</TableHead>
                            </TableRow></TableHeader>
                            <TableBody>
                                {filtered.map((p) => {
                                    const qty = inventoryMap[p.id] || 0
                                    const isLow = qty <= p.minimum_stock
                                    return (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => (p.image_url || (p.image_urls && p.image_urls.length > 0)) && openGallery(p)}
                                                        className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 transition-transform active:scale-95 ${(p.image_url || (p.image_urls && p.image_urls.length > 0)) ? 'cursor-pointer hover:border-violet-400' : 'cursor-default'}`}
                                                    >
                                                        {p.image_url ? (
                                                            <img src={p.image_url} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </button>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-sm text-slate-800">{p.name}</span>
                                                        {p.image_urls && p.image_urls.length > 1 && (
                                                            <span className="text-[10px] text-slate-400 font-medium">{p.image_urls.length} images</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell><code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{p.sku}</code></TableCell>
                                            <TableCell>{(p.categories as any)?.name ? <Badge variant="default" className="text-xs">{(p.categories as any).name}</Badge> : <span className="text-slate-400 text-xs">—</span>}</TableCell>
                                            <TableCell><span className="text-sm text-slate-500">{p.unit}</span></TableCell>
                                            <TableCell className="text-right"><span className="text-sm font-medium text-slate-500">{formatCurrency(p.dealer_price)}</span></TableCell>
                                            <TableCell className="text-right"><span className="text-sm font-medium text-slate-500">{formatCurrency(p.net_price)}</span></TableCell>
                                            <TableCell className="text-right"><span className="text-sm font-semibold text-emerald-600">{formatCurrency(p.retail_price)}</span></TableCell>
                                            <TableCell className="text-right"><div className="flex items-center justify-end gap-1.5">{isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}<span className={`text-sm font-medium ${isLow ? "text-amber-600" : "text-slate-700"}`}>{formatNumber(qty)}</span></div></TableCell>
                                            <TableCell className="text-right"><span className="text-sm text-slate-500">{formatNumber(p.minimum_stock)}</span></TableCell>
                                            <TableCell className="text-right"><div className="flex justify-end gap-1">
                                                <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-violet-50 hover:text-violet-600" title={p.requires_sn ? ((t as any).viewSn || "View S/N") : "View Details/Lots"} onClick={() => openSn(p)}><Barcode className="w-3.5 h-3.5" /></Button>
                                                {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(p)}><Edit2 className="w-3.5 h-3.5" /></Button>}
                                                {isAdmin && <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 hover:text-red-600" onClick={() => { setSelectedProduct(p); setDeleteDialogOpen(true) }}><Trash2 className="w-3.5 h-3.5" /></Button>}
                                            </div></TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent></Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>{selectedProduct ? t.editProduct : t.addProduct}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>{t.productName} *</Label><Input placeholder={t.productName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>{t.sku} *</Label><Input placeholder="SKU-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>{t.barcode}</Label><Input placeholder={t.barcode} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>{t.category}</Label>
                                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                                    <SelectTrigger><SelectValue placeholder={t.category} /></SelectTrigger>
                                    <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            <div className="space-y-1.5"><Label>{t.unit} *</Label>
                                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5"><Label>Dealer Price</Label><Input type="number" placeholder="0.00" value={form.dealer_price} onChange={(e) => setForm({ ...form, dealer_price: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Net Price</Label><Input type="number" placeholder="0.00" value={form.net_price} onChange={(e) => setForm({ ...form, net_price: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Retail Price</Label><Input type="number" placeholder="0.00" value={form.retail_price} onChange={(e) => setForm({ ...form, retail_price: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5"><Label>{t.minStock}</Label><Input type="number" placeholder="0" value={form.minimum_stock} onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })} /></div>
                            <div className="space-y-1.5"><Label>Product Images (Max 5 JPG)</Label>
                                <div className="grid grid-cols-5 gap-2 border-2 border-dashed border-slate-200 rounded-lg p-2 min-h-[80px]">
                                    {previewImages.map((img, i) => (
                                        <div key={i} className="relative group aspect-square rounded bg-slate-100 overflow-hidden border border-slate-200">
                                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                                            <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {previewImages.length < 5 && (
                                        <label className="aspect-square rounded border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                                            <UploadCloud className="w-5 h-5 text-slate-400" />
                                            <span className="text-[10px] text-slate-500 mt-1">Add</span>
                                            <Input type="file" accept="image/jpeg,image/jpg" multiple className="hidden" onChange={handleFileChange} />
                                        </label>
                                    )}
                                </div>
                                {uploading && (
                                    <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                                        <div className="bg-violet-600 h-full animate-pulse" style={{ width: '60%' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
                            <div className="space-y-0.5">
                                <Label className="flex items-center gap-2"><Barcode className="w-4 h-4 text-violet-500" /> {(t as any).requiresSn}</Label>
                                <p className="text-xs text-slate-500">Enable to track Serial Numbers for this product.</p>
                            </div>
                            <Switch checked={form.requires_sn} onCheckedChange={(v: boolean) => setForm({ ...form, requires_sn: v })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="gradient" onClick={handleSave} disabled={saving}>{saving ? t.saving : selectedProduct ? t.update : t.create}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{t.deleteProduct}</DialogTitle></DialogHeader>
                    <p className="text-sm text-slate-500">{t.confirmDelete}</p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>{t.cancel}</Button>
                        <Button variant="destructive" onClick={handleDelete}>{t.delete}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={snDialogOpen} onOpenChange={setSnDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Barcode className="w-5 h-5 text-violet-600" />
                            {selectedSnProduct?.requires_sn ? ((t as any).serialNumbers || "S/N Detail") : "Stock Lots Detail"}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedSnProduct && (
                        <div className="space-y-4">
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                                <div className="w-10 h-10 rounded bg-white flex items-center justify-center border border-slate-100 shadow-sm"><Package className="w-5 h-5 text-violet-500" /></div>
                                <div>
                                    <h4 className="font-semibold text-sm text-slate-800">{selectedSnProduct.name}</h4>
                                    <p className="text-xs text-slate-500">SKU: {selectedSnProduct.sku}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <Badge variant="outline" className="bg-white">{formatNumber(inventoryMap[selectedSnProduct.id] || 0)} {(t as any).inStock}</Badge>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-semibold text-slate-600 flex justify-between items-center">
                                    <div className="w-10">#</div>
                                    <div className="w-[120px]">{selectedSnProduct.requires_sn ? ((t as any).sn || "S/N") : "Lot"}</div>
                                    <div className="w-[120px]">วันที่รับเข้าสินค้า</div>
                                    <div className="flex-1 text-right">ระยะเวลาคงคลัง</div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    {loadingSns ? (
                                        <div className="py-6 text-center text-sm text-slate-400 flex justify-center">
                                            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : activeItems.length > 0 ? (
                                        activeItems.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center px-3 py-2 text-sm border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded transition-colors">
                                                <span className="text-slate-400 text-xs w-10">{i + 1}</span>
                                                <div className="w-[120px] flex items-center gap-2">
                                                    <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs select-all">
                                                        {item.sn}
                                                    </code>
                                                    {!item.isSn && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-1 rounded">x{item.qty}</span>}
                                                </div>
                                                <span className="w-[120px] text-xs font-medium text-slate-600">
                                                    {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                </span>
                                                <span className="flex-1 text-right text-xs font-semibold text-red-600">
                                                    {calculateAge(item.date)}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-6 text-center text-sm text-slate-400">
                                            {selectedSnProduct.requires_sn ? ((t as any).noSerialNumbers || "No S/N in stock") : "No quantities in stock"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSnDialogOpen(false)}>{t.cancel}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
                <DialogContent className="max-w-3xl p-0 bg-transparent border-none shadow-none">
                    {galleryProduct && (
                        <div className="relative group">
                            <div className="bg-black/90 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-white/10 shadow-2xl relative">
                                {(() => {
                                    const allImages = galleryProduct.image_urls && galleryProduct.image_urls.length > 0
                                        ? galleryProduct.image_urls
                                        : (galleryProduct.image_url ? [galleryProduct.image_url] : [])
                                    const currentImg = allImages[galleryIndex]

                                    return (
                                        <>
                                            <img src={currentImg} className="max-w-full max-h-full object-contain" alt={galleryProduct.name} />

                                            {allImages.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length) }}
                                                        className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                                                    >
                                                        <ChevronLeft className="w-6 h-6" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((galleryIndex + 1) % allImages.length) }}
                                                        className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                                                    >
                                                        <ChevronRight className="w-6 h-6" />
                                                    </button>
                                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 p-4">
                                                        {allImages.map((_, i) => (
                                                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === galleryIndex ? 'bg-white w-4' : 'bg-white/30'}`} />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )
                                })()}
                                <button
                                    onClick={() => setGalleryOpen(false)}
                                    className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-4 p-4 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl text-white">
                                <h3 className="font-semibold">{galleryProduct.name}</h3>
                                <p className="text-xs text-white/60">SKU: {galleryProduct.sku}</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
