import { HeadContent, Scripts, createRootRoute, Outlet, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'
import Header from '../components/Header'
import RecentActivity from '../components/RecentActivity'
import { CategoryKey } from '../config/tools'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ConvertIt – Convert Anything, Instantly' },
      { name: 'description', content: 'Free online file and data converter. Convert images, documents, text, units, numbers, currencies, and colors.' },
    ],
  }),
  component: AppLayout,
  shellComponent: RootDocument,
})

function AppLayout() {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types.includes('Files')) setIsDraggingGlobal(true)
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.target === document.documentElement) setIsDraggingGlobal(false)
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDraggingGlobal(false)
      const file = e.dataTransfer?.files[0]
      if (!file) return

      let target: CategoryKey | null = null
      if (file.type.startsWith('image/')) target = 'image'
      else if (file.name.endsWith('.docx') || file.name.endsWith('.pdf') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.html')) target = 'document'
      else if (file.name.endsWith('.json') || file.name.endsWith('.md') || file.type.startsWith('text/')) target = 'text'
      else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) target = 'media'

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
            <h2 className="text-xl font-black text-white tracking-tight">Drop it anywhere</h2>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>We'll open the right converter automatically</p>
          </div>
        </div>
      )}

      {/* Main content renders here */}
      <Outlet />
      
      {/* Universal Footer */}
      <footer className="mt-20 py-12 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-tight">ConvertIt</span>
            <span className="label-mono px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: 'var(--accent-dim)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>BETA</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            All conversions run in your browser · Zero uploads · 100% private
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
      <body style={{ background: '#080808' }} className="min-h-screen flex flex-col text-white">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
