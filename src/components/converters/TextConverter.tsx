import { useState } from 'react'
import { Download, Copy, Check, AlertCircle } from 'lucide-react'

type TextMode = 'md-html' | 'html-md' | 'json-csv' | 'csv-json'

const MODE_LABELS: Record<TextMode, string> = {
  'md-html': 'Markdown → HTML',
  'html-md': 'HTML → Markdown',
  'json-csv': 'JSON → CSV',
  'csv-json': 'CSV → JSON',
}

const PLACEHOLDERS: Record<TextMode, { input: string; output: string }> = {
  'md-html': {
    input: '# Hello World\n\nThis is **bold** and *italic* text.\n\n- Item 1\n- Item 2',
    output: 'HTML output will appear here…',
  },
  'html-md': {
    input: '<h1>Hello World</h1>\n<p>This is <strong>bold</strong> and <em>italic</em> text.</p>',
    output: 'Markdown output will appear here…',
  },
  'json-csv': {
    input: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
    output: 'CSV output will appear here…',
  },
  'csv-json': {
    input: 'name,age\nAlice,30\nBob,25',
    output: 'JSON output will appear here…',
  },
}

export default function TextConverter() {
  const [mode, setMode] = useState<TextMode>('md-html')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const convert = async () => {
    setError('')
    if (!input.trim()) { setError('Please enter some text to convert.'); return }
    try {
      if (mode === 'md-html') {
        const { marked } = await import('marked')
        const html = await marked(input)
        setOutput(html as string)
      } else if (mode === 'html-md') {
        const TurndownService = (await import('turndown')).default
        const td = new TurndownService()
        setOutput(td.turndown(input))
      } else if (mode === 'json-csv') {
        const Papa = (await import('papaparse')).default
        const data = JSON.parse(input)
        if (!Array.isArray(data)) throw new Error('Input must be a JSON array.')
        const csv = Papa.unparse(data)
        setOutput(csv)
      } else {
        const Papa = (await import('papaparse')).default
        const result = Papa.parse(input, { header: true, skipEmptyLines: true })
        if (result.errors.length > 0) throw new Error(result.errors[0].message)
        setOutput(JSON.stringify(result.data, null, 2))
      }
    } catch (err) {
      setError(`Conversion error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const download = () => {
    if (!output) return
    const ext = mode === 'md-html' ? 'html' : mode === 'html-md' ? 'md' : mode === 'json-csv' ? 'csv' : 'json'
    const blob = new Blob([output], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODE_LABELS) as TextMode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setOutput(''); setError('') }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Input</label>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[mode].input}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output</label>
          <textarea
            value={output}
            readOnly
            placeholder={PLACEHOLDERS[mode].output}
            rows={12}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-sm font-mono resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={convert}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Convert
        </button>
        {output && (
          <>
            <button onClick={copy} className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={download} className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm font-medium">
              <Download size={16} /> Download
            </button>
          </>
        )}
      </div>
    </div>
  )
}
