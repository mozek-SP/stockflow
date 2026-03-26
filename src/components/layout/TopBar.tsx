import type { ReactNode } from "react"
import { Bell } from "lucide-react"

interface TopBarProps {
    title: string
    description?: string
    actions?: ReactNode
}

export function TopBar({ title, description, actions }: TopBarProps) {
    return (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div>
                <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                {description && <p className="text-sm text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="flex items-center gap-3">
                {actions}
                <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                </button>
            </div>
        </div>
    )
}
