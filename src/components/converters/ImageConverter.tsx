import { useCallback, useRef, useState } from 'react'
import { Upload, Download, Image as ImageIcon, X, AlertCircle, CheckCircle } from 'lucide-react'

type ConversionFormat = 'image/png' | 'image/jpeg' | 'image/webp'
type Mode = 'convert' | 'resize'

const FORMAT_LABELS: Record<ConversionFormat, string> = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WebP',
}

function ext(mime: ConversionFormat) {
  return mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp'
}

export default function ImageConverter() {
  const [mode, setMode] = useState<Mode>('convert')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [outputFormat, setOutputFormat] = useState<ConversionFormat>('image/jpeg')
  const [quality, setQuality] = useState(90)
  const [resizeW, setResizeW] = useState('')
  const [resizeH, setResizeH] = useState('')
  const [keepAspect, setKeepAspect] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [origSize, setOrigSize] = useState<{ w: number; h: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [dragging, setDragging] = useState(false)

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Please upload a valid image file.')
      return
    }
    setFile(f)
    setResult(null)
    setError('')
    setStatus('idle')
    const url = URL.createObjectURL(f)
    setPreview(url)
    const img = new Image()
    img.onload = () => {
      setOrigSize({ w: img.naturalWidth, h: img.naturalHeight })
      setResizeW(String(img.naturalWidth))
      setResizeH(String(img.naturalHeight))
      imgRef.current = img
    }
    img.src = url
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [])

  const onWidthChange = (v: string) => {
    setResizeW(v)
    if (keepAspect && origSize && v) {
      const ratio = origSize.h / origSize.w
      setResizeH(String(Math.round(Number(v) * ratio)))
    }
  }
  const onHeightChange = (v: string) => {
    setResizeH(v)
    if (keepAspect && origSize && v) {
      const ratio = origSize.w / origSize.h
      setResizeW(String(Math.round(Number(v) * ratio)))
    }
  }

  const convert = async () => {
    if (!file || !imgRef.current) return
    setStatus('processing')
    setError('')
    try {
      const img = imgRef.current
      const w = mode === 'resize' ? Number(resizeW) || img.naturalWidth : img.naturalWidth
      const h = mode === 'resize' ? Number(resizeH) || img.naturalHeight : img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL(outputFormat, quality / 100)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      setResult(dataUrl)
      setResultName(`${baseName}_converted.${ext(outputFormat)}`)
      setStatus('done')
    } catch {
      setError('Conversion failed. Please try a different image.')
      setStatus('error')
    }
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = resultName
    a.click()
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setStatus('idle')
    setError('')
    imgRef.current = null
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['convert', 'resize'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {m === 'convert' ? 'Format Conversion' : 'Resize Image'}
          </button>
        ))}
      </div>

      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500'}`}
        >
          <ImageIcon size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Drop an image here or click to browse</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WebP, GIF, BMP supported</p>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <ImageIcon size={18} className="text-violet-600" />
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                <p className="text-xs text-gray-500">{origSize ? `${origSize.w} × ${origSize.h}px` : ''} · {(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-red-500 transition-colors"><X size={18} /></button>
          </div>

          {preview && (
            <div className="flex justify-center">
              <img src={preview} alt="Preview" className="max-h-48 max-w-full rounded-lg border border-gray-200 dark:border-gray-700 object-contain" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Output Format</label>
              <select
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value as ConversionFormat)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
              >
                {(Object.keys(FORMAT_LABELS) as ConversionFormat[]).map(f => (
                  <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
                ))}
              </select>
            </div>
            {outputFormat === 'image/jpeg' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quality: {quality}%</label>
                <input type="range" min="10" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full accent-violet-600" />
              </div>
            )}
          </div>

          {mode === 'resize' && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Resize Dimensions</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                  <input type="number" value={resizeW} onChange={e => onWidthChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                  <input type="number" value={resizeH} onChange={e => onHeightChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <input type="checkbox" checked={keepAspect} onChange={e => setKeepAspect(e.target.checked)} className="accent-violet-600" />
                Maintain aspect ratio
              </label>
            </div>
          )}

          <button
            onClick={convert}
            disabled={status === 'processing'}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
          >
            {status === 'processing' ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : (
              <><Upload size={18} /> {mode === 'resize' ? 'Resize Image' : `Convert to ${FORMAT_LABELS[outputFormat]}`}</>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {status === 'done' && result && (
            <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle size={18} />
                <span className="font-medium">Conversion complete!</span>
              </div>
              <img src={result} alt="Result" className="max-h-40 max-w-full rounded-lg object-contain mx-auto" />
              <button
                onClick={download}
                className="w-full py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download {resultName}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
