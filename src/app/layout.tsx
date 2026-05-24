// app/layout.tsx
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { UserProvider } from "@/context/UserContext";
import Script from "next/script";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
        <body className="bg-gray-100 flex justify-center">
        <Script
            src="https://telegram.org/js/telegram-web-app.js"
            strategy="beforeInteractive"
        />

        <UserProvider>
            <div
                // className="w-full min-h-screen bg-white relative max-w-md lg:max-w-none">
                className="w-full min-h-screen bg-white relative max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-5xl xl:max-w-7xl">
                <div className="pb-24">{children}</div>
                <BottomNav />
            </div>
        </UserProvider>
        </body>
        </html>
    );
}