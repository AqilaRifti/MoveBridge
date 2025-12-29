import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Navigation } from './components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'MoveBridge Demo',
    description: 'Interactive demo showcasing MoveBridge SDK for Movement Network',
    keywords: ['Movement', 'blockchain', 'SDK', 'React', 'Web3'],
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="h-full">
            <body className={`${inter.className} h-full`}>
                <Providers>
                    <div className="min-h-full flex flex-col">
                        <Navigation />
                        <main className="flex-1">
                            {children}
                        </main>
                        <footer className="py-6 text-center text-sm text-slate-500 border-t border-slate-200 dark:border-slate-700">
                            <p>Built with MoveBridge SDK • Movement Network</p>
                        </footer>
                    </div>
                </Providers>
            </body>
        </html>
    )
}
