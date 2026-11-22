import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, Shield, Cpu, Zap, Sparkles, Search, X } from 'lucide-react'
import { CATEGORIES } from '../config/tools'
import type { CategoryKey } from '../config/tools'

export const Route = createFileRoute('/')({
  component: Home,
})

const POPULAR: CategoryKey[] = ['ai', 'media', 'document', 'image']

const FEATURES = [
  {
    icon: <Shield size={20} className="text-violet-400" />,
    title: 'Local-first processing',
    desc: 'Image, document, text and media files are processed in your browser instead of being uploaded to our app server.',
  },
  {
    icon: <Zap size={20} className="text-violet-400" />,
    title: 'Built for speed',
    desc: 'Browser-native APIs and WebAssembly handle demanding conversions without a round trip to our servers.',
  },
  {
    icon: <Cpu size={20} className="text-violet-400" />,
    title: 'AI when you need it',
    desc: 'AI text requests are sent to NVIDIA NIM through a server endpoint. Provider keys stay on the server.',
  },
  {
    icon: <Sparkles size={20} className="text-violet-400" />,
    title: 'No account required',
    desc: 'Use the local conversion tools without creating an account. AI and exchange-rate features need an internet connection.',
  },
]

function Home() {
  const [toolQuery, setToolQuery] = useState('')
  const normalizedQuery = toolQuery.trim().toLowerCase()
  const filteredCategories = CATEGORIES.filter((category) =>
    [category.label, category.description, ...category.examples].join(' ').toLowerCase().includes(normalizedQuery),
  )

  return (
    <div className="relative">

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[90vh] flex flex-col items-center justify-center px-4 py-32 bg-grid">

        {/* Glow orbs */}
        <div className="glow-orb animate-drift"
          style={{ width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
        <div className="glow-orb animate-float"
          style={{ width: 300, height: 300, bottom: 0, right: '10%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
            animationDelay: '3s' }} />

        {/* Badge */}
        <div className="animate-fade-in-up relative z-10 flex items-center gap-2 mb-8">
          <span className="label-mono flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-card)]">
            <span className="accent-dot" />
            Local-first · No account required
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <h1 className="animate-fade-in-up stagger-2 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] text-[var(--text-1)] mb-0">
            Convert.
          </h1>
          <h1 className="animate-fade-in-up stagger-3 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] mb-0">
            <span className="text-shimmer">Anything.</span>
          </h1>
          <h1 className="animate-fade-in-up stagger-4 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] text-[var(--text-1)] opacity-20 mb-12">
            Instantly.
          </h1>

          <p className="animate-fade-in-up stagger-5 text-lg leading-relaxed max-w-xl mx-auto mb-12"
            style={{ color: 'var(--text-2)' }}>
            Audio, images, documents, code, units, currencies and colors in one browser-first workspace.
            Files stay local for most tools; AI prompts and exchange-rate requests connect to their providers.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up stagger-6 flex flex-wrap items-center justify-center gap-3 mb-16">
            {POPULAR.map((key) => {
              const cat = CATEGORIES.find(c => c.key === key)!
              return (
                <Link
                  key={key}
                  to="/tools/$toolId"
                  params={{ toolId: key }}
                  className="btn-ghost group flex items-center gap-2"
                >
                  <span style={{ color: 'var(--text-2)' }}>{cat.icon}</span>
                  <span className="text-sm font-semibold text-[var(--text-2)] group-hover:text-[var(--text-1)] transition-colors">
                    {cat.label}
                  </span>
                  <ArrowRight size={13} className="text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
                </Link>
              )
            })}
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up stagger-7 flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              [String(CATEGORIES.length), 'Tools'],
              ['Local-first', 'File processing'],
              ['No sign-up', 'Required'],
              ['AI', 'Optional'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-[var(--text-1)]">{num}</div>
                <div className="label-mono mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="hairline border-t" />

      {/* ── Features row ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`animate-fade-in-up card-dark card-glow p-6 rounded-xl stagger-${i + 1}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 icon-lift"
                style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)' }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-[var(--text-1)] text-sm mb-1.5">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="hairline border-t" />

      {/* ── Tool grid ────────────────────────────────────── */}
      <section id="converters" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">

        {/* Section header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="label-mono mb-2">All Tools</p>
            <h2 className="text-3xl font-black text-[var(--text-1)] tracking-tight">Choose a Tool</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>Find the right utility for the job.</p>
          </div>
          <div className="w-full sm:w-80">
            <label htmlFor="tool-search" className="sr-only">Search conversion tools</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-3)' }} />
              <input
                id="tool-search"
                type="search"
                value={toolQuery}
                onChange={(event) => setToolQuery(event.target.value)}
                placeholder="Search tools or formats…"
                className="w-full rounded-xl border py-3 pl-10 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-violet-500/30"
                style={{ color: 'var(--text-1)', background: 'var(--bg-card)', borderColor: 'var(--border)' }}
              />
              {toolQuery && (
                <button
                  type="button"
                  onClick={() => setToolQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition hover:bg-[var(--accent-dim)]"
                  style={{ color: 'var(--text-3)' }}
                  aria-label="Clear tool search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <p className="label-mono mt-2 text-right">{filteredCategories.length} of {CATEGORIES.length} tools</p>
          </div>
        </div>

        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredCategories.map((cat, i) => (
            <Link
              key={cat.key}
              to="/tools/$toolId"
              params={{ toolId: cat.key }}
              className={`card-dark card-glow animate-fade-in-up relative block p-5 rounded-xl group stagger-${Math.min(i + 1, 12)}`}
            >
              {/* Badge */}
              {cat.badge && (
                <span className="absolute top-3 right-3 label-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--border)' }}>
                  {cat.badge}
                </span>
              )}

              {/* Icon */}
              <div className={`icon-lift inline-flex p-2.5 rounded-lg mb-4 ${cat.iconBg}`}
                style={{ outline: '1px solid rgba(255,255,255,0.06)' }}>
                {cat.icon}
              </div>

              {/* Text */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-[var(--text-1)] text-sm tracking-tight">{cat.label}</h3>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-2)' }}>
                    {cat.description}
                  </p>
                </div>
                <ArrowRight size={15} className="mt-0.5 flex-shrink-0 text-[var(--text-3)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Example pills */}
              <div className="flex flex-wrap gap-1 mt-4">
                {cat.examples.slice(0, 3).map(ex => (
                  <span key={ex} className="label-mono px-2 py-0.5 rounded"
                    style={{ background: 'var(--accent-dim)', border: '1px solid var(--border)', opacity: 0.8 }}>
                    {ex}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            <Search size={24} className="mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
            <h3 className="font-bold text-[var(--text-1)]">No tools found</h3>
            <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-2)' }}>Try a different name, category or file format.</p>
            <button type="button" onClick={() => setToolQuery('')} className="btn-ghost">Clear search</button>
          </div>
        )}
      </section>

      {/* ── "Drop anywhere" CTA strip ────────────────────── */}
      <div className="hairline border-t" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-fade-in-up flex items-center justify-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-400" />
          <span className="label-mono text-violet-400">Pro tip</span>
        </div>
        <h2 className="text-2xl font-black text-[var(--text-1)] mb-3 tracking-tight">
          Drop a supported file anywhere on the page to find its tool
        </h2>
        <p style={{ color: 'var(--text-2)' }} className="text-sm max-w-sm mx-auto">
          We'll detect common image, document, text and media formats and open a matching converter. Select the file in that tool to start processing. If a format is not recognised, choose a tool from the grid above.
        </p>
        <p className="text-xs max-w-2xl mx-auto mt-5" style={{ color: 'var(--text-3)' }}>
          Privacy note: local file tools process files in your browser. AI text requests are sent to NVIDIA NIM, and currency rates are fetched from an external rate provider.
        </p>
      </section>
    </div>
  )
}
