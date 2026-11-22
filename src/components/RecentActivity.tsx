import { useEffect, useState } from 'react'
import { Clock, X, Trash2 } from 'lucide-react'

export interface HistoryItem {
  id: string
  action: string
  ts: number
}

interface RecentActivityProps {
  isOpen: boolean
  onClose: () => void
}

export default function RecentActivity({ isOpen, onClose }: RecentActivityProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('convertit_history')
      const parsed: unknown = stored ? JSON.parse(stored) : []
      if (Array.isArray(parsed)) {
        const validItems = parsed.filter((item): item is HistoryItem =>
          !!item && typeof item.id === 'string' && typeof item.action === 'string' &&
          typeof item.ts === 'number' && Number.isFinite(item.ts),
        )
        setHistory(validItems.slice(0, 50))
      }
    } catch {
      setHistory([])
    }

    const handleNewEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ action?: unknown; ts?: unknown }>).detail
      const action = detail?.action
      const timestamp = detail?.ts
      if (typeof action !== 'string' || typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return

      setHistory(prev => {
        const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const newItem: HistoryItem = { id, action: action.slice(0, 180), ts: timestamp }
        const updated = [newItem, ...prev].slice(0, 50)
        try { localStorage.setItem('convertit_history', JSON.stringify(updated)) } catch { /* Storage can be disabled. */ }
        return updated
      })
    }

    window.addEventListener('convertit-history', handleNewEvent)
    return () => window.removeEventListener('convertit-history', handleNewEvent)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const clearHistory = () => {
    setHistory([])
    try { localStorage.removeItem('convertit_history') } catch { /* Storage can be disabled. */ }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true" aria-labelledby="recent-activity-title" aria-hidden={!isOpen}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div id="recent-activity-title" className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold text-lg">
            <Clock className="text-violet-500" size={20} />
            Recent Activity
          </div>
          <button type="button" onClick={onClose} aria-label="Close recent activity" className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500 pb-20">
              <Clock size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-gray-500 dark:text-gray-400">No activity yet</p>
              <p className="text-sm mt-1">Your recent conversions will appear here.</p>
            </div>
          ) : (
            history.map(item => (
              <div key={item.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-violet-200 dark:hover:border-violet-900/50 transition-colors">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.action}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                  {new Date(item.ts).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                  })}
                </p>
              </div>
            ))
          )}
        </div>

        {history.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={clearHistory}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <Trash2 size={16} /> Clear History
            </button>
          </div>
        )}
      </div>
    </>
  )
}
