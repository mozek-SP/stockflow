"use client"

import { useEffect, useRef, useState } from "react"
import { TopBar } from "@/components/layout/TopBar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useLang } from "@/lib/i18n"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { useMockStore } from "@/lib/mock-store"
import { formatDateTime } from "@/lib/utils"
import {
    ScanBarcode, Camera, CameraOff,
    CheckCircle2, XCircle, Keyboard, RefreshCw,
    History, ArrowRight, ArrowDownRight, ArrowUpRight
} from "lucide-react"

export default function BarcodePage() {
    const { t, lang } = useLang()
    const store = useMockStore()
    const [scanning, setScanning] = useState(false)
    const [manualMode, setManualMode] = useState(false)
    const [input, setInput] = useState("")
    const [scannedCode, setScannedCode] = useState<string | null>(null)
    const [movements, setMovements] = useState<any[]>([])
    const [notFound, setNotFound] = useState(false)
    const [loading, setLoading] = useState(false)
    const scannerRef = useRef<any>(null)
    const divId = "qr-reader"
    const supabase = createClient()

    // Cleanup scanner on unmount
    useEffect(() => () => { stopScanner() }, [])

    async function startScanner() {
        setScanning(true)
        setScannedCode(null)
        setMovements([])
        setNotFound(false)

        // Dynamically import html5-qrcode to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode")
        const html5QrCode = new Html5Qrcode(divId)
        scannerRef.current = html5QrCode

        try {
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 180 } },
                (decodedText: string) => {
                    stopScanner()
                    handleCodeFound(decodedText)
                },
                () => { }
            )
        } catch {
            setScanning(false)
            setManualMode(true)
        }
    }

    function stopScanner() {
        if (scannerRef.current) {
            try { scannerRef.current.stop() } catch { }
            scannerRef.current = null
        }
        setScanning(false)
    }

    async function handleCodeFound(code: string) {
        setScannedCode(code)
        setLoading(true)
        setMovements([])
        setNotFound(false)

        if (!isSupabaseConfigured) {
            // Search mock movements
            const foundMovements = store.movements.filter(
                (m) => m.serial_numbers && m.serial_numbers.some((sn: string) => sn.toLowerCase() === code.toLowerCase())
            ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setTimeout(() => {
                if (foundMovements.length > 0) setMovements(foundMovements)
                else setNotFound(true)
                setLoading(false)
            }, 600)
            return
        }

        const { data } = await supabase
            .from("stock_movements")
            .select("*, products(name, sku, requires_sn), warehouses(name)")
            .contains("serial_numbers", [code])
            .order("created_at", { ascending: false })

        if (data && data.length > 0) setMovements(data as any)
        else setNotFound(true)
        setLoading(false)
    }

    function reset() {
        setScannedCode(null); setMovements([]); setNotFound(false); setInput("")
    }

    function getTypeIcon(type: string) {
        switch (type) {
            case "IN": return <ArrowDownRight className="w-4 h-4 text-emerald-600" />
            case "OUT": return <ArrowUpRight className="w-4 h-4 text-red-500" />
            case "TRANSFER_IN": return <ArrowRight className="w-4 h-4 text-violet-600" />
            case "TRANSFER_OUT": return <ArrowRight className="w-4 h-4 text-slate-400" />
            default: return <RefreshCw className="w-4 h-4 text-amber-500" />
        }
    }



    return (
        <div className="flex flex-col min-h-full bg-slate-50">
            <TopBar title={t.barcodeTitle} description={t.barcodeDesc} />

            <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
                {/* Scanner / Manual toggle */}
                <div className="flex gap-3">
                    {!scanning ? (
                        <Button variant="gradient" className="gap-2 flex-1" onClick={startScanner}>
                            <Camera className="w-4 h-4" />{t.startScan}
                        </Button>
                    ) : (
                        <Button variant="outline" className="gap-2 flex-1" onClick={stopScanner}>
                            <CameraOff className="w-4 h-4" />{t.stopScan}
                        </Button>
                    )}
                    <Button
                        variant={manualMode ? "secondary" : "outline"}
                        className="gap-2"
                        onClick={() => { setManualMode(!manualMode); stopScanner(); reset() }}
                    >
                        <Keyboard className="w-4 h-4" />{t.manualEntry}
                    </Button>
                </div>

                {/* Camera viewfinder */}
                {scanning && (
                    <Card className="border-violet-200 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="relative bg-black">
                                <div id={divId} className="w-full" />
                                {/* Corner guides */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-56 h-40 border-2 border-violet-400 rounded-lg opacity-60" />
                                </div>
                            </div>
                            <div className="p-3 flex items-center gap-2 bg-violet-50">
                                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                <p className="text-xs text-violet-700 font-medium">
                                    {lang === "TH" ? "กำลังสแกน — นำบาร์โค้ดมาในกรอบ" : "Scanning — Point camera at barcode"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Manual Entry */}
                {manualMode && !scanning && (
                    <Card className="border-slate-200">
                        <CardContent className="p-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder={t.enterBarcode}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && input) handleCodeFound(input) }}
                                    autoFocus
                                    className="flex-1"
                                />
                                <Button variant="gradient" onClick={() => input && handleCodeFound(input)}>
                                    <ScanBarcode className="w-4 h-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                                {lang === "TH" ? "กด Enter หรือปุ่มสแกน" : "Press Enter or scan button"}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Result */}
                {scannedCode && (
                    <Card className="border-slate-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm text-slate-500">{t.scanResult}</CardTitle>
                                <Button size="sm" variant="ghost" onClick={reset} className="gap-1 text-xs text-slate-400">
                                    <RefreshCw className="w-3 h-3" />
                                    {lang === "TH" ? "สแกนใหม่" : "Rescan"}
                                </Button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <ScanBarcode className="w-4 h-4 text-slate-400" />
                                <code className="text-sm font-mono text-slate-700">{scannedCode}</code>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center gap-3 py-4">
                                    <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-slate-500">
                                        {lang === "TH" ? "กำลังค้นหาสินค้า..." : "Looking up product..."}
                                    </p>
                                </div>
                            ) : notFound ? (
                                <div className="flex items-center gap-3 py-4 text-red-500">
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm">{lang === "TH" ? "ไม่พบประวัติสำหรับเบอร์ S/N นี้" : "No S/N history found"}</p>
                                </div>
                            ) : movements.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs text-emerald-600 font-semibold mb-0.5">S/N Trace Active</p>
                                            <p className="font-bold text-slate-800">{movements[0].products?.name}</p>
                                            <p className="text-xs text-slate-500">{movements[0].products?.sku}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> {lang === "TH" ? "ประวัติการเคลื่อนไหว" : "Movement History"}</h4>
                                        <div className="relative border-l-2 border-slate-100 ml-3 space-y-4 py-2">
                                            {movements.map((m: any, idx: number) => (
                                                <div key={m.id || idx} className="relative pl-6">
                                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center pointer-events-none">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${m.type === "IN" || m.type === "TRANSFER_IN" ? "bg-emerald-500" : m.type === "OUT" ? "bg-red-500" : "bg-violet-500"}`} />
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm transition-colors hover:border-violet-200">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                                                {getTypeIcon(m.type)} {m.type.replace("_", " ")}
                                                            </div>
                                                            <span className="text-xs text-slate-500">{formatDateTime(m.created_at)}</span>
                                                        </div>
                                                        <p className="text-slate-600 text-xs mb-1"><span className="font-medium">{t.warehouse}:</span> {m.warehouses?.name || "—"}</p>
                                                        <p className="text-slate-500 text-xs line-clamp-2">{m.notes || m.reference_id || "—"}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                )}

                {/* Instructions (when idle) */}
                {!scanning && !scannedCode && !manualMode && (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                        <ScanBarcode className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-sm font-medium text-slate-500">
                            {lang === "TH" ? "กดปุ่มเปิดกล้องหรือพิมพ์บาร์โค้ด" : "Open camera or enter barcode manually"}
                        </p>
                        <p className="text-xs mt-1 text-slate-400">
                            {lang === "TH" ? "รองรับ QR Code, EAN-13, Code128 และอื่นๆ" : "Supports QR Code, EAN-13, Code128 & more"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
