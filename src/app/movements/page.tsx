"use client"

import { useState, useEffect } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { formatNumber, formatDateTime, getMovementTypeBadge, formatDate } from "@/lib/utils"
import { Search, Filter, Activity, ClipboardList, Barcode } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const TYPES = ["ALL", "IN", "OUT", "TRANSFER_IN", "TRANSFER_OUT", "ADJUSTMENT"]

export default function MovementsPage() {
    const { t } = useLang()
    const store = useMockStore()
    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [search, setSearch] = useState("")
    const [snSearch, setSnSearch] = useState("")
    const [typeFilter, setTypeFilter] = useState("ALL")
    const [dbMovements, setDbMovements] = useState<any[]>([])
    const [selectedRecord, setSelectedRecord] = useState<any>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (isSupabaseConfigured) {
            fetchData()
        }
    }, [])

    async function fetchData() {
        setLoading(true)
        const { data } = await supabase.from("stock_movements")
            .select("*, products(name, sku, requires_sn), warehouses(name)")
            .order("created_at", { ascending: false })
            .limit(100)
        setDbMovements((data as any) || [])
        setLoading(false)
    }

    const allMovements = isSupabaseConfigured ? dbMovements : store.movements

    const filtered = allMovements.filter((m) => {
        if (snSearch.trim() !== "") {
            const q = snSearch.toLowerCase().trim()
            // Search by S/N
            const sns = m.serial_numbers || []
            const matchSn = sns.some((sn: string) => sn.toLowerCase().includes(q))
            // Search by product name / SKU
            const matchProduct = (m.products?.name || "").toLowerCase().includes(q) || (m.products?.sku || "").toLowerCase().includes(q)
            // Search by notes / reference
            const matchNotes = (m.notes || "").toLowerCase().includes(q) || (m.reference_id || "").toLowerCase().includes(q)
            // Search by date (formatted)
            const matchDate = (m.created_at || "").toLowerCase().includes(q)
            return matchSn || matchProduct || matchNotes || matchDate
        }
        const matchType = typeFilter === "ALL" || m.type === typeFilter
        const matchSearch = search === "" ||
            (m.products?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (m.products?.sku || "").toLowerCase().includes(search.toLowerCase()) ||
            (m.warehouses?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (m.notes || "").toLowerCase().includes(search.toLowerCase()) ||
            m.type.toLowerCase().includes(search.toLowerCase())
        return matchType && matchSearch
    })

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.movementLog} description={`${filtered.length} ${t.type.toLowerCase()}`} />
            <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} disabled={snSearch.trim() !== ""} className="pl-9" />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter} disabled={snSearch.trim() !== ""}>
                        <SelectTrigger className="w-44">
                            <Filter className="w-4 h-4 text-slate-400 mr-1" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{tp === "ALL" ? t.allTypes : tp.replace("_", " ")}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {typeFilter !== "ALL" && snSearch.trim() === "" && (
                        <Button variant="ghost" size="sm" onClick={() => setTypeFilter("ALL")} className="text-slate-500">{t.clearFilter}</Button>
                    )}
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 flex items-center gap-3">
                    <Barcode className="w-5 h-5 text-violet-500 shrink-0 mx-1" />
                    <div className="flex-1 max-w-md">
                        <Label className="text-xs text-violet-700 font-semibold mb-1 block uppercase tracking-wider">S/N Tracker & ค้นหา</Label>
                        <Input placeholder="ค้นหา S/N, ชื่อสินค้า, หมายเหตุ, วันที่..." value={snSearch} onChange={(e) => setSnSearch(e.target.value)} className="bg-white border-violet-200 focus-visible:ring-violet-500" autoFocus />
                    </div>
                    {snSearch.trim() !== "" && (
                        <div className="text-sm font-medium text-violet-600 bg-white px-3 py-1.5 rounded border border-violet-200 shadow-sm ml-auto">
                            ค้นหา: <span className="font-mono text-violet-800">{snSearch}</span> ({filtered.length} รายการ)
                        </div>
                    )}
                </div>

                <Card className="border-slate-200">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <Activity className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm font-medium">{t.noMovementsFound}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.type}</TableHead><TableHead>{t.product}</TableHead>
                                        <TableHead>{t.warehouse}</TableHead><TableHead className="text-right">{t.quantity}</TableHead>
                                        <TableHead>{t.note}</TableHead><TableHead>{t.date}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((m) => (
                                        <TableRow key={m.id} onClick={() => { setSelectedRecord(m); setDetailsOpen(true); }} className="cursor-pointer hover:bg-slate-50 transition-colors">
                                            <TableCell>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMovementTypeBadge(m.type)}`}>
                                                    {m.type.replace("_", " ")}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <p className="text-sm font-medium text-slate-800">{m.products?.name || "—"}</p>
                                                {m.products?.sku && <p className="text-xs text-slate-400">{m.products.sku}</p>}
                                            </TableCell>
                                            <TableCell><span className="text-sm text-slate-600">{m.warehouses?.name || "—"}</span></TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-sm font-bold ${m.type === "IN" || m.type === "TRANSFER_IN" ? "text-emerald-600" : "text-red-500"}`}>
                                                    {m.type === "IN" || m.type === "TRANSFER_IN" ? "+" : "-"}{formatNumber(m.quantity)}
                                                </span>
                                            </TableCell>
                                            <TableCell><span className="text-xs text-slate-400">{m.notes || m.reference_id || "—"}</span></TableCell>
                                            <TableCell><span className="text-xs text-slate-500">{formatDateTime(m.created_at)}</span></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-violet-700">
                            <ClipboardList className="w-5 h-5" />
                            {selectedRecord ? ((t as any).lang === "TH" ? "รายละเอียดความเคลื่อนไหว" : "Movement Details") : ""}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedRecord && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div><span className="text-slate-500 block text-xs">{t.date}</span><span className="font-medium">{formatDateTime(selectedRecord.created_at)}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.type}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border inline-block mt-0.5 ${getMovementTypeBadge(selectedRecord.type)}`}>
                                        {selectedRecord.type.replace("_", " ")}
                                    </span>
                                </div>
                                <div><span className="text-slate-500 block text-xs">{t.warehouse}</span><span className="font-medium">{selectedRecord.warehouses?.name || "—"}</span></div>
                                <div><span className="text-slate-500 block text-xs">{t.quantity}</span>
                                    <span className={`font-bold ${selectedRecord.type === "IN" || selectedRecord.type === "TRANSFER_IN" ? "text-emerald-600" : "text-red-500"}`}>
                                        {selectedRecord.type === "IN" || selectedRecord.type === "TRANSFER_IN" ? "+" : "-"}{formatNumber(selectedRecord.quantity)}
                                    </span>
                                </div>
                                <div className="col-span-2"><span className="text-slate-500 block text-xs">{t.note}</span><span className="font-medium">{selectedRecord.notes || selectedRecord.reference_id || "—"}</span></div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2">{t.product}</h4>
                                <div className="border border-slate-200 rounded-lg p-3">
                                    <div className="font-medium text-slate-800">{selectedRecord.products?.name || "—"} {(selectedRecord.products?.sku || selectedRecord.products?.requires_sn) && <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1 py-0.5 rounded ml-1">{selectedRecord.products?.sku}</span>}</div>

                                    {selectedRecord.products?.requires_sn && (
                                        <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 mt-3">
                                            <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Barcode className="w-3.5 h-3.5" /> {(t as any).serialNumbers || "S/N"}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {selectedRecord.serial_numbers && selectedRecord.serial_numbers.length > 0 ? (
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
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
