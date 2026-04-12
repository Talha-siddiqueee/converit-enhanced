import { useCallback, useRef, useState } from 'react'
import { Upload, Download, FileText, X, AlertCircle, CheckCircle, ArrowRight, File } from 'lucide-react'

type DocMode = 'docx-html' | 'docx-pdf' | 'pdf-word' | 'excel-csv' | 'excel-html' | 'html-pdf' | 'pdf-merge' | 'pdf-watermark'

const MODES: { key: DocMode; label: string; from: string; to: string; accept: string; desc: string; badge?: string }[] = [
  { key: 'docx-html', label: 'Word → HTML', from: 'DOCX', to: 'HTML', accept: '.docx', desc: 'Convert Word documents to styled HTML' },
  { key: 'docx-pdf', label: 'Word → PDF', from: 'DOCX', to: 'PDF', accept: '.docx', desc: 'Convert Word documents to PDF' },
  { key: 'pdf-word', label: 'PDF → Word', from: 'PDF', to: 'DOCX', accept: '.pdf', desc: 'Extract PDF text into Word document' },
  { key: 'excel-csv', label: 'Excel → CSV', from: 'XLSX', to: 'CSV', accept: '.xlsx,.xls,.csv', desc: 'Export spreadsheet data as CSV' },
  { key: 'excel-html', label: 'Excel → HTML', from: 'XLSX', to: 'HTML', accept: '.xlsx,.xls,.csv', desc: 'Convert spreadsheet to HTML table' },
  { key: 'html-pdf', label: 'HTML → PDF', from: 'HTML', to: 'PDF', accept: '.html,.htm', desc: 'Convert HTML files to PDF' },
  { key: 'pdf-merge', label: 'Merge PDFs', from: 'PDFs', to: 'PDF', accept: '.pdf', desc: 'Combine multiple PDFs together', badge: 'New' },
  { key: 'pdf-watermark', label: 'Watermark PDF', from: 'PDF', to: 'PDF', accept: '.pdf', desc: 'Stamp custom text onto PDF pages', badge: 'New' },
]

export default function DocumentConverter() {
  const [mode, setMode] = useState<DocMode>('docx-html')
  const [files, setFiles] = useState<File[]>([])
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultName, setResultName] = useState('')
  const [preview, setPreview] = useState('')
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentMode = MODES.find(m => m.key === mode)!

  const loadFiles = (fList: File[]) => {
    setFiles(prev => mode === 'pdf-merge' ? [...prev, ...fList] : fList.slice(0, 1))
    setResultBlob(null)
    setError('')
    setStatus('idle')
    setPreview('')
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const fList = Array.from(e.dataTransfer.files)
    if (fList.length > 0) loadFiles(fList)
  }, [mode])

  const reset = () => {
    setFiles([])
    setResultBlob(null)
    setStatus('idle')
    setError('')
    setPreview('')
    setProgress(0)
  }

  const switchMode = (m: DocMode) => { setMode(m); reset() }

  const animateProgress = (target: number) => {
    setProgress(prev => {
      if (prev >= target) return target
      return prev + Math.min(5, target - prev)
    })
  }

  const convert = async () => {
    if (files.length === 0) return
    setStatus('processing')
    setError('')
    setProgress(10)
    try {
      const file = files[0]
      const baseName = file.name.replace(/\.[^.]+$/, '')

      if (mode === 'pdf-merge') {
        if (files.length < 2) throw new Error('Please select at least 2 PDF files to merge.')
        animateProgress(20)
        const { PDFDocument } = await import('pdf-lib')
        const mergedPdf = await PDFDocument.create()
        
        for (let i = 0; i < files.length; i++) {
          const f = files[i]
          if (!f.name.toLowerCase().endsWith('.pdf')) continue
          const arrayBuffer = await f.arrayBuffer()
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          copiedPages.forEach(page => mergedPdf.addPage(page))
          animateProgress(20 + Math.floor((i / files.length) * 60))
        }
        
        const pdfBytes = await mergedPdf.save()
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
        setResultBlob(blob)
        setResultName('merged_document.pdf')
        setPreview(`Successfully merged ${files.length} PDFs.`)
      } else if (mode === 'pdf-watermark') {
        animateProgress(30)
        const { PDFDocument, rgb, degrees, StandardFonts } = await import('pdf-lib')
        const arrayBuffer = await file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        
        const pages = pdfDoc.getPages()
        for (const page of pages) {
          const { width, height } = page.getSize()
          // Center the watermark, rough heuristic for width
          const text = watermarkText || 'CONFIDENTIAL'
          const fontSize = 50
          const textWidth = font.widthOfTextAtSize(text, fontSize)
          page.drawText(text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: rgb(0.95, 0.1, 0.1),
            opacity: 0.3,
            rotate: degrees(45),
          })
        }
        
        animateProgress(70)
        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
        setResultBlob(blob)
        setResultName(`${baseName}_watermarked.pdf`)
        setPreview(`Added watermark "${watermarkText}" to ${pages.length} pages.`)
      } else if (mode === 'docx-html' || mode === 'docx-pdf') {
        animateProgress(30)
        const mammoth = (await import('mammoth')).default
        const arrayBuffer = await file.arrayBuffer()
        animateProgress(60)
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
        animateProgress(80)

        if (mode === 'docx-html') {
          const fullHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>${baseName}</title>
<style>
  body{font-family:Georgia,serif;max-width:820px;margin:2rem auto;padding:1rem 2rem;line-height:1.7;color:#1a1a1a}
  h1{font-size:2em;margin-top:1.5em;border-bottom:2px solid #e5e5e5;padding-bottom:.3em}
  h2{font-size:1.5em;margin-top:1.3em}
  h3{font-size:1.2em}
  table{border-collapse:collapse;width:100%;margin:1em 0}
  td,th{border:1px solid #ddd;padding:8px 12px}
  th{background:#f8f8f8;font-weight:600}
  p{margin:.8em 0}
  img{max-width:100%}
</style>
</head><body>${html}</body></html>`
          const blob = new Blob([fullHtml], { type: 'text/html' })
          setResultBlob(blob)
          setResultName(`${baseName}.html`)
          setPreview(html.substring(0, 600) + (html.length > 600 ? '…' : ''))
        } else {
          const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
          const { convert: htmlToText } = await import('./htmlToText')
          // Strip non-WinAnsi to prevent PDF gen crash
          const textContent = htmlToText(html).replace(/[^\x00-\xFF]/g, '')
          const pdfDoc = await PDFDocument.create()
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
          const fontSize = 11
          const margin = 60
          const lineH = fontSize * 1.6
          const pageW = 595
          const pageH = 842
          const maxW = pageW - margin * 2

          const lines: { text: string; bold?: boolean }[] = []
          for (const para of textContent.split('\n')) {
            if (!para.trim()) { lines.push({ text: '' }); continue }
            const words = para.split(' ')
            let current = ''
            for (const word of words) {
              const test = current ? `${current} ${word}` : word
              const w = font.widthOfTextAtSize(test, fontSize)
              if (w > maxW && current) { lines.push({ text: current }); current = word }
              else current = test
            }
            if (current) lines.push({ text: current })
            lines.push({ text: '' })
          }

          let page = pdfDoc.addPage([pageW, pageH])
          let y = pageH - margin
          page.drawText('ConvertIt Document', { x: margin, y: pageH - 30, size: 8, font, color: rgb(0.6, 0.6, 0.6) })
          page.drawLine({ start: { x: margin, y: pageH - 38 }, end: { x: pageW - margin, y: pageH - 38 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })

          for (const line of lines) {
            if (y < margin + lineH * 2) {
              page = pdfDoc.addPage([pageW, pageH])
              y = pageH - margin
            }
            if (line.text) {
              page.drawText(line.text, { x: margin, y, size: fontSize, font: line.bold ? boldFont : font, color: rgb(0.1, 0.1, 0.1) })
            }
            y -= lineH
          }

          const pdfBytes = await pdfDoc.save()
          const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
          setResultBlob(blob)
          setResultName(`${baseName}.pdf`)
          setPreview(textContent.substring(0, 400) + '…')
        }

      } else if (mode === 'pdf-word') {
        animateProgress(30)
        const arrayBuffer = await file.arrayBuffer()
        animateProgress(50)

        const uint8 = new Uint8Array(arrayBuffer)
        const text = new TextDecoder('latin1').decode(uint8)

        const textChunks: string[] = []
        const btRegex = /BT[\s\S]*?ET/g
        const tjRegex = /\(([^)]*)\)\s*Tj/g

        let btMatch
        while ((btMatch = btRegex.exec(text)) !== null) {
          const block = btMatch[0]
          let tjMatch
          const tjR = new RegExp(tjRegex.source, 'g')
          while ((tjMatch = tjR.exec(block)) !== null) {
            const cleaned = tjMatch[1].replace(/\\(\d{3})/g, (_: string, oct: string) => String.fromCharCode(parseInt(oct, 8)))
              .replace(/\\n/g, '\n').replace(/\\r/g, '').replace(/\\\\/g, '\\').replace(/\\'/g, "'")
            if (cleaned.trim()) textChunks.push(cleaned)
          }
        }

        animateProgress(70)
        const extractedText = textChunks.length > 0
          ? textChunks.join(' ').replace(/\s+/g, ' ').trim()
          : `[Text extraction from this PDF was limited. The file may be scanned or use non-standard encoding.]\n\nFilename: ${file.name}\nFile size: ${(file.size / 1024).toFixed(1)} KB`

        const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><meta name=ProgId content=Word.Document>
<title>${baseName}</title>
<style>
  body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.5;margin:1in;color:#000}
  p{margin:0 0 8pt}
  h1{font-size:16pt;font-weight:bold;margin:12pt 0 6pt}
</style>
</head><body>
<h1>${baseName}</h1>
${extractedText.split('\n').filter(l => l.trim()).map(l => `<p>${l.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`).join('\n')}
</body></html>`

        const blob = new Blob([wordHtml], { type: 'application/msword' })
        setResultBlob(blob)
        setResultName(`${baseName}_extracted.doc`)
        setPreview(extractedText.substring(0, 400) + (extractedText.length > 400 ? '…' : ''))

      } else if (mode === 'excel-csv' || mode === 'excel-html') {
        animateProgress(40)
        const XLSX = await import('xlsx')
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        animateProgress(70)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        if (mode === 'excel-csv') {
          const csv = XLSX.utils.sheet_to_csv(sheet)
          const blob = new Blob([csv], { type: 'text/csv' })
          setResultBlob(blob)
          setResultName(`${baseName}.csv`)
          setPreview(csv.substring(0, 500))
        } else {
          const html = XLSX.utils.sheet_to_html(sheet)
          const full = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${baseName}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:2rem;background:#f9fafb}
  table{border-collapse:collapse;width:100%;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  td,th{border:1px solid #e5e7eb;padding:8px 12px;font-size:13px}
  th{background:#f3f4f6;font-weight:600;color:#374151}
  tr:hover{background:#f9fafb}
</style></head><body>
<h2 style="font-family:system-ui;color:#111;margin-bottom:1rem">${baseName}</h2>
${html}</body></html>`
          const blob = new Blob([full], { type: 'text/html' })
          setResultBlob(blob)
          setResultName(`${baseName}.html`)
          setPreview(html.substring(0, 400))
        }

      } else if (mode === 'html-pdf') {
        animateProgress(30)
        const text = await file.text()
        animateProgress(50)
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        const { convert: htmlToText } = await import('./htmlToText')
        const textContent = htmlToText(text).replace(/[^\x00-\xFF]/g, '')
        animateProgress(70)

        const pdfDoc = await PDFDocument.create()
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontSize = 11
        const margin = 60
        const lineH = fontSize * 1.6
        const pageW = 595
        const pageH = 842
        const maxW = pageW - margin * 2

        const lines: string[] = []
        for (const para of textContent.split('\n')) {
          if (!para.trim()) { lines.push(''); continue }
          const words = para.split(' ')
          let current = ''
          for (const word of words) {
            const test = current ? `${current} ${word}` : word
            if (font.widthOfTextAtSize(test, fontSize) > maxW && current) {
              lines.push(current); current = word
            } else current = test
          }
          if (current) lines.push(current)
          lines.push('')
        }

        let page = pdfDoc.addPage([pageW, pageH])
        let y = pageH - margin

        for (const line of lines) {
          if (y < margin + lineH) { page = pdfDoc.addPage([pageW, pageH]); y = pageH - margin }
          if (line) page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.1, 0.1, 0.1) })
          y -= lineH
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
        setResultBlob(blob)
        setResultName(`${baseName}.pdf`)
        setPreview(textContent.substring(0, 400) + '…')
      }

      setProgress(100)
      setStatus('done')
    } catch (err: any) {
      console.error(err)
      setError(`Conversion failed: ${err.message || 'Please check the file format and try again.'}`)
      setStatus('error')
    }
  }

  const download = () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = resultName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Conversion Type</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {MODES.map(m => (
            <button key={m.key} onClick={() => switchMode(m.key)}
              className={`relative p-3 rounded-xl border-2 text-left transition-all ${mode === m.key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 bg-white dark:bg-gray-800/50'}`}>
              {m.badge && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">{m.badge}</span>
              )}
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${mode === m.key ? 'bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{m.from}</span>
                <ArrowRight size={12} className="text-gray-400" />
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${mode === m.key ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{m.to}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {mode === 'pdf-watermark' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Watermark Text</label>
          <input 
            type="text" 
            value={watermarkText} 
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="e.g. DRAFT or CONFIDENTIAL"
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-violet-500 outline-none text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Drop zone */}
      {files.length === 0 ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${dragging ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 scale-[1.01]' : 'border-gray-300 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
        >
          <File size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Drop your {currentMode.from} files here</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">or click to browse · {currentMode.accept}</p>
          <input ref={inputRef} multiple={mode === 'pdf-merge'} type="file" accept={currentMode.accept} className="hidden" onChange={e => e.target.files?.length && loadFiles(Array.from(e.target.files))} />
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* File Actions Top Bar */}
          {mode === 'pdf-merge' && (
            <div className="flex justify-between items-center text-sm px-1">
              <span className="font-semibold text-gray-600 dark:text-gray-400">{files.length} PDF{files.length !== 1 ? 's' : ''} queued</span>
              <button onClick={() => inputRef.current?.click()} className="text-violet-600 dark:text-violet-400 font-bold hover:underline">+ Add more files</button>
              <input ref={inputRef} multiple type="file" accept={currentMode.accept} className="hidden" onChange={e => {
                if (e.target.files?.length) loadFiles(Array.from(e.target.files))
                e.target.value = ''
              }} />
            </div>
          )}

          {/* File info array */}
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 shrink-0 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <FileText size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="truncate pr-4">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {files.length > 1 ? (
                  <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X size={18} /></button>
                ) : (
                  <button onClick={reset} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X size={18} /></button>
                )}
              </div>
            ))}
          </div>

          {/* Convert button */}
          <button onClick={convert} disabled={status === 'processing' || (mode === 'pdf-merge' && files.length < 2)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-md shadow-violet-200 dark:shadow-violet-900/30 mt-4">
            {status === 'processing' ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing {currentMode.from} → {currentMode.to}…</>
            ) : (
              <><Upload size={18} /> {mode === 'pdf-merge' ? 'Merge All PDFs' : mode === 'pdf-watermark' ? 'Add Watermark' : `Convert ${currentMode.from} → ${currentMode.to}`}</>
            )}
          </button>

          {/* Progress bar */}
          {status === 'processing' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <div><p className="font-medium">Action failed</p><p className="text-red-600/80 dark:text-red-400/80 text-xs mt-0.5">{error}</p></div>
            </div>
          )}

          {/* Success */}
          {status === 'done' && resultBlob && (
            <div className="space-y-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                <CheckCircle size={18} /> Process complete!
              </div>
              {preview && (
                <div className="text-xs bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 overflow-auto max-h-36 whitespace-pre-wrap font-mono leading-relaxed">
                  {preview}
                </div>
              )}
              <button onClick={download}
                className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <Download size={16} /> Download {resultName}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
