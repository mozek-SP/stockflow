import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 btn-ripple active:scale-[0.97]",
    {
        variants: {
            variant: {
                default:     "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
                destructive: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
                outline:     "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
                secondary:   "bg-slate-100 text-slate-700 hover:bg-slate-200",
                ghost:       "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                link:        "text-violet-600 underline-offset-4 hover:underline",
                gradient:    "bg-violet-600 text-white hover:bg-violet-700 shadow-sm shadow-violet-200",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm:      "h-8 px-3 text-xs",
                lg:      "h-10 px-8",
                icon:    "h-9 w-9",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, onMouseDown, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"

        const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
            const el = e.currentTarget
            const rect = el.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            el.style.setProperty("--ripple-x", `${x}%`)
            el.style.setProperty("--ripple-y", `${y}%`)
            el.classList.remove("ripple-active")
            void el.offsetWidth // force reflow
            el.classList.add("ripple-active")
            setTimeout(() => el.classList.remove("ripple-active"), 600)
            onMouseDown?.(e)
        }, [onMouseDown])

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                onMouseDown={handleMouseDown as any}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }

