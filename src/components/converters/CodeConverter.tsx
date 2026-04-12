import { useState } from 'react'
import { Code, Hash, Copy, Check, Info } from 'lucide-react'
import YAML from 'yaml'
import CryptoJS from 'crypto-js'

type CodeMode = 'json-yaml' | 'yaml-json' | 'json-format' | 'json-minify' | 'base64-enc' | 'base64-dec' | 'url-enc' | 'url-dec' | 'md5' | 'sha256'

const MODES: { key: CodeMode; label: string; desc: string; category: string }[] = [
  { key: 'json-yaml', label: 'JSON → YAML', desc: 'Convert JSON to YAML', category: 'Format' },
  { key: 'yaml-json', label: 'YAML → JSON', desc: 'Convert YAML to JSON', category: 'Format' },
  { key: 'json-format', label: 'Format JSON', desc: 'Prettify JSON data', category: 'Format' },
  { key: 'json-minify', label: 'Minify JSON', desc: 'Compress JSON data', category: 'Format' },
  { key: 'base64-enc', label: 'Base64 Encode', desc: 'Text to Base64 string', category: 'Encode' },
  { key: 'base64-dec', label: 'Base64 Decode', desc: 'Base64 to plain text', category: 'Encode' },
  { key: 'url-enc', label: 'URL Encode', desc: 'Encode URL parameters', category: 'Encode' },
  { key: 'url-dec', label: 'URL Decode', desc: 'Decode URL string', category: 'Encode' },
  { key: 'md5', label: 'MD5 Hash', desc: 'Generate MD5 checksum', category: 'Hash' },
  { key: 'sha256', label: 'SHA-256 Hash', desc: 'Generate SHA256 checksum', category: 'Hash' }
]

export default function CodeConverter() {
  const [mode, setMode] = useState<CodeMode>('json-yaml')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const processConvert = (val: string, currentMode: CodeMode) => {
    setInput(val)
    if (!val.trim()) {
      setOutput('')
      setError('')
      return
    }

    try {
      setError('')
      let res = ''
      switch (currentMode) {
        case 'json-yaml':
          res = YAML.stringify(JSON.parse(val))
          break
        case 'yaml-json':
          res = JSON.stringify(YAML.parse(val), null, 2)
          break
        case 'json-format':
          res = JSON.stringify(JSON.parse(val), null, 2)
          break
        case 'json-minify':
          res = JSON.stringify(JSON.parse(val))
          break
        case 'base64-enc':
          res = btoa(unescape(encodeURIComponent(val)))
          break
        case 'base64-dec':
          res = decodeURIComponent(escape(atob(val)))
          break
        case 'url-enc':
          res = encodeURIComponent(val)
          break
        case 'url-dec':
          res = decodeURIComponent(val)
          break
        case 'md5':
          res = CryptoJS.MD5(val).toString()
          break
        case 'sha256':
          res = CryptoJS.SHA256(val).toString()
          break
      }
      setOutput(res)
      // Log to history here (to be implemented globally later)
      const event = new CustomEvent('convertit-history', {
        detail: { action: `Code Tool: ${MODES.find(m => m.key === currentMode)?.label}`, ts: Date.now() }
      })
      window.dispatchEvent(event)
    } catch (e: any) {
      setOutput('')
      setError(e.message || 'Invalid input for this mode')
    }
  }

  const handleModeChange = (newMode: CodeMode) => {
    setMode(newMode)
    processConvert(input, newMode)
  }

  const copyOut = () => {
    if (!output) return
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Select Tool</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {MODES.map(m => (
            <button key={m.key} onClick={() => handleModeChange(m.key)}
              className={`p-3 rounded-xl border text-left transition-all ${mode === m.key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-gray-900'}`}>
              <div className="flex items-center gap-1.5 mb-1 text-gray-700 dark:text-gray-300">
                {m.category === 'Hash' ? <Hash size={14} className={mode === m.key ? 'text-violet-600' : ''} /> : <Code size={14} className={mode === m.key ? 'text-violet-600' : ''} />}
                <span className={`text-sm font-semibold ${mode === m.key ? 'text-violet-700 dark:text-violet-300' : ''}`}>{m.label}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col h-full space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Input</label>
          <textarea
            value={input}
            onChange={(e) => processConvert(e.target.value, mode)}
            placeholder="Paste your code or text here..."
            className="flex-grow min-h-[300px] p-4 text-sm font-mono leading-relaxed rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col h-full space-y-2 relative">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Output</label>
          <div className="relative flex-grow">
            <textarea
              readOnly
              value={error ? '' : output}
              placeholder="Result will appear here..."
              className={`w-full h-full min-h-[300px] p-4 text-sm font-mono leading-relaxed rounded-xl border ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200'} focus:outline-none resize-y`}
              spellCheck={false}
            />
            {error && (
              <div className="absolute inset-0 p-4 flex items-start text-red-600 dark:text-red-400 font-medium whitespace-pre-wrap pointer-events-none">
                <Info size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
          {output && !error && (
            <button onClick={copyOut}
              className="absolute top-8 right-2 p-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-violet-100 dark:hover:bg-violet-900/50 backdrop-blur rounded-lg transition-colors border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 shadow-sm"
              title="Copy to clipboard">
              {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
