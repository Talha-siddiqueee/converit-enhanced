import { useState, useRef, useEffect } from 'react'
import { QrCode, Download, Link } from 'lucide-react'
import QRCode from 'qrcode'

export default function QRConverter() {
  const [text, setText] = useState('https://convertit.com')
  const [colorLight, setColorLight] = useState('#ffffff')
  const [colorDark, setColorDark] = useState('#000000')
  const [iconResult, setIconResult] = useState<string | null>(null)
  const [error, setError] = useState('')

  const qrRef = useRef<HTMLCanvasElement>(null)

  const generateQR = async (value: string, dark: string, light: string) => {
    if (!qrRef.current || !value.trim()) {
      setIconResult(null)
      return
    }
    try {
      setError('')
      await QRCode.toCanvas(qrRef.current, value, {
        width: 300,
        margin: 2,
        color: { dark, light },
      })
      setIconResult(qrRef.current.toDataURL('image/png'))
      window.dispatchEvent(new CustomEvent('convertit-history', {
        detail: { action: 'Generated QR Code', ts: Date.now() }
      }))
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to generate QR code')
      setIconResult(null)
    }
  }

  // Auto-generate whenever inputs change
  useEffect(() => {
    generateQR(text, colorDark, colorLight)
  }, [text, colorDark, colorLight])

  const download = () => {
    if (!iconResult) return
    const a = document.createElement('a')
    a.href = iconResult
    a.download = `qrcode_${Date.now()}.png`
    a.click()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* Left: Controls */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <Link size={16} /> URL or Text content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full text-base p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-gray-400 min-h-[120px] resize-y"
            placeholder="Enter URL, text, or data..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorDark}
                onChange={(e) => setColorDark(e.target.value)}
                className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono uppercase">{colorDark}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={colorLight}
                onChange={(e) => setColorLight(e.target.value)}
                className="w-10 h-10 rounded border-0 bg-transparent cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-mono uppercase">{colorLight}</span>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Right: QR Preview */}
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
        {/* Hidden canvas used to render QR */}
        <canvas ref={qrRef} className="hidden" />

        {iconResult ? (
          <img
            src={iconResult}
            alt="QR Code"
            className="rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6 bg-white w-[250px] aspect-square object-contain p-2"
          />
        ) : (
          <div className="w-[250px] aspect-square flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl mb-6">
            <QrCode size={48} className="text-gray-300 dark:text-gray-600" />
          </div>
        )}

        <button
          onClick={download}
          disabled={!iconResult || !text.trim()}
          className="w-full py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 shadow-md shadow-violet-200 dark:shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} /> Download High-Res PNG
        </button>
      </div>
    </div>
  )
}
