import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, ChevronDown, FileText, Image as ImageIcon, Type, Ruler, Hash, DollarSign, Palette, Calculator, Menu, X, Code, QrCode, Clock, Film, Sparkles } from 'lucide-react'

function ConvertItLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#g)" />
      <path d="M9 16C9 12.13 12.13 9 16 9" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M23 16C23 19.87 19.87 23 16 23" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M12.5 12.5L9 16L12.5 19.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.5 19.5L23 16L19.5 12.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#7c3aed"/>
          <stop offset="1" stopColor="#4f46e5"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

const NAV_GROUPS = [
  {
    group: 'Converters',
    items: [
      { label: 'Media Converter',    icon: <Film size={14}/>,      href: 'media',    desc: 'Audio & video conversion' },
      { label: 'Image Converter',    icon: <ImageIcon size={14}/>, href: 'image',    desc: 'PNG, JPG, WebP, resize' },
      { label: 'Document Converter', icon: <FileText size={14}/>,  href: 'document', desc: 'Word, PDF, Excel, HTML', badge: 'Enhanced' },
      { label: 'Text Converter',     icon: <Type size={14}/>,      href: 'text',     desc: 'Markdown, JSON, CSV' },
    ]
  },
  {
    group: 'Developer',
    items: [
      { label: 'AI Text Tools', icon: <Sparkles size={14}/>, href: 'ai',   desc: 'Rewrite, summarize, translate', badge: 'AI' },
      { label: 'Code Tools',    icon: <Code size={14}/>,     href: 'code', desc: 'Base64, hashes, JSON/YAML',  badge: 'New' },
      { label: 'QR Generator',  icon: <QrCode size={14}/>,   href: 'qr',   desc: 'High-res QR codes',          badge: 'New' },
      { label: 'Color Converter',icon: <Palette size={14}/>, href: 'color',desc: 'HEX, RGB, HSL' },
    ]
  },
  {
    group: 'Units & Math',
    items: [
      { label: 'Unit Converter',    icon: <Ruler size={14}/>,      href: 'unit',       desc: 'Length, weight, temp' },
      { label: 'Number Converter',  icon: <Hash size={14}/>,       href: 'number',     desc: 'Binary, hex, octal' },
      { label: 'Currency Converter',icon: <DollarSign size={14}/>, href: 'currency',   desc: 'Live exchange rates' },
      { label: 'Calculator',        icon: <Calculator size={14}/>, href: 'calculator', desc: 'Scientific calculator' },
    ]
  },
]

export default function Header({
  onNavClick,
  onHistoryClick,
}: {
  onNavClick?: (key: string) => void
  onHistoryClick?: () => void
}) {
  const [isDark, setIsDark] = useState(true) // default dark
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Always start dark
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
    setIsDark(true)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleNavItem = (key: string) => {
    onNavClick?.(key)
    setOpenGroup(null)
    setMobileOpen(false)
    setTimeout(() => document.getElementById('converters')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <header className="sticky top-0 z-50 header-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <ConvertItLogo />
          <span className="text-base font-black tracking-tight text-white">
            ConvertIt
          </span>
          <span className="label-mono px-1.5 py-0.5 rounded text-[10px]"
            style={{ background: 'var(--accent-dim)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
            BETA
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5" ref={dropdownRef}>
          {NAV_GROUPS.map(group => (
            <div key={group.group} className="relative">
              <button
                onClick={() => setOpenGroup(prev => prev === group.group ? null : group.group)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  openGroup === group.group
                    ? 'text-white bg-white/6'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {group.group}
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${openGroup === group.group ? 'rotate-180 text-violet-400' : ''}`}
                />
              </button>

              {openGroup === group.group && (
                <div className="absolute top-full left-0 mt-2 w-64 rounded-xl overflow-hidden z-50 dropdown-dark">
                  <div className="p-1.5">
                    <p className="label-mono px-3 py-2">{group.group}</p>
                    {group.items.map(item => (
                      <button
                        key={item.label}
                        onClick={() => handleNavItem(item.href)}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all group text-left hover:bg-white/5"
                      >
                        <span className="mt-0.5 text-white/30 group-hover:text-violet-400 transition-colors flex-shrink-0">
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="label-mono px-1.5 py-0.5 rounded text-[9px]"
                                style={{ background: 'var(--accent-dim)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-1">
            <span className="accent-dot" />
            <span className="label-mono text-violet-400">Free & Private</span>
          </div>

          <button
            onClick={onHistoryClick}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Recent Activity"
          >
            <Clock size={15} />
            <span className="hidden sm:inline text-xs font-medium">History</span>
          </button>

          <div className="w-px h-4 bg-white/10 mx-0.5 hidden sm:block" />

          <button
            onClick={toggleDark}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setMobileOpen(p => !p)}
            className="md:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t px-4 py-5 space-y-5 animate-slide-down"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.group}>
              <p className="label-mono mb-2.5">{group.group}</p>
              <div className="space-y-1">
                {group.items.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleNavItem(item.href)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all text-left"
                  >
                    <span className="text-white/30">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white/70">{item.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                    </div>
                    {item.badge && (
                      <span className="ml-auto label-mono px-1.5 py-0.5 rounded text-[9px]"
                        style={{ background: 'var(--accent-dim)', color: '#a78bfa' }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
