import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "border-slate-200 bg-slate-100 text-slate-700",
                outline: "border-slate-200 text-slate-600 bg-transparent",
                success: "border-emerald-200 bg-emerald-50 text-emerald-700",
                warning: "border-amber-200 bg-amber-50 text-amber-700",
                destructive: "border-red-200 bg-red-50 text-red-700",
                violet: "border-violet-200 bg-violet-50 text-violet-700",
                blue: "border-blue-200 bg-blue-50 text-blue-700",
            },
        },
        defaultVariants: { variant: "default" },
    }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
