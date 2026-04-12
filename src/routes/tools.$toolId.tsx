import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Suspense } from 'react'
import { CATEGORIES, CategoryKey } from '../config/tools'
import { ChevronRight } from 'lucide-react'

// Import components directly or via lazy
import { lazy } from 'react'
const ImageConverter = lazy(() => import('../components/converters/ImageConverter'))
const DocumentConverter = lazy(() => import('../components/converters/DocumentConverter'))
const TextConverter = lazy(() => import('../components/converters/TextConverter'))
const UnitConverter = lazy(() => import('../components/converters/UnitConverter'))
const NumberConverter = lazy(() => import('../components/converters/NumberConverter'))
const CurrencyConverter = lazy(() => import('../components/converters/CurrencyConverter'))
const ColorConverter = lazy(() => import('../components/converters/ColorConverter'))
const Calculator = lazy(() => import('../components/Calculator'))
const CodeConverter = lazy(() => import('../components/converters/CodeConverter'))
const QRConverter = lazy(() => import('../components/converters/QRConverter'))
const MediaConverter = lazy(() => import('../components/converters/MediaConverter'))
const AITools = lazy(() => import('../components/converters/AITools'))

const COMPONENT_MAP: Record<CategoryKey, React.ComponentType> = {
  image: ImageConverter,
  document: DocumentConverter,
  text: TextConverter,
  code: CodeConverter,
  qr: QRConverter,
  unit: UnitConverter,
  number: NumberConverter,
  currency: CurrencyConverter,
  color: ColorConverter,
  calculator: Calculator,
  media: MediaConverter,
  ai: AITools,
}

export const Route = createFileRoute('/tools/$toolId')({
  beforeLoad: ({ params }) => {
    const k = params.toolId as CategoryKey
    if (!CATEGORIES.find(c => c.key === k)) {
      throw redirect({ to: '/' })
    }
  },
  component: ToolPage,
})

function ToolPage() {
  const { toolId } = Route.useParams()
  const activeCat = CATEGORIES.find(c => c.key === toolId)!
  const ActiveComponent = COMPONENT_MAP[toolId as CategoryKey]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar for all tools */}
      <aside className="w-full md:w-56 flex-shrink-0 space-y-0.5">
        <h3 className="label-mono px-3 mb-3">All Tools</h3>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.key}
            to="/tools/$toolId"
            params={{ toolId: cat.key }}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 border ${
              toolId === cat.key
                ? 'sidebar-dark-active text-violet-400 border-transparent'
                : 'text-white/40 hover:text-white/80 border-transparent hover:bg-white/4'
            }`}
          >
            <span className={toolId === cat.key ? 'text-violet-400' : 'text-white/25'}>{cat.icon}</span>
            <span className="text-sm font-medium">{cat.label}</span>
          </Link>
        ))}
      </aside>

      {/* Main Panel */}
      <main className="flex-1 min-w-0 page-enter">
        <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: 'var(--text-3)' }}>
          <Link to="/" className="hover:text-violet-400 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <span className="text-white/60">{activeCat.label}</span>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {/* Banner */}
          <div className={`tool-banner-dark relative px-6 py-7 bg-gradient-to-r ${activeCat.gradient} flex items-center gap-4`}>
            <div className="w-12 h-12 bg-black/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
              {activeCat.icon}
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">{activeCat.label}</h1>
              <p className="text-white/70 text-sm mt-0.5">{activeCat.description}</p>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: '#7c3aed' }} />
              </div>
            }>
              <ActiveComponent />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
