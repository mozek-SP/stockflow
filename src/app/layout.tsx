import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from "@/lib/i18n"
import { AuthProvider } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { ActionNotificationContainer } from "@/components/ui/ActionNotification"

export const metadata: Metadata = {
    title: "StockFlow — ระบบจัดการสต๊อก",
    description: "ระบบจัดการสต๊อกและสินค้าคงคลังสมัยใหม่",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            <body className="bg-slate-50 text-slate-900 antialiased">
                <AuthProvider>
                    <LanguageProvider>
                        <div className="flex h-screen overflow-hidden">
                            <Sidebar />
                            <main className="flex-1 overflow-y-auto bg-slate-50">
                                {children}
                            </main>
                        </div>
                        <Toaster />
                        <ActionNotificationContainer />
                    </LanguageProvider>
                </AuthProvider>
            </body>
        </html>
    )
}

