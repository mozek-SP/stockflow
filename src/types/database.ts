export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    sku: string
                    barcode: string | null
                    name: string
                    category_id: string | null
                    unit: string
                    dealer_price: number
                    net_price: number
                    retail_price: number
                    minimum_stock: number
                    image_url: string | null
                    image_urls: string[] | null
                    requires_sn: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    sku: string
                    barcode?: string | null
                    name: string
                    category_id?: string | null
                    unit?: string
                    dealer_price?: number
                    net_price?: number
                    retail_price?: number
                    minimum_stock?: number
                    image_url?: string | null
                    image_urls?: string[] | null
                    requires_sn?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    sku?: string
                    barcode?: string | null
                    name?: string
                    category_id?: string | null
                    unit?: string
                    dealer_price?: number
                    net_price?: number
                    retail_price?: number
                    minimum_stock?: number
                    image_url?: string | null
                    image_urls?: string[] | null
                    requires_sn?: boolean | null
                    created_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    name: string
                    contact_person: string | null
                    phone: string | null
                    email: string | null
                    address: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    contact_person?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    contact_person?: string | null
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    created_at?: string
                }
            }
            warehouses: {
                Row: {
                    id: string
                    name: string
                    location: string | null
                    manager: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    location?: string | null
                    manager?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    location?: string | null
                    manager?: string | null
                    created_at?: string
                }
            }
            stock_in: {
                Row: {
                    id: string
                    supplier_id: string | null
                    warehouse_id: string
                    date: string
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    supplier_id?: string | null
                    warehouse_id: string
                    date: string
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    supplier_id?: string | null
                    warehouse_id?: string
                    date?: string
                    created_by?: string | null
                    created_at?: string
                }
            }
            stock_in_items: {
                Row: {
                    id: string
                    stock_in_id: string
                    product_id: string
                    quantity: number
                    serial_numbers: string[] | null
                }
                Insert: {
                    id?: string
                    stock_in_id: string
                    product_id: string
                    quantity: number
                    serial_numbers?: string[] | null
                }
                Update: {
                    id?: string
                    stock_in_id?: string
                    product_id?: string
                    quantity?: number
                    serial_numbers?: string[] | null
                }
            }
            stock_out: {
                Row: {
                    id: string
                    warehouse_id: string
                    issued_to: string | null
                    date: string
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    warehouse_id: string
                    issued_to?: string | null
                    date: string
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    warehouse_id?: string
                    issued_to?: string | null
                    date?: string
                    created_by?: string | null
                    created_at?: string
                }
            }
            stock_out_items: {
                Row: {
                    id: string
                    stock_out_id: string
                    product_id: string
                    quantity: number
                    serial_numbers: string[] | null
                }
                Insert: {
                    id?: string
                    stock_out_id: string
                    product_id: string
                    quantity: number
                    serial_numbers?: string[] | null
                }
                Update: {
                    id?: string
                    stock_out_id?: string
                    product_id?: string
                    quantity?: number
                    serial_numbers?: string[] | null
                }
            }
            stock_transfer: {
                Row: {
                    id: string
                    from_warehouse_id: string
                    to_warehouse_id: string
                    date: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    from_warehouse_id: string
                    to_warehouse_id: string
                    date: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    from_warehouse_id?: string
                    to_warehouse_id?: string
                    date?: string
                    status?: string
                    created_at?: string
                }
            }
            stock_transfer_items: {
                Row: {
                    id: string
                    transfer_id: string
                    product_id: string
                    quantity: number
                    serial_numbers: string[] | null
                }
                Insert: {
                    id?: string
                    transfer_id: string
                    product_id: string
                    quantity: number
                    serial_numbers?: string[] | null
                }
                Update: {
                    id?: string
                    transfer_id?: string
                    product_id?: string
                    quantity?: number
                    serial_numbers?: string[] | null
                }
            }
            stock_adjustments: {
                Row: {
                    id: string
                    product_id: string
                    warehouse_id: string
                    system_qty: number
                    actual_qty: number
                    difference: number
                    reason: string | null
                    serial_numbers: string[] | null
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    product_id: string
                    warehouse_id: string
                    system_qty: number
                    actual_qty: number
                    difference: number
                    reason?: string | null
                    serial_numbers?: string[] | null
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    product_id?: string
                    warehouse_id?: string
                    system_qty?: number
                    actual_qty?: number
                    difference?: number
                    reason?: string | null
                    serial_numbers?: string[] | null
                    created_at?: string
                    created_by?: string | null
                }
            }
            stock_movements: {
                Row: {
                    id: string
                    product_id: string
                    warehouse_id: string
                    type: string
                    quantity: number
                    reference_id: string | null
                    notes: string | null
                    serial_numbers: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    warehouse_id: string
                    type: string
                    quantity: number
                    reference_id?: string | null
                    notes?: string | null
                    serial_numbers?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    warehouse_id?: string
                    type?: string
                    quantity?: number
                    reference_id?: string | null
                    notes?: string | null
                    serial_numbers?: string[] | null
                    created_at?: string
                }
            }
            inventory: {
                Row: {
                    id: string
                    product_id: string
                    warehouse_id: string
                    quantity: number
                    updated_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    warehouse_id: string
                    quantity?: number
                    updated_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    warehouse_id?: string
                    quantity?: number
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
