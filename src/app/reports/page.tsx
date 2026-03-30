"use client"

import { useState, useCallback, useEffect } from "react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { TopBar } from "@/components/layout/TopBar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLang } from "@/lib/i18n"
import { useMockStore } from "@/lib/mock-store"
import { formatNumber, formatDateTime, formatDate, getMovementTypeBadge } from "@/lib/utils"
import { useNotification } from "@/components/ui/ActionNotification"
import {
    FileText, FileSpreadsheet, Download, Package, PackagePlus, PackageMinus,
    Activity, BarChart2, Filter, CheckCircle2, Loader2,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type ReportType = "products" | "stock-in" | "stock-out" | "movements" | "stock-history"

interface ReportTab {
    id: ReportType
    label: string
    labelEN: string
    icon: React.ElementType
    color: string
    bgColor: string
}

// ─── Report Config ────────────────────────────────────────────────────────────
const REPORT_TABS: ReportTab[] = [
    { id: "products",      label: "สินค้า",                  labelEN: "Products",        icon: Package,      color: "text-violet-600", bgColor: "bg-violet-50" },
    { id: "stock-in",      label: "รับสินค้า",               labelEN: "Stock In",        icon: PackagePlus,  color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { id: "stock-out",     label: "จ่ายสินค้า",              labelEN: "Stock Out",       icon: PackageMinus, color: "text-red-500",     bgColor: "bg-red-50" },
    { id: "movements",     label: "ประวัติความเคลื่อนไหว",   labelEN: "Movements",       icon: Activity,     color: "text-blue-600",   bgColor: "bg-blue-50" },
    { id: "stock-history", label: "ประวัติสินค้า",           labelEN: "Stock History",   icon: BarChart2,    color: "text-amber-600",  bgColor: "bg-amber-50" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatSns(sns: string[] | null | undefined): string {
    if (!sns || sns.length === 0) return "—"
    return sns.join(", ")
}

function todayStr() {
    return new Date().toLocaleDateString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const { lang } = useLang()
    const store = useMockStore()
    const isTH = lang === "TH"
    const { excelOk, pdfOk, error } = useNotification()

    const [activeTab, setActiveTab] = useState<ReportType>("products")
    const [selectedProductId, setSelectedProductId] = useState<string>("")
    const [exportingXlsx, setExportingXlsx] = useState(false)
    const [exportingPdf, setExportingPdf] = useState(false)

    const [loading, setLoading] = useState(isSupabaseConfigured)
    const [productsData, setProductsData] = useState<any[]>(isSupabaseConfigured ? [] : store.products)
    const [stockInData, setStockInData] = useState<any[]>(isSupabaseConfigured ? [] : store.stockIns)
    const [stockOutData, setStockOutData] = useState<any[]>(isSupabaseConfigured ? [] : store.stockOuts)
    const [movementsData, setMovementsData] = useState<any[]>(isSupabaseConfigured ? [] : store.movements)
    const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({})

    useEffect(() => {
        if (!isSupabaseConfigured) {
            setProductsData(store.products)
            setStockInData(store.stockIns)
            setStockOutData(store.stockOuts)
            setMovementsData(store.movements)
        }
    }, [store.products, store.stockIns, store.stockOuts, store.movements])

    useEffect(() => { if (isSupabaseConfigured) fetchData() }, [])

    async function fetchData() {
        setLoading(true)
        const supabase = createClient()
        try {
            const [
                { data: pData },
                { data: invData },
                { data: inData },
                { data: outData },
                { data: mData }
            ] = await Promise.all([
                supabase.from("products").select("*, categories(name)").order("name"),
                supabase.from("inventory").select("product_id, quantity"),
                supabase.from("stock_in").select("*, suppliers(name), warehouses(name), stock_in_items(quantity, products(name))").order("created_at", { ascending: false }),
                supabase.from("stock_out").select("*, warehouses(name), stock_out_items(quantity, products(name))").order("created_at", { ascending: false }),
                supabase.from("stock_movements").select("*, products(name, sku), warehouses(name)").order("created_at", { ascending: false })
            ])

            if (pData) setProductsData(pData)
            if (inData) setStockInData(inData)
            if (outData) setStockOutData(outData)
            if (mData) setMovementsData(mData)
            
            const invMap: Record<string, number> = {}
            invData?.forEach(i => { invMap[i.product_id] = (invMap[i.product_id] || 0) + i.quantity })
            setInventoryMap(invMap)
        } catch (e) { console.error(e) }
        setLoading(false)
    }

    // ── Data getters ──────────────────────────────────────────────────────────
    function getProductsData() {
        return productsData.map(p => ({
            sku: p.sku,
            name: p.name,
            category: isSupabaseConfigured ? (p.categories?.name || "—") : (store.categories.find(c => c.id === p.category_id)?.name || "—"),
            unit: p.unit || "—",
            dealer: p.dealer_price ?? 0,
            net: p.net_price ?? 0,
            retail: p.retail_price ?? 0,
            stock: isSupabaseConfigured ? (inventoryMap[p.id] || 0) : store.getInventoryQty(p.id),
            min_stock: p.minimum_stock ?? 0,
            requires_sn: p.requires_sn ? (isTH ? "ใช่" : "Yes") : (isTH ? "ไม่" : "No"),
        }))
    }

    function getStockInData() {
        return stockInData.map(r => ({
            ref: r.id.slice(0, 8).toUpperCase(),
            date: formatDate(r.date),
            supplier: r.suppliers?.name || "—",
            warehouse: r.warehouses?.name || "—",
            products: r.stock_in_items?.map((i: any) => i.products?.name || "?").join(", ") || "—",
            total_qty: r.stock_in_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0,
            notes: r.notes || "—",
        }))
    }

    function getStockOutData() {
        return stockOutData.map(r => ({
            ref: r.id.slice(0, 8).toUpperCase(),
            date: formatDate(r.date),
            warehouse: r.warehouses?.name || "—",
            products: r.stock_out_items?.map((i: any) => i.products?.name || "?").join(", ") || "—",
            total_qty: r.stock_out_items?.reduce((s: number, i: any) => s + i.quantity, 0) || 0,
            notes: r.notes || "—",
        }))
    }

    function getMovementsData() {
        return movementsData.map(m => ({
            date: formatDateTime(m.created_at),
            type: m.type.replace("_", " "),
            product: m.products?.name || "—",
            sku: m.products?.sku || "—",
            warehouse: m.warehouses?.name || "—",
            quantity: (m.type === "IN" || m.type === "TRANSFER_IN" ? "+" : "-") + m.quantity,
            serial_numbers: formatSns(m.serial_numbers),
            notes: m.notes || "—",
        }))
    }

    function getStockHistoryData() {
        const productId = selectedProductId
        if (!productId) return []
        const product = productsData.find(p => p.id === productId)
        const filtered = movementsData.filter(m =>
            m.product_id === productId || m.products?.name === product?.name
        )
        const sorted = [...filtered].reverse()
        let running = 0
        return sorted.map(m => {
            const isIn = m.type === "IN" || m.type === "TRANSFER_IN"
            running += isIn ? m.quantity : -m.quantity
            return {
                date: formatDateTime(m.created_at),
                type: m.type.replace("_", " "),
                warehouse: m.warehouses?.name || "—",
                quantity: (isIn ? "+" : "-") + m.quantity,
                balance: running,
                serial_numbers: formatSns(m.serial_numbers),
                notes: m.notes || "—",
            }
        })
    }

    // ── Excel Export ──────────────────────────────────────────────────────────
    const exportExcel = useCallback(async () => {
        setExportingXlsx(true)
        try {
            const XLSX = await import("xlsx")
            let data: any[] = []
            let sheetName = ""

            switch (activeTab) {
                case "products":
                    data = getProductsData()
                    sheetName = isTH ? "สินค้า" : "Products"
                    break
                case "stock-in":
                    data = getStockInData()
                    sheetName = isTH ? "รับสินค้า" : "Stock In"
                    break
                case "stock-out":
                    data = getStockOutData()
                    sheetName = isTH ? "จ่ายสินค้า" : "Stock Out"
                    break
                case "movements":
                    data = getMovementsData()
                    sheetName = isTH ? "ความเคลื่อนไหว" : "Movements"
                    break
                case "stock-history":
                    data = getStockHistoryData()
                    sheetName = isTH ? "ประวัติสินค้า" : "Stock History"
                    break
            }

            if (data.length === 0) {
                error(isTH ? "ไม่มีข้อมูลสำหรับ Export" : "No data to export")
                return
            }

            // Create workbook
            const ws = XLSX.utils.json_to_sheet(data)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, sheetName)

            // Auto column width
            const colWidths = Object.keys(data[0]).map(key => ({
                wch: Math.max(key.length, ...data.map(r => String(r[key] ?? "").length)) + 2
            }))
            ws["!cols"] = colWidths

            const filename = `StockFlow_${sheetName}_${todayStr()}.xlsx`
            XLSX.writeFile(wb, filename)
            excelOk(isTH ? `บันทึก ${sheetName} เรียบร้อย` : `${sheetName} exported!`)
        } finally {
            setExportingXlsx(false)
        }
    }, [activeTab, selectedProductId, store, isTH])

    // ── PDF Export ────────────────────────────────────────────────────────────
    const exportPdf = useCallback(async () => {
        setExportingPdf(true)
        try {
            const { default: jsPDF } = await import("jspdf")
            const autoTable = (await import("jspdf-autotable")).default

            let data: any[] = []
            let title = ""
            let columns: { header: string; dataKey: string }[] = []

            switch (activeTab) {
                case "products":
                    data = getProductsData()
                    title = isTH ? "รายงานสินค้า" : "Products Report"
                    columns = [
                        { header: "SKU",             dataKey: "sku" },
                        { header: isTH ? "ชื่อสินค้า" : "Name", dataKey: "name" },
                        { header: isTH ? "หมวดหมู่" : "Category", dataKey: "category" },
                        { header: isTH ? "หน่วย" : "Unit", dataKey: "unit" },
                        { header: "DEALER",          dataKey: "dealer" },
                        { header: "NET",             dataKey: "net" },
                        { header: "RETAIL",          dataKey: "retail" },
                        { header: isTH ? "คงเหลือ" : "Stock", dataKey: "stock" },
                        { header: isTH ? "สต็อกขั้นต่ำ" : "Min Stock", dataKey: "min_stock" },
                    ]
                    break
                case "stock-in":
                    data = getStockInData()
                    title = isTH ? "รายงานรับสินค้า" : "Stock In Report"
                    columns = [
                        { header: isTH ? "เลขอ้างอิง" : "Ref", dataKey: "ref" },
                        { header: isTH ? "วันที่" : "Date", dataKey: "date" },
                        { header: isTH ? "ซัพพลายเออร์" : "Supplier", dataKey: "supplier" },
                        { header: isTH ? "คลัง" : "Warehouse", dataKey: "warehouse" },
                        { header: isTH ? "สินค้า" : "Products", dataKey: "products" },
                        { header: isTH ? "จำนวนรวม" : "Total Qty", dataKey: "total_qty" },
                        { header: isTH ? "หมายเหตุ" : "Notes", dataKey: "notes" },
                    ]
                    break
                case "stock-out":
                    data = getStockOutData()
                    title = isTH ? "รายงานจ่ายสินค้า" : "Stock Out Report"
                    columns = [
                        { header: isTH ? "เลขอ้างอิง" : "Ref", dataKey: "ref" },
                        { header: isTH ? "วันที่" : "Date", dataKey: "date" },
                        { header: isTH ? "คลัง" : "Warehouse", dataKey: "warehouse" },
                        { header: isTH ? "สินค้า" : "Products", dataKey: "products" },
                        { header: isTH ? "จำนวนรวม" : "Total Qty", dataKey: "total_qty" },
                        { header: isTH ? "หมายเหตุ" : "Notes", dataKey: "notes" },
                    ]
                    break
                case "movements":
                    data = getMovementsData()
                    title = isTH ? "รายงานประวัติความเคลื่อนไหว" : "Movement Log Report"
                    columns = [
                        { header: isTH ? "วันที่" : "Date", dataKey: "date" },
                        { header: isTH ? "ประเภท" : "Type", dataKey: "type" },
                        { header: isTH ? "สินค้า" : "Product", dataKey: "product" },
                        { header: "SKU", dataKey: "sku" },
                        { header: isTH ? "คลัง" : "Warehouse", dataKey: "warehouse" },
                        { header: isTH ? "จำนวน" : "Qty", dataKey: "quantity" },
                        { header: isTH ? "หมายเหตุ" : "Notes", dataKey: "notes" },
                    ]
                    break
                case "stock-history":
                    data = getStockHistoryData()
                    title = isTH ? "รายงานประวัติสินค้า" : "Stock History Report"
                    columns = [
                        { header: isTH ? "วันที่" : "Date", dataKey: "date" },
                        { header: isTH ? "ประเภท" : "Type", dataKey: "type" },
                        { header: isTH ? "คลัง" : "Warehouse", dataKey: "warehouse" },
                        { header: isTH ? "จำนวน" : "Qty", dataKey: "quantity" },
                        { header: isTH ? "ยอดสะสม" : "Balance", dataKey: "balance" },
                        { header: isTH ? "หมายเหตุ" : "Notes", dataKey: "notes" },
                    ]
                    break
            }

            if (data.length === 0) {
                error(isTH ? "ไม่มีข้อมูลสำหรับ Export" : "No data to export")
                return
            }

            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

            // Header
            doc.setFontSize(16)
            doc.setTextColor(109, 40, 217) // violet-700
            doc.text("StockFlow", 14, 16)
            doc.setFontSize(12)
            doc.setTextColor(15, 23, 42)
            doc.text(title, 14, 24)
            doc.setFontSize(9)
            doc.setTextColor(148, 163, 184)
            doc.text(`${isTH ? "วันที่พิมพ์" : "Printed"}: ${new Date().toLocaleString("th-TH")}`, 14, 31)
            doc.text(`${isTH ? "รายการทั้งหมด" : "Total records"}: ${data.length}`, 14, 37)

            autoTable(doc, {
                startY: 42,
                columns,
                body: data,
                theme: "grid",
                headStyles: {
                    fillColor: [109, 40, 217],
                    textColor: 255,
                    fontStyle: "bold",
                    fontSize: 8,
                },
                bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: { 0: { cellWidth: "auto" } },
                margin: { left: 14, right: 14 },
            })

            const filename = `StockFlow_${title}_${todayStr()}.pdf`
            doc.save(filename)
            pdfOk(isTH ? `บันทึก PDF ${title} เรียบร้อย` : `${title} PDF exported!`)
        } finally {
            setExportingPdf(false)
        }
    }, [activeTab, selectedProductId, store, isTH])

    // ── Preview table ─────────────────────────────────────────────────────────
    const currentTab = REPORT_TABS.find(t => t.id === activeTab)!

    function renderPreview() {
        switch (activeTab) {
            case "products": {
                const data = getProductsData()
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>{isTH ? "ชื่อสินค้า" : "Name"}</TableHead>
                                <TableHead>{isTH ? "หมวดหมู่" : "Category"}</TableHead>
                                <TableHead>{isTH ? "หน่วย" : "Unit"}</TableHead>
                                <TableHead className="text-right">DEALER</TableHead>
                                <TableHead className="text-right">NET</TableHead>
                                <TableHead className="text-right">RETAIL</TableHead>
                                <TableHead className="text-right">{isTH ? "คงเหลือ" : "Stock"}</TableHead>
                                <TableHead className="text-right">{isTH ? "ขั้นต่ำ" : "Min"}</TableHead>
                                <TableHead>S/N</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((p, i) => (
                                <TableRow key={i}>
                                    <TableCell><code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{p.sku}</code></TableCell>
                                    <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                                    <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                                    <TableCell className="text-slate-500 text-sm">{p.unit}</TableCell>
                                    <TableCell className="text-right text-sm">{formatNumber(p.dealer)}</TableCell>
                                    <TableCell className="text-right text-sm">{formatNumber(p.net)}</TableCell>
                                    <TableCell className="text-right font-semibold text-emerald-600">{formatNumber(p.retail)}</TableCell>
                                    <TableCell className="text-right font-bold text-slate-700">{formatNumber(p.stock)}</TableCell>
                                    <TableCell className="text-right text-slate-400 text-sm">{p.min_stock}</TableCell>
                                    <TableCell><span className={`text-xs px-1.5 py-0.5 rounded ${p.requires_sn === "ใช่" || p.requires_sn === "Yes" ? "bg-violet-50 text-violet-600" : "bg-slate-50 text-slate-400"}`}>{p.requires_sn}</span></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )
            }

            case "stock-in": {
                const data = getStockInData()
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isTH ? "เลขอ้างอิง" : "Ref"}</TableHead>
                                <TableHead>{isTH ? "วันที่" : "Date"}</TableHead>
                                <TableHead>{isTH ? "ซัพพลายเออร์" : "Supplier"}</TableHead>
                                <TableHead>{isTH ? "คลัง" : "Warehouse"}</TableHead>
                                <TableHead>{isTH ? "สินค้า" : "Products"}</TableHead>
                                <TableHead className="text-right">{isTH ? "จำนวนรวม" : "Total Qty"}</TableHead>
                                <TableHead>{isTH ? "หมายเหตุ" : "Notes"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell><code className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono">#{r.ref}</code></TableCell>
                                    <TableCell className="text-sm text-slate-500">{r.date}</TableCell>
                                    <TableCell className="text-sm">{r.supplier}</TableCell>
                                    <TableCell><Badge variant="default">{r.warehouse}</Badge></TableCell>
                                    <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">{r.products}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600">+{formatNumber(r.total_qty)}</TableCell>
                                    <TableCell className="text-xs text-slate-400 max-w-[160px] truncate">{r.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )
            }

            case "stock-out": {
                const data = getStockOutData()
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isTH ? "เลขอ้างอิง" : "Ref"}</TableHead>
                                <TableHead>{isTH ? "วันที่" : "Date"}</TableHead>
                                <TableHead>{isTH ? "คลัง" : "Warehouse"}</TableHead>
                                <TableHead>{isTH ? "สินค้า" : "Products"}</TableHead>
                                <TableHead className="text-right">{isTH ? "จำนวนรวม" : "Total Qty"}</TableHead>
                                <TableHead>{isTH ? "หมายเหตุ" : "Notes"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell><code className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono">#{r.ref}</code></TableCell>
                                    <TableCell className="text-sm text-slate-500">{r.date}</TableCell>
                                    <TableCell><Badge variant="default">{r.warehouse}</Badge></TableCell>
                                    <TableCell className="text-sm text-slate-600 max-w-[200px] truncate">{r.products}</TableCell>
                                    <TableCell className="text-right font-bold text-red-500">-{formatNumber(r.total_qty)}</TableCell>
                                    <TableCell className="text-xs text-slate-400 max-w-[160px] truncate">{r.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )
            }

            case "movements": {
                const data = getMovementsData()
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isTH ? "วันที่" : "Date"}</TableHead>
                                <TableHead>{isTH ? "ประเภท" : "Type"}</TableHead>
                                <TableHead>{isTH ? "สินค้า" : "Product"}</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>{isTH ? "คลัง" : "Warehouse"}</TableHead>
                                <TableHead className="text-right">{isTH ? "จำนวน" : "Qty"}</TableHead>
                                <TableHead>{isTH ? "หมายเหตุ" : "Notes"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((m, i) => {
                                const isIn = m.type === "IN" || m.type === "TRANSFER IN"
                                return (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs text-slate-500">{m.date}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMovementTypeBadge(m.type.replace(" ", "_"))}`}>
                                                {m.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium text-slate-800">{m.product}</TableCell>
                                        <TableCell><code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{m.sku}</code></TableCell>
                                        <TableCell className="text-sm text-slate-600">{m.warehouse}</TableCell>
                                        <TableCell className={`text-right font-bold font-mono ${isIn ? "text-emerald-600" : "text-red-500"}`}>{m.quantity}</TableCell>
                                        <TableCell className="text-xs text-slate-400 max-w-[180px] truncate">{m.notes}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )
            }

            case "stock-history": {
                const data = getStockHistoryData()
                if (!selectedProductId) {
                    return (
                        <div className="flex flex-col items-center py-16 text-slate-400">
                            <BarChart2 className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm">{isTH ? "กรุณาเลือกสินค้าที่ต้องการดูประวัติ" : "Please select a product to view its history"}</p>
                        </div>
                    )
                }
                return (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{isTH ? "วันที่" : "Date"}</TableHead>
                                <TableHead>{isTH ? "ประเภท" : "Type"}</TableHead>
                                <TableHead>{isTH ? "คลัง" : "Warehouse"}</TableHead>
                                <TableHead className="text-right">{isTH ? "จำนวน" : "Qty"}</TableHead>
                                <TableHead className="text-right">{isTH ? "ยอดคงเหลือ" : "Balance"}</TableHead>
                                <TableHead>{isTH ? "หมายเหตุ" : "Notes"}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((m, i) => {
                                const isIn = m.quantity.startsWith("+")
                                return (
                                    <TableRow key={i}>
                                        <TableCell className="text-xs text-slate-500">{m.date}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getMovementTypeBadge(m.type.replace(" ", "_"))}`}>
                                                {m.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{m.warehouse}</TableCell>
                                        <TableCell className={`text-right font-bold font-mono ${isIn ? "text-emerald-600" : "text-red-500"}`}>{m.quantity}</TableCell>
                                        <TableCell className="text-right font-semibold text-slate-700">{formatNumber(m.balance)}</TableCell>
                                        <TableCell className="text-xs text-slate-400 max-w-[180px] truncate">{m.notes}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )
            }
        }
    }

    // ── Count helper ──────────────────────────────────────────────────────────
    function getCount() {
        switch (activeTab) {
            case "products": return productsData.length
            case "stock-in": return stockInData.length
            case "stock-out": return stockOutData.length
            case "movements": return movementsData.length
            case "stock-history": return selectedProductId ? getStockHistoryData().length : 0
        }
    }

    const needsProductSelect = activeTab === "stock-history"

    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar
                title={isTH ? "รายงาน" : "Reports"}
                description={isTH ? "ดึงข้อมูลเป็น Excel หรือ PDF" : "Export data to Excel or PDF"}
            />

            <div className="p-6 space-y-5">
                {/* ── Tab selector ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {REPORT_TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all duration-200
                                    ${isActive
                                        ? "border-violet-500 bg-white shadow-md shadow-violet-100"
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"}`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? tab.bgColor : "bg-slate-50"}`}>
                                    <Icon className={`w-5 h-5 ${isActive ? tab.color : "text-slate-400"}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold leading-tight ${isActive ? "text-slate-800" : "text-slate-600"}`}>
                                        {isTH ? tab.label : tab.labelEN}
                                    </p>
                                </div>
                                {isActive && (
                                    <CheckCircle2 className="absolute top-2.5 right-2.5 w-4 h-4 text-violet-500" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* ── Filter bar ────────────────────────────────────────────── */}
                <Card className="border-slate-200">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap items-center gap-3 justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${currentTab.bgColor}`}>
                                    <currentTab.icon className={`w-5 h-5 ${currentTab.color}`} />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">{isTH ? currentTab.label : currentTab.labelEN}</p>
                                    <p className="text-xs text-slate-400">
                                        {getCount()} {isTH ? "รายการ" : "records"}
                                        {needsProductSelect && !selectedProductId && ` — ${isTH ? "กรุณาเลือกสินค้า" : "Please select a product"}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Product selector for stock-history */}
                                {needsProductSelect && (
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-slate-400" />
                                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                            <SelectTrigger className="w-56 h-8 text-sm">
                                                <SelectValue placeholder={isTH ? "เลือกสินค้า..." : "Select product..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {productsData.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.name} <span className="text-slate-400 text-xs ml-1">({p.sku})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* Export buttons */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                                    onClick={exportExcel}
                                    disabled={exportingXlsx || exportingPdf}
                                    id="btn-export-excel"
                                >
                                    {exportingXlsx
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <FileSpreadsheet className="w-4 h-4" />
                                    }
                                    {isTH ? "Export Excel" : "Excel"}
                                    <Download className="w-3 h-3" />
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                                    onClick={exportPdf}
                                    disabled={exportingXlsx || exportingPdf}
                                    id="btn-export-pdf"
                                >
                                    {exportingPdf
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <FileText className="w-4 h-4" />
                                    }
                                    {isTH ? "Export PDF" : "PDF"}
                                    <Download className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Data preview ──────────────────────────────────────────── */}
                <Card className="border-slate-200">
                    <CardHeader className="pb-2 px-6 pt-5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {isTH ? "ตัวอย่างข้อมูล" : "Data Preview"}
                            </CardTitle>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {getCount()} {isTH ? "รายการ" : "rows"}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        {getCount() === 0 && activeTab !== "stock-history" ? (
                            <div className="flex flex-col items-center py-16 text-slate-400">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">{isTH ? "ไม่มีข้อมูล" : "No data available"}</p>
                            </div>
                        ) : (
                            renderPreview()
                        )}
                    </CardContent>
                </Card>

                {/* ── Export Tips ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-500 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-emerald-700">Excel (.xlsx)</p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                {isTH
                                    ? "เปิดด้วย Microsoft Excel, Google Sheets หรือ LibreOffice สำหรับประมวลผลต่อ"
                                    : "Open with Excel, Google Sheets, or LibreOffice for further processing"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                        <FileText className="w-8 h-8 text-red-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-red-600">PDF</p>
                            <p className="text-xs text-red-500 mt-0.5">
                                {isTH
                                    ? "เหมาะสำหรับพิมพ์และแชร์ รองรับ Landscape A4 พร้อมตารางด้านใน"
                                    : "Perfect for printing and sharing — Landscape A4 with formatted table"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
