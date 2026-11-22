import { HeadContent, Scripts, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import Header from '../components/Header'
import RecentActivity from '../components/RecentActivity'
import type { CategoryKey } from '../config/tools'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ConvertIt — Browser-first file & data tools' },
      { name: 'description', content: 'A browser-first workspace for converting images, documents, audio, text, code, units, numbers, currencies and colors.' },
      { name: 'theme-color', content: '#080808' },
      { property: 'og:title', content: 'ConvertIt — Browser-first file & data tools' },
      { property: 'og:description', content: 'Convert common files and data formats in one browser-first workspace. Local tools keep files in your browser; AI and rate lookups use external providers.' },
      { property: 'og:type', content: 'website' },
    ],
    links: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  }),
  component: AppLayout,
  shellComponent: RootDocument,
})

function AppLayout() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const isOverLocalDropzone = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest('[data-file-dropzone], input[type="file"]'))

    const handleDragOver = (e: DragEvent) => {
      if (isOverLocalDropzone(e.target)) {
        setIsDraggingGlobal(false)
        return
      }
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) setIsDraggingGlobal(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.target === document.documentElement) setIsDraggingGlobal(false)
    }
    const handleDrop = (e: DragEvent) => {
      setIsDraggingGlobal(false)
      // Let a converter's own drop handler receive files dropped into its upload area.
      if (isOverLocalDropzone(e.target)) return

      e.preventDefault()
      const file = e.dataTransfer?.files[0]
      if (!file) return

      const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
      const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.avif', '.tif', '.tiff'])
      const documentExtensions = new Set(['.docx', '.pdf', '.xlsx', '.xls', '.csv', '.html', '.htm'])
      const textExtensions = new Set(['.txt', '.md', '.json', '.xml', '.yaml', '.yml', '.log'])
      const mediaExtensions = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac', '.mp4', '.webm', '.avi', '.mkv', '.mov'])

      let target: CategoryKey | null = null
      if (file.type.startsWith('image/') || imageExtensions.has(extension)) target = 'image'
      else if (documentExtensions.has(extension)) target = 'document'
      else if (file.type.startsWith('audio/') || file.type.startsWith('video/') || mediaExtensions.has(extension)) target = 'media'
      else if (file.type.startsWith('text/') || textExtensions.has(extension)) target = 'text'

      if (target) {
        navigate({ to: '/tools/$toolId', params: { toolId: target } })
      }
    }

    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [navigate])

  return (
    <>
      <Header 
        onNavClick={(target) => navigate({ to: '/tools/$toolId', params: { toolId: target as CategoryKey } })} 
        onHistoryClick={() => setHistoryOpen(true)} 
      />
      <RecentActivity isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      
      {isDraggingGlobal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="px-10 py-8 rounded-2xl flex flex-col items-center animate-scale-in"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 animate-float"
              style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.3)' }}>
              <Zap size={28} className="text-violet-400" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Find the right tool</h2>
            <p className="text-sm mt-1.5 max-w-sm" style={{ color: 'var(--text-2)' }}>We'll open a matching converter. Select the file there to start processing.</p>
          </div>
        </div>
      )}

      {/* Main content renders here */}
      <Outlet />
      
      {/* Universal Footer */}
      <footer className="mt-20 py-12 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black tracking-tight" style={{ color: 'var(--text-1)' }}>ConvertIt</span>
            <span className="label-mono px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}>BETA</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            Local file tools stay in your browser · AI prompts and rate lookups use external providers
          </p>
          <p className="label-mono" style={{ color: 'var(--text-3)' }}>
            FFmpeg · pdf-lib · NVIDIA NIM
          </p>
        </div>
      </footer>
    </>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-1)] transition-colors duration-300">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
