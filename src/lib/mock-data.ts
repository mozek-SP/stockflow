// ─── Mock Data ── used when Supabase is not configured ───────────────────────

export const mockCategories = [
    { id: "cat-1", name: "Electronics", description: "Electronic devices and components", created_at: "2024-01-10T08:00:00Z" },
    { id: "cat-2", name: "Machinery", description: "Industrial machinery and equipment", created_at: "2024-01-10T08:00:00Z" },
    { id: "cat-3", name: "Parts", description: "Spare parts and components", created_at: "2024-01-11T08:00:00Z" },
    { id: "cat-4", name: "Supplies", description: "Office and general supplies", created_at: "2024-01-12T08:00:00Z" },
    { id: "cat-5", name: "Accessories", description: "Product accessories", created_at: "2024-01-13T08:00:00Z" },
]

export const mockSuppliers = [
    { id: "sup-1", name: "TechParts Co., Ltd.", contact_person: "Somchai Jaidee", phone: "02-123-4567", email: "sales@techparts.co.th", address: "123 Sukhumvit Rd, Bangkok 10110", created_at: "2024-01-15T08:00:00Z" },
    { id: "sup-2", name: "Global Supply Chain", contact_person: "David Lee", phone: "02-987-6543", email: "d.lee@globalsupply.com", address: "456 Silom Rd, Bangkok 10500", created_at: "2024-01-16T08:00:00Z" },
    { id: "sup-3", name: "Northern Parts Ltd.", contact_person: "Malee Srisuk", phone: "053-111-2222", email: "info@northernparts.th", address: "789 Nimman Rd, Chiang Mai 50200", created_at: "2024-01-17T08:00:00Z" },
    { id: "sup-4", name: "Pro Equipment Corp.", contact_person: "James Wilson", phone: "02-555-7890", email: "j.wilson@proequip.com", address: "321 Ratchada Rd, Bangkok 10400", created_at: "2024-01-18T08:00:00Z" },
]

export const mockWarehouses = [
    { id: "wh-1", name: "Main Warehouse", location: "Bangkok, Thailand", manager: "Wanchai Promma", created_at: "2024-01-05T08:00:00Z" },
    { id: "wh-2", name: "North Branch", location: "Chiang Mai, Thailand", manager: "Pornpan Saelim", created_at: "2024-01-05T08:00:00Z" },
    { id: "wh-3", name: "South Branch", location: "Phuket, Thailand", manager: "Krit Tanaka", created_at: "2024-01-06T08:00:00Z" },
]

export const mockProducts = [
    { id: "prod-1", sku: "ELEC-001", name: "Intel Core i7 Processor", category_id: "cat-1", categories: { name: "Electronics" }, unit: "pcs", dealer_price: 7500, net_price: 10000, retail_price: 12500, minimum_stock: 5, requires_sn: true, inventory: [{ quantity: 42 }], created_at: "2024-02-01T08:00:00Z", image_urls: [] },
    { id: "prod-2", sku: "ELEC-002", name: "Samsung 32GB RAM DDR5", category_id: "cat-1", categories: { name: "Electronics" }, unit: "pcs", dealer_price: 2880, net_price: 3840, retail_price: 4800, minimum_stock: 10, requires_sn: true, inventory: [{ quantity: 3 }], created_at: "2024-02-02T08:00:00Z", image_urls: [] },
    { id: "prod-3", sku: "MACH-001", name: "Industrial Air Compressor 50L", category_id: "cat-2", categories: { name: "Machinery" }, unit: "unit", dealer_price: 16800, net_price: 22400, retail_price: 28000, minimum_stock: 2, requires_sn: true, inventory: [{ quantity: 7 }], created_at: "2024-02-03T08:00:00Z", image_urls: [] },
    { id: "prod-4", sku: "PART-001", name: "Hydraulic Pump Seal Kit", category_id: "cat-3", categories: { name: "Parts" }, unit: "set", dealer_price: 510, net_price: 680, retail_price: 850, minimum_stock: 20, requires_sn: false, inventory: [{ quantity: 18 }], created_at: "2024-02-04T08:00:00Z", image_urls: [] },
    { id: "prod-5", sku: "PART-002", name: "Bearing Assembly 6205-2RS", category_id: "cat-3", categories: { name: "Parts" }, unit: "pcs", dealer_price: 192, net_price: 256, retail_price: 320, minimum_stock: 50, requires_sn: false, inventory: [{ quantity: 134 }], created_at: "2024-02-05T08:00:00Z", image_urls: [] },
    { id: "prod-6", sku: "SUPP-001", name: "Industrial Lubricant 5L", category_id: "cat-4", categories: { name: "Supplies" }, unit: "can", dealer_price: 390, net_price: 520, retail_price: 650, minimum_stock: 30, requires_sn: false, inventory: [{ quantity: 28 }], created_at: "2024-02-06T08:00:00Z", image_urls: [] },
    { id: "prod-7", sku: "ELEC-003", name: "Siemens PLC S7-1200", category_id: "cat-1", categories: { name: "Electronics" }, unit: "pcs", dealer_price: 27000, net_price: 36000, retail_price: 45000, minimum_stock: 3, requires_sn: true, inventory: [{ quantity: 9 }], created_at: "2024-02-07T08:00:00Z", image_urls: [] },
    { id: "prod-8", sku: "ACC-001", name: "Safety Helmet (Red)", category_id: "cat-5", categories: { name: "Accessories" }, unit: "pcs", dealer_price: 168, net_price: 224, retail_price: 280, minimum_stock: 40, requires_sn: false, inventory: [{ quantity: 2 }], created_at: "2024-02-08T08:00:00Z", image_urls: [] },
    { id: "prod-9", sku: "MACH-002", name: "Electric Forklift 1.5T", category_id: "cat-2", categories: { name: "Machinery" }, unit: "unit", dealer_price: 210000, net_price: 280000, retail_price: 350000, minimum_stock: 1, requires_sn: true, inventory: [{ quantity: 3 }], created_at: "2024-02-09T08:00:00Z", image_urls: [] },
    { id: "prod-10", sku: "PART-003", name: "V-Belt A42 (Set of 5)", category_id: "cat-3", categories: { name: "Parts" }, unit: "set", dealer_price: 252, net_price: 336, retail_price: 420, minimum_stock: 25, requires_sn: false, inventory: [{ quantity: 67 }], created_at: "2024-02-10T08:00:00Z", image_urls: [] },
]

export const mockMovements = [
    { id: "mv-1", product_id: "prod-1", warehouse_id: "wh-1", type: "IN", quantity: 5, reference_id: "si-1", notes: "Stock In #SI-000001", created_at: "2026-03-12T09:00:00Z", products: { name: "Intel Core i7 Processor", sku: "ELEC-001", requires_sn: true }, warehouses: { name: "Main Warehouse" }, serial_numbers: ["INTEL-001", "INTEL-002", "INTEL-003", "INTEL-004", "INTEL-005"] },
    { id: "mv-2", product_id: "prod-1", warehouse_id: "wh-1", type: "OUT", quantity: 2, reference_id: "so-1", notes: null, created_at: "2026-03-12T09:30:00Z", products: { name: "Intel Core i7 Processor", sku: "ELEC-001", requires_sn: true }, warehouses: { name: "Main Warehouse" }, serial_numbers: ["INTEL-001", "INTEL-002"] },
    { id: "mv-3", product_id: "prod-8", warehouse_id: "wh-1", type: "TRANSFER_OUT", quantity: 20, reference_id: "tr-1", notes: null, created_at: "2026-03-11T14:00:00Z", products: { name: "Safety Helmet (Red)", sku: "ACC-001", requires_sn: false }, warehouses: { name: "Main Warehouse" } },
    { id: "mv-4", product_id: "prod-8", warehouse_id: "wh-2", type: "TRANSFER_IN", quantity: 20, reference_id: "tr-1", notes: null, created_at: "2026-03-11T14:01:00Z", products: { name: "Safety Helmet (Red)", sku: "ACC-001", requires_sn: false }, warehouses: { name: "North Branch" } },
    { id: "mv-5", product_id: "prod-10", warehouse_id: "wh-1", type: "IN", quantity: 100, reference_id: "si-2", notes: "Stock In #SI-000002", created_at: "2026-03-11T10:00:00Z", products: { name: "V-Belt A42 (Set of 5)", sku: "PART-003", requires_sn: false }, warehouses: { name: "Main Warehouse" } },
    { id: "mv-6", product_id: "prod-6", warehouse_id: "wh-1", type: "OUT", quantity: 15, reference_id: "so-2", notes: null, created_at: "2026-03-11T11:00:00Z", products: { name: "Industrial Lubricant 5L", sku: "SUPP-001", requires_sn: false }, warehouses: { name: "Main Warehouse" } },
    { id: "mv-7", product_id: "prod-4", warehouse_id: "wh-1", type: "ADJUSTMENT", quantity: 5, reference_id: null, notes: "Adjustment: -5. Reason: Damaged goods", created_at: "2026-03-10T15:00:00Z", products: { name: "Hydraulic Pump Seal Kit", sku: "PART-001", requires_sn: false }, warehouses: { name: "Main Warehouse" } },
    { id: "mv-8", product_id: "prod-7", warehouse_id: "wh-1", type: "IN", quantity: 3, reference_id: "si-3", notes: "Stock In #SI-000003", created_at: "2026-03-10T09:00:00Z", products: { name: "Siemens PLC S7-1200", sku: "ELEC-003", requires_sn: true }, warehouses: { name: "Main Warehouse" }, serial_numbers: ["PLC-S7-001", "PLC-S7-002", "PLC-S7-003"] },
    { id: "mv-9", product_id: "prod-5", warehouse_id: "wh-3", type: "OUT", quantity: 25, reference_id: "so-3", notes: null, created_at: "2026-03-09T13:00:00Z", products: { name: "Bearing Assembly 6205-2RS", sku: "PART-002", requires_sn: false }, warehouses: { name: "South Branch" } },
    { id: "mv-10", product_id: "prod-2", warehouse_id: "wh-1", type: "IN", quantity: 10, reference_id: "si-4", notes: "Stock In #SI-000004", created_at: "2026-03-08T08:00:00Z", products: { name: "Samsung 32GB RAM DDR5", sku: "ELEC-002", requires_sn: true }, warehouses: { name: "Main Warehouse" }, serial_numbers: ["RAM32-001", "RAM32-002", "RAM32-003", "RAM32-004", "RAM32-005", "RAM32-006", "RAM32-007", "RAM32-008", "RAM32-009", "RAM32-010"] },
    { id: "mv-11", product_id: "prod-9", warehouse_id: "wh-1", type: "OUT", quantity: 1, reference_id: "so-4", notes: null, created_at: "2026-03-07T10:00:00Z", products: { name: "Electric Forklift 1.5T", sku: "MACH-002", requires_sn: true }, warehouses: { name: "Main Warehouse" }, serial_numbers: ["FL-15T-001"] },
    { id: "mv-12", product_id: "prod-10", warehouse_id: "wh-2", type: "IN", quantity: 60, reference_id: "si-5", notes: "Stock In #SI-000005", created_at: "2026-03-06T08:00:00Z", products: { name: "V-Belt A42 (Set of 5)", sku: "PART-003", requires_sn: false }, warehouses: { name: "North Branch" } },
]

export const mockStockIn = [
    {
        id: "si-1",
        date: "2026-03-12",
        created_at: "2026-03-12T09:00:00Z",
        supplier_id: "sup-1",
        warehouse_id: "wh-1",
        suppliers: { name: "TechParts Co., Ltd." },
        warehouses: { name: "Main Warehouse" },
        stock_in_items: [
            { quantity: 5, serial_numbers: ["INTEL-001", "INTEL-002", "INTEL-003", "INTEL-004", "INTEL-005"], products: { name: "Intel Core i7 Processor", sku: "ELEC-001", requires_sn: true } },
        ],
    },
    {
        id: "si-2",
        date: "2026-03-11",
        created_at: "2026-03-11T10:00:00Z",
        supplier_id: "sup-3",
        warehouse_id: "wh-1",
        suppliers: { name: "Northern Parts Ltd." },
        warehouses: { name: "Main Warehouse" },
        stock_in_items: [
            { quantity: 100, products: { name: "V-Belt A42 (Set of 5)", sku: "PART-003", requires_sn: false } },
        ],
    },
    {
        id: "si-3",
        date: "2026-03-10",
        created_at: "2026-03-10T09:00:00Z",
        supplier_id: "sup-2",
        warehouse_id: "wh-1",
        suppliers: { name: "Global Supply Chain" },
        warehouses: { name: "Main Warehouse" },
        stock_in_items: [
            { quantity: 3, serial_numbers: ["PLC-S7-001", "PLC-S7-002", "PLC-S7-003"], products: { name: "Siemens PLC S7-1200", sku: "ELEC-007", requires_sn: true } },
        ],
    },
    {
        id: "si-4",
        date: "2026-03-08",
        created_at: "2026-03-08T08:00:00Z",
        supplier_id: "sup-1",
        warehouse_id: "wh-1",
        suppliers: { name: "TechParts Co., Ltd." },
        warehouses: { name: "Main Warehouse" },
        stock_in_items: [
            { quantity: 10, serial_numbers: ["RAM32-001", "RAM32-002", "RAM32-003", "RAM32-004", "RAM32-005", "RAM32-006", "RAM32-007", "RAM32-008", "RAM32-009", "RAM32-010"], products: { name: "Samsung 32GB RAM DDR5", sku: "ELEC-002", requires_sn: true } },
        ],
    },
    {
        id: "si-5",
        date: "2026-03-06",
        created_at: "2026-03-06T08:00:00Z",
        supplier_id: "sup-3",
        warehouse_id: "wh-2",
        suppliers: { name: "Northern Parts Ltd." },
        warehouses: { name: "North Branch" },
        stock_in_items: [
            { quantity: 60, products: { name: "V-Belt A42 (Set of 5)", sku: "PART-003", requires_sn: false } },
        ],
    },
]

export const mockStockOut = [
    {
        id: "so-1",
        date: "2026-03-12",
        created_at: "2026-03-12T09:30:00Z",
        warehouse_id: "wh-1",
        issued_to: "Production Dept.",
        warehouses: { name: "Main Warehouse" },
        stock_out_items: [
            { quantity: 2, serial_numbers: ["INTEL-001", "INTEL-002"], products: { name: "Intel Core i7 Processor", sku: "ELEC-001", requires_sn: true } },
        ],
    },
    {
        id: "so-2",
        date: "2026-03-11",
        created_at: "2026-03-11T11:00:00Z",
        warehouse_id: "wh-1",
        issued_to: "Maintenance Team",
        warehouses: { name: "Main Warehouse" },
        stock_out_items: [
            { quantity: 15, products: { name: "Industrial Lubricant 5L", sku: "SUPP-001", requires_sn: false } },
        ],
    },
    {
        id: "so-3",
        date: "2026-03-09",
        created_at: "2026-03-09T13:00:00Z",
        warehouse_id: "wh-3",
        issued_to: "Engineering Dept.",
        warehouses: { name: "South Branch" },
        stock_out_items: [
            { quantity: 25, products: { name: "Bearing Assembly 6205-2RS", sku: "PART-002", requires_sn: false } },
        ],
    },
    {
        id: "so-4",
        date: "2026-03-07",
        created_at: "2026-03-07T10:00:00Z",
        warehouse_id: "wh-1",
        issued_to: "Logistics Dept.",
        warehouses: { name: "Main Warehouse" },
        stock_out_items: [
            { quantity: 1, serial_numbers: ["FL-15T-001"], products: { name: "Electric Forklift 1.5T", sku: "MACH-002", requires_sn: true } },
        ],
    },
]

export const mockTransfers = [
    {
        id: "tr-1",
        date: "2026-03-11",
        status: "completed",
        created_at: "2026-03-11T14:00:00Z",
        from_warehouse_id: "wh-1",
        to_warehouse_id: "wh-2",
        from_warehouse: { name: "Main Warehouse" },
        to_warehouse: { name: "North Branch" },
        stock_transfer_items: [
            { quantity: 20, products: { name: "Safety Helmet (Red)", sku: "ACC-001", requires_sn: false } },
        ],
    },
    {
        id: "tr-2",
        date: "2026-03-05",
        status: "completed",
        created_at: "2026-03-05T10:00:00Z",
        from_warehouse_id: "wh-2",
        to_warehouse_id: "wh-3",
        from_warehouse: { name: "North Branch" },
        to_warehouse: { name: "South Branch" },
        stock_transfer_items: [
            { quantity: 30, products: { name: "V-Belt A42 (Set of 5)", sku: "PART-003", requires_sn: false } },
        ],
    },
]

export const mockAdjustments = [
    {
        id: "adj-1",
        product_id: "prod-4",
        warehouse_id: "wh-1",
        system_qty: 23,
        actual_qty: 18,
        difference: -5,
        reason: "Damaged during storage",
        created_at: "2026-03-10T15:00:00Z",
        products: { name: "Hydraulic Pump Seal Kit" },
        warehouses: { name: "Main Warehouse" },
    },
    {
        id: "adj-2",
        product_id: "prod-6",
        warehouse_id: "wh-1",
        system_qty: 25,
        actual_qty: 28,
        difference: 3,
        reason: "Recount after physical audit",
        created_at: "2026-03-08T11:00:00Z",
        products: { name: "Industrial Lubricant 5L" },
        warehouses: { name: "Main Warehouse" },
    },
    {
        id: "adj-3",
        product_id: "prod-1",
        warehouse_id: "wh-1",
        system_qty: 42,
        actual_qty: 40,
        difference: -2,
        reason: "Lost during audit",
        created_at: "2026-03-07T10:00:00Z",
        serial_numbers: ["INTEL-041", "INTEL-042"],
        products: { name: "Intel Core i7 Processor", sku: "ELEC-001", requires_sn: true },
        warehouses: { name: "Main Warehouse" },
    },
]

// ─── Dashboard Aggregates ─────────────────────────────────────────────────────

export const mockDashboardStats = {
    totalProducts: 10,
    totalStockQty: 313,
    inventoryValue: 3_284_600,
    lowStockCount: 4, // prod-2 (3), prod-4 (18), prod-6 (28), prod-8 (2)
}

export const mockChartData = [
    { date: "Fri, Mar 6", IN: 60, OUT: 0 },
    { date: "Sat, Mar 7", IN: 0, OUT: 2 },
    { date: "Sun, Mar 8", IN: 10, OUT: 0 },
    { date: "Mon, Mar 9", IN: 0, OUT: 25 },
    { date: "Tue, Mar 10", IN: 3, OUT: 0 },
    { date: "Wed, Mar 11", IN: 100, OUT: 15 },
    { date: "Thu, Mar 12", IN: 50, OUT: 8 },
]

export const mockTopProducts = [
    { name: "Bearing Assembly", total_qty: 33 },
    { name: "V-Belt A42", total_qty: 25 },
    { name: "Lubricant 5L", total_qty: 15 },
    { name: "Electric Forklift", total_qty: 2 },
    { name: "Samsung 32GB RAM", total_qty: 0 },
]
