"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type Lang = "EN" | "TH"

export const T = {
    EN: {
        // Sidebar / Nav
        overview: "Overview", masterData: "Master Data", movements: "Movements",
        reports: "Reports", tools: "Tools",
        dashboard: "Dashboard", products: "Products", categories: "Categories",
        suppliers: "Suppliers", warehouses: "Warehouses",
        stockIn: "Stock In", stockOut: "Stock Out", transfers: "Transfers",
        adjustments: "Adjustments", movementLog: "Movement Log",
        stockCount: "Stock Count", stockHistory: "Stock History", barcodeScan: "Barcode Scan",
        // Dashboard
        stockOverview: "Stock & inventory overview",
        totalProducts: "Total Products", totalStockQty: "Total Stock Qty",
        inventoryValue: "Inventory Value", lowStockItems: "Low Stock Items",
        stockMovements: "Stock Movements", last7Days: "Last 7 days",
        topMovingProducts: "Top Moving Products", byStockOut: "By stock out quantity",
        recentMovements: "Recent Stock Movements", viewAll: "View all →",
        noData: "No movement data yet", noMovements: "No movements recorded yet",
        // Common
        search: "Search...", filter: "Filter", addNew: "Add New",
        edit: "Edit", delete: "Delete", cancel: "Cancel", save: "Save",
        create: "Create", update: "Update", name: "Name", description: "Description",
        address: "Address", phone: "Phone", email: "Email", location: "Location",
        manager: "Manager", noFound: "No records found", actions: "Actions",
        date: "Date", reference: "Reference", warehouse: "Warehouse",
        supplier: "Supplier", product: "Product", quantity: "Quantity",
        reason: "Reason", note: "Note", totalQty: "Total Qty", type: "Type",
        saving: "Saving...", processing: "Processing...",
        demoMode: "Demo mode — connect Supabase to save data",
        confirmDelete: "This cannot be undone.",
        // Products
        addProduct: "Add Product", editProduct: "Edit Product", deleteProduct: "Delete Product",
        productName: "Product Name", sku: "SKU", barcode: "Barcode",
        category: "Category", unit: "Unit", salePrice: "Sale Price",
        minStock: "Min. Stock", imageUrl: "Image URL",
        inStock: "In Stock", noProducts: "No products found",
        addFirstProduct: "Add your first product to get started",
        productCreated: "Product created", productUpdated: "Product updated", productDeleted: "Product deleted",
        validationError: "Validation Error",
        nameSkuPriceRequired: "Name, SKU, and Sale Price are required.",
        viewSn: "View S/N", serialNumbers: "Serial Numbers", noSerialNumbers: "No Serial Numbers", sn: "S/N", snList: "S/N List",
        requiresSn: "Requires S/N",
        // Categories
        addCategory: "Add Category", editCategory: "Edit Category", deleteCategory: "Delete Category",
        noCategories: "No categories found", categoryCreated: "Category created",
        categoryUpdated: "Category updated", categoryDeleted: "Category deleted",
        nameRequired: "Name is required",
        // Suppliers
        addSupplier: "Add Supplier", editSupplier: "Edit Supplier", deleteSupplier: "Delete Supplier",
        companyName: "Company Name", contactPerson: "Contact Person",
        noSuppliers: "No suppliers found", supplierCreated: "Supplier created",
        supplierUpdated: "Supplier updated", supplierDeleted: "Supplier deleted",
        // Warehouses
        addWarehouse: "Add Warehouse", editWarehouse: "Edit Warehouse", deleteWarehouse: "Delete Warehouse",
        warehouseName: "Warehouse Name", noWarehouses: "No warehouses found",
        warehouseCreated: "Warehouse created", warehouseUpdated: "Warehouse updated", warehouseDeleted: "Warehouse deleted",
        // Stock In
        newStockIn: "New Stock In", receiveInventory: "Receive inventory into warehouse",
        noStockIn: "No stock in records yet", stockInRecorded: "Stock In recorded successfully!",
        warehouseDateRequired: "Warehouse and date are required.",
        addAtLeastOne: "Add at least one product.", confirmStockIn: "Confirm Stock In",
        addRow: "Add Row", selectProduct: "Select product", selectWarehouse: "Select warehouse",
        selectSupplier: "Select supplier",
        // Stock Out
        newStockOut: "New Stock Out", issueInventory: "Issue inventory from warehouse",
        noStockOut: "No stock out records yet", stockOutRecorded: "Stock Out recorded!",
        confirmStockOut: "Confirm Stock Out",
        // Transfers
        newTransfer: "New Transfer", transferBetween: "Transfer stock between warehouses",
        noTransfers: "No transfers yet", transferRecorded: "Transfer recorded!",
        fromWarehouse: "From Warehouse", toWarehouse: "To Warehouse",
        confirmTransfer: "Confirm Transfer",
        // Adjustments
        newAdjustment: "New Adjustment", manualCorrections: "Manual stock quantity corrections",
        noAdjustments: "No adjustments yet", adjustmentRecorded: "Adjustment recorded!",
        systemQty: "System Qty", actualQty: "Actual Qty", difference: "Difference",
        systemQuantity: "System Quantity", actualQuantity: "Actual Quantity *",
        applyAdjustment: "Apply Adjustment",
        // Movements
        allTypes: "All Types", clearFilter: "Clear filter",
        noMovementsFound: "No movements found",
        // Barcode
        barcodeTitle: "Barcode Scanner", barcodeDesc: "Scan product barcode with your camera",
        startScan: "Start Camera Scan", stopScan: "Stop Scanning", manualEntry: "Manual Entry",
        enterBarcode: "Enter barcode / SKU manually",
        scanResult: "Scan Result", productFound: "Product Found",
        noProduct: "No product found for this barcode",
        scanning: "Scanning — point camera at barcode",
        pressEnter: "Press Enter or click scan button",
        rescan: "Rescan", openCamera: "Open camera or enter barcode manually",
        supportsFormats: "Supports QR Code, EAN-13, Code128 & more",
        // Stock Count
        stockCountTitle: "Stock Count", stockCountDesc: "Monthly physical inventory count",
        startCount: "Start Count", saveCount: "Save & Apply Adjustments",
        countSaved: "Count saved and adjustments applied",
        selectWarehouseFirst: "Select a warehouse and click 'Start Count'",
        enterActualCounts: "Enter actual counts",
        items: "items", over: "over", short: "short", reset: "Reset",
        // Stock History
        historyTitle: "Stock History", historyDesc: "View movement history per product",
        selectProductFirst: "Select a product to view history",
        allMovements: "All Movements", totalIn: "Total In", totalOut: "Total Out",
        netChange: "Net Change", stockBalance: "Stock Balance Trend", runningBalance: "Running balance",
        movementHistory: "Movement History", noHistoryYet: "No movement history yet",
    },
    TH: {
        // Sidebar / Nav
        overview: "ภาพรวม", masterData: "ข้อมูลหลัก", movements: "การเคลื่อนไหว",
        reports: "รายงาน", tools: "เครื่องมือ",
        dashboard: "แดชบอร์ด", products: "สินค้า", categories: "หมวดหมู่",
        suppliers: "ซัพพลายเออร์", warehouses: "คลังสินค้า",
        stockIn: "รับสินค้า", stockOut: "จ่ายสินค้า", transfers: "โอนย้าย",
        adjustments: "ปรับยอด", movementLog: "ประวัติความเคลื่อนไหว",
        stockCount: "นับสต๊อก", stockHistory: "ประวัติสินค้า", barcodeScan: "สแกนบาร์โค้ด",
        // Dashboard
        stockOverview: "ภาพรวมสต๊อกและสินค้าคงคลัง",
        totalProducts: "สินค้าทั้งหมด", totalStockQty: "จำนวนสต๊อกรวม",
        inventoryValue: "มูลค่าสินค้าคงคลัง", lowStockItems: "สินค้าใกล้หมด",
        stockMovements: "การรับ-จ่ายสต๊อก", last7Days: "7 วันที่ผ่านมา",
        topMovingProducts: "สินค้าเคลื่อนไหวสูง", byStockOut: "ตามจำนวนที่จ่ายออก",
        recentMovements: "การเคลื่อนไหวล่าสุด", viewAll: "ดูทั้งหมด →",
        noData: "ยังไม่มีข้อมูลการเคลื่อนไหว", noMovements: "ยังไม่มีรายการสต๊อก",
        // Common
        search: "ค้นหา...", filter: "กรอง", addNew: "เพิ่มใหม่",
        edit: "แก้ไข", delete: "ลบ", cancel: "ยกเลิก", save: "บันทึก",
        create: "สร้าง", update: "อัปเดต", name: "ชื่อ", description: "คำอธิบาย",
        address: "ที่อยู่", phone: "โทรศัพท์", email: "อีเมล", location: "สถานที่",
        manager: "ผู้จัดการ", noFound: "ไม่พบข้อมูล", actions: "จัดการ",
        date: "วันที่", reference: "อ้างอิง", warehouse: "คลังสินค้า",
        supplier: "ซัพพลายเออร์", product: "สินค้า", quantity: "จำนวน",
        reason: "เหตุผล", note: "หมายเหตุ", totalQty: "รวม", type: "ประเภท",
        saving: "กำลังบันทึก...", processing: "กำลังดำเนินการ...",
        demoMode: "โหมดเดโม — เชื่อม Supabase เพื่อบันทึกข้อมูล",
        confirmDelete: "ไม่สามารถยกเลิกได้หลังจากลบ",
        // Products
        addProduct: "เพิ่มสินค้า", editProduct: "แก้ไขสินค้า", deleteProduct: "ลบสินค้า",
        productName: "ชื่อสินค้า", sku: "รหัส SKU", barcode: "บาร์โค้ด",
        category: "หมวดหมู่", unit: "หน่วย", salePrice: "ราคาขาย",
        minStock: "สต๊อกขั้นต่ำ", imageUrl: "URL รูปภาพ",
        inStock: "คงเหลือ", noProducts: "ไม่พบสินค้า",
        addFirstProduct: "เพิ่มสินค้าแรกของคุณเลย",
        productCreated: "เพิ่มสินค้าแล้ว", productUpdated: "อัปเดตสินค้าแล้ว", productDeleted: "ลบสินค้าแล้ว",
        validationError: "ข้อมูลไม่ครบ",
        nameSkuPriceRequired: "กรุณากรอกชื่อ, SKU และราคาขาย",
        viewSn: "ดู S/N", serialNumbers: "ซีเรียลนัมเบอร์ (S/N)", noSerialNumbers: "ไม่มี S/N", sn: "S/N", snList: "รายการ S/N",
        requiresSn: "ควบคุม S/N",
        // Categories
        addCategory: "เพิ่มหมวดหมู่", editCategory: "แก้ไขหมวดหมู่", deleteCategory: "ลบหมวดหมู่",
        noCategories: "ไม่พบหมวดหมู่", categoryCreated: "เพิ่มหมวดหมู่แล้ว",
        categoryUpdated: "อัปเดตหมวดหมู่แล้ว", categoryDeleted: "ลบหมวดหมู่แล้ว",
        nameRequired: "กรุณากรอกชื่อ",
        // Suppliers
        addSupplier: "เพิ่มซัพพลายเออร์", editSupplier: "แก้ไขซัพพลายเออร์", deleteSupplier: "ลบซัพพลายเออร์",
        companyName: "ชื่อบริษัท", contactPerson: "ผู้ติดต่อ",
        noSuppliers: "ไม่พบซัพพลายเออร์", supplierCreated: "เพิ่มซัพพลายเออร์แล้ว",
        supplierUpdated: "อัปเดตซัพพลายเออร์แล้ว", supplierDeleted: "ลบซัพพลายเออร์แล้ว",
        // Warehouses
        addWarehouse: "เพิ่มคลังสินค้า", editWarehouse: "แก้ไขคลังสินค้า", deleteWarehouse: "ลบคลังสินค้า",
        warehouseName: "ชื่อคลังสินค้า", noWarehouses: "ไม่พบคลังสินค้า",
        warehouseCreated: "เพิ่มคลังสินค้าแล้ว", warehouseUpdated: "อัปเดตคลังสินค้าแล้ว", warehouseDeleted: "ลบคลังสินค้าแล้ว",
        // Stock In
        newStockIn: "รับสินค้าใหม่", receiveInventory: "บันทึกการรับสินค้าเข้าคลัง",
        noStockIn: "ยังไม่มีรายการรับสินค้า", stockInRecorded: "บันทึกรับสินค้าสำเร็จ!",
        warehouseDateRequired: "กรุณาเลือกคลังสินค้าและวันที่",
        addAtLeastOne: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ", confirmStockIn: "ยืนยันรับสินค้า",
        addRow: "เพิ่มแถว", selectProduct: "เลือกสินค้า", selectWarehouse: "เลือกคลังสินค้า",
        selectSupplier: "เลือกซัพพลายเออร์",
        // Stock Out
        newStockOut: "จ่ายสินค้าใหม่", issueInventory: "บันทึกการจ่ายสินค้าออกจากคลัง",
        noStockOut: "ยังไม่มีรายการจ่ายสินค้า", stockOutRecorded: "บันทึกจ่ายสินค้าสำเร็จ!",
        confirmStockOut: "ยืนยันจ่ายสินค้า",
        // Transfers
        newTransfer: "โอนย้ายสินค้า", transferBetween: "โอนย้ายสต๊อกระหว่างคลัง",
        noTransfers: "ยังไม่มีการโอนย้าย", transferRecorded: "บันทึกการโอนย้ายสำเร็จ!",
        fromWarehouse: "จากคลัง", toWarehouse: "ไปคลัง",
        confirmTransfer: "ยืนยันโอนย้าย",
        // Adjustments
        newAdjustment: "ปรับยอดสต๊อก", manualCorrections: "แก้ไขจำนวนสต๊อกด้วยตนเอง",
        noAdjustments: "ยังไม่มีการปรับยอด", adjustmentRecorded: "บันทึกการปรับยอดแล้ว!",
        systemQty: "ยอดในระบบ", actualQty: "ยอดที่นับจริง", difference: "ผลต่าง",
        systemQuantity: "ยอดในระบบ", actualQuantity: "ยอดที่นับจริง *",
        applyAdjustment: "ยืนยันปรับยอด",
        // Movements
        allTypes: "ทุกประเภท", clearFilter: "ล้างตัวกรอง",
        noMovementsFound: "ไม่พบรายการ",
        // Barcode
        barcodeTitle: "สแกนบาร์โค้ด", barcodeDesc: "สแกนบาร์โค้ดสินค้าด้วยกล้อง",
        startScan: "เปิดกล้องสแกน", stopScan: "หยุดสแกน", manualEntry: "พิมพ์เอง",
        enterBarcode: "พิมพ์บาร์โค้ด / รหัส SKU",
        scanResult: "ผลการสแกน", productFound: "พบสินค้า",
        noProduct: "ไม่พบสินค้าสำหรับบาร์โค้ดนี้",
        scanning: "กำลังสแกน — นำบาร์โค้ดมาในกรอบ",
        pressEnter: "กด Enter หรือปุ่มสแกน",
        rescan: "สแกนใหม่", openCamera: "กดเปิดกล้องหรือพิมพ์บาร์โค้ดด้วยตนเอง",
        supportsFormats: "รองรับ QR Code, EAN-13, Code128 และอื่นๆ",
        // Stock Count
        stockCountTitle: "นับสต๊อก", stockCountDesc: "นับสต๊อกสินค้าประจำเดือน",
        startCount: "เริ่มนับ", saveCount: "บันทึกและปรับยอดสต๊อก",
        countSaved: "บันทึกการนับและปรับยอดสต๊อกแล้ว",
        selectWarehouseFirst: "เลือกคลังสินค้าและกด 'เริ่มนับ'",
        enterActualCounts: "กรอกยอดที่นับจริง",
        items: "รายการ", over: "เกิน", short: "ขาด", reset: "เริ่มใหม่",
        // Stock History
        historyTitle: "ประวัติสินค้า", historyDesc: "ดูประวัติการเคลื่อนไหวรายสินค้า",
        selectProductFirst: "เลือกสินค้าเพื่อดูประวัติ",
        allMovements: "การเคลื่อนไหวทั้งหมด", totalIn: "รับรวม", totalOut: "จ่ายรวม",
        netChange: "ยอดสุทธิ", stockBalance: "กราฟยอดสต๊อก", runningBalance: "ยอดสะสม",
        movementHistory: "รายการการเคลื่อนไหว", noHistoryYet: "ยังไม่มีประวัติการเคลื่อนไหว",
    },
}

type Translations = Record<keyof typeof T["EN"], string>

interface LanguageContextType {
    lang: Lang
    setLang: (l: Lang) => void
    t: Translations
}

const LanguageContext = createContext<LanguageContextType>({
    lang: "TH", setLang: () => { }, t: T["TH"] as Translations,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>("TH")
    return (
        <LanguageContext.Provider value={{ lang, setLang, t: T[lang] }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLang() { return useContext(LanguageContext) }
