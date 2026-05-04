import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Souls Grail',
  description: 'Elden Ring AI Companion',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-screen overflow-hidden" style={{ background: 'var(--bg-void)' }}>
        {children}
      </body>
    </html>
  )
}