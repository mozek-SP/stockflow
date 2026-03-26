import { create } from "zustand"
import {
    mockProducts, mockCategories, mockSuppliers, mockWarehouses,
    mockMovements, mockStockIn, mockStockOut, mockTransfers, mockAdjustments,
} from "@/lib/mock-data"

function clone<T>(data: T): T {
    return JSON.parse(JSON.stringify(data))
}

function buildInventoryMap() {
    const map: Record<string, Record<string, number>> = {}
    for (const p of mockProducts as any[]) {
        map[p.id] = {}
        if (p.inventory) {
            p.inventory.forEach((inv: any, idx: number) => {
                const wid = inv.warehouse_id ?? (["wh-1", "wh-2", "wh-3"][idx] || "wh-1")
                map[p.id][wid] = inv.quantity
            })
        }
    }
    return map
}

interface MockStore {
    products: any[]
    categories: any[]
    suppliers: any[]
    warehouses: any[]
    movements: any[]
    stockIns: any[]
    stockOuts: any[]
    transfers: any[]
    adjustments: any[]
    inventoryMap: Record<string, Record<string, number>>

    setProducts: (v: any[]) => void
    setCategories: (v: any[]) => void
    setSuppliers: (v: any[]) => void
    setWarehouses: (v: any[]) => void
    setMovements: (v: any[]) => void
    setStockIns: (v: any[]) => void
    setStockOuts: (v: any[]) => void
    setTransfers: (v: any[]) => void
    setAdjustments: (v: any[]) => void

    getInventoryQty: (productId: string, warehouseId?: string) => number
    addMovement: (m: any) => void
    updateInventory: (productId: string, warehouseId: string, delta: number) => void
}

export const useMockStore = create<MockStore>((set, get) => ({
    products: clone(mockProducts),
    categories: clone(mockCategories),
    suppliers: clone(mockSuppliers),
    warehouses: clone(mockWarehouses),
    movements: clone(mockMovements),
    stockIns: clone(mockStockIn),
    stockOuts: clone(mockStockOut),
    transfers: clone(mockTransfers),
    adjustments: clone(mockAdjustments),
    inventoryMap: buildInventoryMap(),

    setProducts: (v) => set({ products: v }),
    setCategories: (v) => set({ categories: v }),
    setSuppliers: (v) => set({ suppliers: v }),
    setWarehouses: (v) => set({ warehouses: v }),
    setMovements: (v) => set({ movements: v }),
    setStockIns: (v) => set({ stockIns: v }),
    setStockOuts: (v) => set({ stockOuts: v }),
    setTransfers: (v) => set({ transfers: v }),
    setAdjustments: (v) => set({ adjustments: v }),

    getInventoryQty: (productId, warehouseId) => {
        const map = get().inventoryMap[productId] || {}
        if (warehouseId) return map[warehouseId] || 0
        return Object.values(map).reduce((s, q) => s + q, 0)
    },

    updateInventory: (productId, warehouseId, delta) => {
        set((state) => {
            const inv = JSON.parse(JSON.stringify(state.inventoryMap))
            if (!inv[productId]) inv[productId] = {}
            inv[productId][warehouseId] = Math.max(0, (inv[productId][warehouseId] || 0) + delta)
            return { inventoryMap: inv }
        })
    },

    addMovement: (m) => {
        const newM = {
            id: `m-${Date.now()}`,
            type: "IN",
            quantity: 0,
            reference_id: null,
            notes: null,
            created_at: new Date().toISOString(),
            products: null,
            warehouses: null,
            ...m,
        }
        set((state) => ({ movements: [newM, ...state.movements] }))
        // Update inventory
        const pid = newM.product_id
        const wid = newM.warehouse_id
        if (pid && wid) {
            const isIn = newM.type === "IN" || newM.type === "TRANSFER_IN"
            get().updateInventory(pid, wid, isIn ? newM.quantity : -newM.quantity)
        }
    },
}))
