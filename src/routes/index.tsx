import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Shield, Cpu, Zap, Globe, Sparkles } from 'lucide-react'
import { CATEGORIES, CategoryKey } from '../config/tools'

export const Route = createFileRoute('/')({
  component: Home,
})

const POPULAR: CategoryKey[] = ['ai', 'media', 'document', 'image']

const FEATURES = [
  {
    icon: <Shield size={20} className="text-violet-400" />,
    title: 'Zero Upload Policy',
    desc: 'Every conversion runs inside your browser. Files never touch a server.',
  },
  {
    icon: <Zap size={20} className="text-violet-400" />,
    title: 'Instant Results',
    desc: 'WebAssembly and native browser APIs mean millisecond processing.',
  },
  {
    icon: <Cpu size={20} className="text-violet-400" />,
    title: 'AI-Powered',
    desc: 'Groq Llama 3 powers rewriting, summarizing, translation and more.',
  },
  {
    icon: <Globe size={20} className="text-violet-400" />,
    title: 'Works Offline',
    desc: 'No internet needed after first load. Open tabs, convert freely.',
  },
]

function Home() {
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
          <span className="label-mono flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 bg-white/4">
            <span className="accent-dot" />
            Free · Private · No account required
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <h1 className="animate-fade-in-up stagger-2 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] text-white mb-0">
            Convert.
          </h1>
          <h1 className="animate-fade-in-up stagger-3 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] mb-0">
            <span className="text-shimmer">Anything.</span>
          </h1>
          <h1 className="animate-fade-in-up stagger-4 font-black text-[clamp(56px,10vw,120px)] leading-[0.92] tracking-[-0.04em] text-white/30 mb-12">
            Instantly.
          </h1>

          <p className="animate-fade-in-up stagger-5 text-lg leading-relaxed max-w-xl mx-auto mb-12"
            style={{ color: 'var(--text-2)' }}>
            Audio, images, documents, code, units, currencies, colors — all processed in your browser.
            No uploads. No accounts. Complete privacy.
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
                  <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
                    {cat.label}
                  </span>
                  <ArrowRight size={13} className="text-white/30 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )
            })}
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up stagger-7 flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              ['12+', 'Tools'],
              ['0', 'Server uploads'],
              ['100%', 'Free forever'],
              ['AI', 'Powered'],
            ].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-white">{num}</div>
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
                style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124,58,237,0.2)' }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-white text-sm mb-1.5">{f.title}</h3>
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
        <div className="animate-fade-in flex items-end justify-between mb-10">
          <div>
            <p className="label-mono mb-2">All Tools</p>
            <h2 className="text-3xl font-black text-white tracking-tight">Choose a Tool</h2>
          </div>
          <span className="label-mono px-3 py-1.5 rounded-md border"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
            {CATEGORIES.length} available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.key}
              to="/tools/$toolId"
              params={{ toolId: cat.key }}
              className={`card-dark card-glow animate-fade-in-up relative block p-5 rounded-xl group stagger-${Math.min(i + 1, 12)}`}
            >
              {/* Badge */}
              {cat.badge && (
                <span className="absolute top-3 right-3 label-mono px-2 py-0.5 rounded"
                  style={{ background: 'var(--accent-dim)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.25)' }}>
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
                  <h3 className="font-bold text-white text-sm tracking-tight">{cat.label}</h3>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-2)' }}>
                    {cat.description}
                  </p>
                </div>
                <ArrowRight size={15} className="mt-0.5 flex-shrink-0 text-white/20 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Example pills */}
              <div className="flex flex-wrap gap-1 mt-4">
                {cat.examples.slice(0, 3).map(ex => (
                  <span key={ex} className="label-mono px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                    {ex}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── "Drop anywhere" CTA strip ────────────────────── */}
      <div className="hairline border-t" />
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-fade-in-up flex items-center justify-center gap-2 mb-4">
          <Sparkles size={16} className="text-violet-400" />
          <span className="label-mono text-violet-400">Pro tip</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
          Drop any file anywhere on the page
        </h2>
        <p style={{ color: 'var(--text-2)' }} className="text-sm max-w-sm mx-auto">
          We'll automatically detect the file type and open the right converter for you.
        </p>
      </section>
    </div>
  )
}
