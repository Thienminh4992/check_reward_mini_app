// app/layout.tsx
import "./globals.css"
import BottomNav from "@/components/BottomNav"
import { UserProvider } from "@/context/UserContext"
import Script from "next/script"

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  return (
      <html lang="vi">
      <body className="bg-gray-100 flex justify-center">
      <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
      />

      <UserProvider>
        <div className="w-full max-w-md min-h-screen bg-white shadow-xl relative overflow-hidden">
          <div className="pb-24">
            {children}
          </div>

          <BottomNav />
        </div>
      </UserProvider>
      </body>
      </html>
  )
}