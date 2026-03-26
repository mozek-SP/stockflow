import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value)
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value)
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date))
}

export function generateSKU(prefix: string = 'PRD'): string {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
}

export function getMovementTypeColor(type: string): string {
    switch (type) {
        case 'IN': return 'text-emerald-400'
        case 'OUT': return 'text-red-400'
        case 'TRANSFER_IN': return 'text-blue-400'
        case 'TRANSFER_OUT': return 'text-orange-400'
        case 'ADJUSTMENT': return 'text-purple-400'
        default: return 'text-gray-400'
    }
}

export function getMovementTypeBadge(type: string): string {
    switch (type) {
        case "IN": return "bg-emerald-50 text-emerald-700 border-emerald-200"
        case "OUT": return "bg-red-50 text-red-700 border-red-200"
        case "TRANSFER_IN": return "bg-blue-50 text-blue-700 border-blue-200"
        case "TRANSFER_OUT": return "bg-orange-50 text-orange-700 border-orange-200"
        case "ADJUSTMENT": return "bg-purple-50 text-purple-700 border-purple-200"
        default: return "bg-slate-100 text-slate-700 border-slate-200"
    }
}
