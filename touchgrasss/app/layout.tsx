import { Geist } from "next/font/google";
import "./globals.css";
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { VenueProvider } from "./contexts/venueContext";

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'] })

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Dorehami",
  description: "Doreham boodan che khoobeh!",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <VenueProvider>
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-[#23243B]/95 text-white">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-20">
                {/* Logo */}
                <Link href="/" className={`${playfair.className} text-3xl font-bold`}>
                  Dore Hami
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8">
                  <Link href="/venues" className="hover:text-yellow-300 transition-colors">
                    Venues
                  </Link>
                  <Link href="/plan-event" className="hover:text-yellow-300 transition-colors">
                    Plan Event
                  </Link>
                  <Link href="/about" className="hover:text-yellow-300 transition-colors">
                    About
                  </Link>

                  <Link href="/account" className="hover:text-yellow-300 transition-colors">
                    Account
                  </Link>

                  <Link 
                    href="/fa" 
                    className="px-4 py-2 bg-[#4A0404] rounded hover:bg-[#4A0404]/80 transition-colors"
                  >
                    فارسی
                  </Link>
                </nav>

                {/* Mobile Menu Button */}
                <button className="md:hidden p-2">
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-screen pt-20">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-[#23243B] text-white py-6">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm">© 2025 Dore Hami</p>
            </div>
          </footer>
        </VenueProvider>
      </body>
    </html>
  )
}
