import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Copy, Trash2, ChevronDown, Zap, Brain, FileText, RefreshCcw, CheckCircle } from 'lucide-react'

type AIMode = 'rewrite' | 'summarize' | 'brainstorm' | 'explain' | 'translate' | 'fix-grammar'

const MODES: { key: AIMode; label: string; icon: React.ReactNode; prompt: string; desc: string; color: string }[] = [
  {
    key: 'rewrite',
    label: 'Rewrite Professionally',
    icon: <RefreshCcw size={15} />,
    prompt: 'Rewrite the following text in a professional, clear, and polished style. Maintain the original meaning but elevate the language:',
    desc: 'Transform casual or rough text into polished professional writing',
    color: 'from-violet-500 to-purple-600',
  },
  {
    key: 'summarize',
    label: 'Summarize',
    icon: <FileText size={15} />,
    prompt: 'Provide a concise, well-structured summary of the following text. Use bullet points where appropriate:',
    desc: 'Get a clear, concise summary of any content',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm Ideas',
    icon: <Brain size={15} />,
    prompt: 'Based on the following topic or text, generate 8-10 creative, actionable, and diverse ideas. Format as a numbered list:',
    desc: 'Generate creative ideas and perspectives',
    color: 'from-orange-500 to-amber-600',
  },
  {
    key: 'explain',
    label: 'Explain Simply',
    icon: <Zap size={15} />,
    prompt: 'Explain the following concept or text in simple, easy-to-understand language as if explaining to someone unfamiliar with the topic:',
    desc: 'Break down complex topics into simple explanations',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'translate',
    label: 'Translate to English',
    icon: <ChevronDown size={15} />,
    prompt: 'Translate the following text to fluent, natural English. If it is already in English, improve the flow and clarity:',
    desc: 'Translate text to English or improve existing English',
    color: 'from-pink-500 to-rose-600',
  },
  {
    key: 'fix-grammar',
    label: 'Fix Grammar & Style',
    icon: <CheckCircle size={15} />,
    prompt: 'Fix all grammar, spelling, punctuation, and style issues in the following text. Provide the corrected version only:',
    desc: 'Auto-fix grammar, spelling and formatting issues',
    color: 'from-indigo-500 to-blue-600',
  },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  mode?: AIMode
}

async function callAI(prompt: string, onChunk: (text: string) => void): Promise<void> {
  const res = await fetch('/api/ai-nvidia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(errData?.error || `API error (${res.status})`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response stream received')
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue
        try {
          const parsed = JSON.parse(data)
          const text = parsed?.text
          if (text) onChunk(text)
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}


export default function AITools() {
  const [mode, setMode] = useState<AIMode>('rewrite')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const currentMode = MODES.find(m => m.key === mode)!

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const run = async () => {
    if (!input.trim() || isLoading) return
    const userText = input.trim()
    const fullPrompt = `${currentMode.prompt}\n\n${userText}`
    setInput('')
    setError('')
    setMessages(prev => [...prev, { role: 'user', content: userText, mode }])
    setIsLoading(true)

    // Add placeholder assistant msg
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      await callAI(fullPrompt, (chunk: string) => {
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk }
          }
          return updated
        })
      })
    } catch (e: any) {
      setError(e.message || 'AI request failed. Please try again.')
      setMessages(prev => prev.slice(0, -1)) // Remove empty assistant msg
    } finally {
      setIsLoading(false)
    }
  }

  const copyLast = async () => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant) return
    await navigator.clipboard.writeText(lastAssistant.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clear = () => {
    setMessages([])
    setError('')
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      run()
    }
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Mode</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                mode === m.key
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 bg-white dark:bg-gray-800/50'
              }`}
            >
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg bg-gradient-to-r ${m.color} text-white mb-1.5`}>
                {m.icon} {m.label}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation */}
      {messages.length > 0 && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scroll-smooth">
          {messages.map((msg, i) => {
            const msgMode = MODES.find(m => m.key === msg.mode) || currentMode
            return (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-8 h-8 shrink-0 rounded-full bg-gradient-to-br ${msgMode.color} flex items-center justify-center`}>
                    <Sparkles size={14} className="text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && !msg.content && isLoading ? (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 shrink-0 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">
                    U
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="text-center py-10 text-gray-400 dark:text-gray-600">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentMode.color} flex items-center justify-center mx-auto mb-4 opacity-80`}>
            <Sparkles size={28} className="text-white" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-400">Ready for "{currentMode.label}"</p>
          <p className="text-sm mt-1">{currentMode.desc}</p>
          <p className="text-xs mt-3 text-gray-400">Paste or type your text below to get started</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {/* Input Area */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Paste your text here for "${currentMode.label}"…`}
          rows={4}
          className="w-full px-4 pt-4 pb-2 bg-transparent text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  onClick={copyLast}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy Last</>}
                </button>
                <button
                  onClick={clear}
                  className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Trash2 size={13} /> Clear
                </button>
              </>
            )}
            <span className="text-xs text-gray-300 dark:text-gray-700">Ctrl+Enter to run</span>
          </div>
          <button
            onClick={run}
            disabled={!input.trim() || isLoading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r ${currentMode.color} text-white shadow-sm disabled:opacity-50 hover:opacity-90 active:scale-95`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            {isLoading ? 'Thinking…' : 'Run AI'}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        Powered by NVIDIA NIM · Llama 3.1 · Fast and private
      </p>
    </div>
  )
}
