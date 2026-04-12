/**
 * MediaConverter — Dual-Engine Audio/Video Converter
 *
 * Engine A (Primary): Pure-JS Web Audio API
 *   WAV  → manual 44-byte header + raw PCM (always works)
 *   MP3  → lamejs encoder (pure JS, no WASM)
 *   OGG  → MediaRecorder API (browser-native)
 *   WebM → MediaRecorder API (browser-native)
 *
 * Engine B (Power, optional): FFmpeg WASM
 *   Used for video conversion and advanced codecs
 *   Falls back gracefully if COOP/COEP headers aren't active
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Download, Music, Film, AlertCircle, CheckCircle,
  ArrowRight, Settings2, Cpu, Zap, RefreshCw, Volume2,
} from 'lucide-react'
// @ts-ignore — lamejs has no bundled types
import lamejs from 'lamejs'

/* ── Types ─────────────────────────────────────── */
type AudioFmt = 'mp3' | 'wav' | 'ogg' | 'webm'
type VideoFmt = 'mp4' | 'webm' | 'avi' | 'mkv'
type TargetFmt = AudioFmt | VideoFmt

type Engine = 'webAudio' | 'ffmpeg'
type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error'

interface ConversionState {
  status: Status
  progress: number
  message: string
  error: string
  engine: Engine
  ffmpegAvailable: boolean
}

/* ── WAV encoder ───────────────────────────────── */
function encodeWav(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const bitsPerSample = 16
  const numSamples = audioBuffer.length

  // Interleave channels → Int16
  const interleaved = new Int16Array(numSamples * numChannels)
  for (let ch = 0; ch < numChannels; ch++) {
    const data = audioBuffer.getChannelData(ch)
    for (let i = 0; i < numSamples; i++) {
      interleaved[i * numChannels + ch] = Math.max(-1, Math.min(1, data[i])) * 0x7fff
    }
  }

  // Build WAV header (44 bytes)
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = interleaved.byteLength
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const write = (off: number, str: string) =>
    [...str].forEach((c, i) => view.setUint8(off + i, c.charCodeAt(0)))
  const u16 = (off: number, v: number) => view.setUint16(off, v, true)
  const u32 = (off: number, v: number) => view.setUint32(off, v, true)

  write(0,  'RIFF');  u32(4, 36 + dataSize)
  write(8,  'WAVE');  write(12, 'fmt ')
  u32(16, 16);        u16(20, 1)  // PCM
  u16(22, numChannels); u32(24, sampleRate)
  u32(28, byteRate);  u16(32, blockAlign)
  u16(34, bitsPerSample); write(36, 'data')
  u32(40, dataSize)

  new Uint8Array(buffer, 44).set(new Uint8Array(interleaved.buffer))
  return new Blob([buffer], { type: 'audio/wav' })
}

/* ── MP3 encoder via lamejs ────────────────────── */
function encodeMp3(
  audioBuffer: AudioBuffer,
  kbps: number,
  onProgress: (p: number) => void,
): Blob {
  const sampleRate = audioBuffer.sampleRate
  const numChannels = audioBuffer.numberOfChannels
  const leftF32 = audioBuffer.getChannelData(0)
  const rightF32 = numChannels > 1 ? audioBuffer.getChannelData(1) : leftF32
  const totalSamples = audioBuffer.length

  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps)
  const chunks: Int8Array[] = []
  const chunkSize = 1152  // lamejs frame size

  const toS16 = (f32: Float32Array, start: number, len: number): Int16Array => {
    const s = new Int16Array(len)
    for (let i = 0; i < len; i++) {
      s[i] = Math.max(-32768, Math.min(32767, Math.round(f32[start + i] * 32767)))
    }
    return s
  }

  for (let i = 0; i < totalSamples; i += chunkSize) {
    const len = Math.min(chunkSize, totalSamples - i)
    const left  = toS16(leftF32,  i, len)
    const right = toS16(rightF32, i, len)
    const buf = numChannels > 1
      ? encoder.encodeBuffer(left, right)
      : encoder.encodeBuffer(left)
    if (buf.length > 0) chunks.push(buf)
    if (i % (chunkSize * 50) === 0) {
      onProgress(Math.round((i / totalSamples) * 90))
    }
  }

  const flush = encoder.flush()
  if (flush.length > 0) chunks.push(flush)

  return new Blob(chunks.map(c => c.buffer as ArrayBuffer), { type: 'audio/mp3' })
}

/* ── MediaRecorder encoder (OGG / WebM) ────────── */
async function encodeViaMediaRecorder(
  audioBuffer: AudioBuffer,
  mimeType: string,
  onProgress: (p: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      // Fallback to default browser encoding
      mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        reject(new Error(`Browser doesn't support ${mimeType} encoding`))
        return
      }
    }

    const ctx = new AudioContext({ sampleRate: audioBuffer.sampleRate })
    const dest = ctx.createMediaStreamDestination()
    const src  = ctx.createBufferSource()
    src.buffer = audioBuffer
    src.connect(dest)

    const recorder = new MediaRecorder(dest.stream, { mimeType })
    const chunks: BlobPart[] = []

    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }))
      ctx.close()
    }
    recorder.onerror = (e: any) => {
      reject(new Error(`MediaRecorder error: ${e.error?.message || 'unknown'}`))
      ctx.close()
    }

    // Progress simulation
    const duration = audioBuffer.duration * 1000
    const start = Date.now()
    const ticker = setInterval(() => {
      onProgress(Math.min(85, Math.round(((Date.now() - start) / duration) * 85)))
    }, 200)

    recorder.start(250)
    src.start()
    src.onended = () => {
      clearInterval(ticker)
      recorder.stop()
    }
  })
}

/* ── Main Component ────────────────────────────── */
const AUDIO_FORMATS: { fmt: AudioFmt; label: string; engine: string }[] = [
  { fmt: 'mp3',  label: 'MP3',  engine: 'JS' },
  { fmt: 'wav',  label: 'WAV',  engine: 'JS' },
  { fmt: 'ogg',  label: 'OGG',  engine: 'JS' },
  { fmt: 'webm', label: 'WebM', engine: 'JS' },
]

const VIDEO_FORMATS: { fmt: VideoFmt; label: string; engine: string }[] = [
  { fmt: 'mp4',  label: 'MP4',  engine: 'FFmpeg' },
  { fmt: 'webm', label: 'WebM', engine: 'FFmpeg' },
  { fmt: 'avi',  label: 'AVI',  engine: 'FFmpeg' },
  { fmt: 'mkv',  label: 'MKV',  engine: 'FFmpeg' },
]

export default function MediaConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<TargetFmt>('mp3')
  const [bitrate, setBitrate] = useState(192)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [resultName, setResultName] = useState('')
  const [tabMode, setTabMode] = useState<'audio' | 'video'>('audio')
  const [state, setState] = useState<ConversionState>({
    status: 'idle',
    progress: 0,
    message: '',
    error: '',
    engine: 'webAudio',
    ffmpegAvailable: false,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const ffmpegRef = useRef<any>(null)
  const ffmpegLoadingRef = useRef(false)

  /* Check if FFmpeg/SharedArrayBuffer is available */
  useEffect(() => {
    const available = typeof SharedArrayBuffer !== 'undefined'
    setState(s => ({ ...s, ffmpegAvailable: available, status: 'ready' }))
    if (available) tryLoadFFmpeg()
  }, [])

  const tryLoadFFmpeg = async () => {
    if (ffmpegLoadingRef.current) return
    ffmpegLoadingRef.current = true
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg')
      const ff = new FFmpeg()
      const origin = window.location.origin
      await ff.load({
        coreURL: `${origin}/ffmpeg/ffmpeg-core.js`,
        wasmURL: `${origin}/ffmpeg/ffmpeg-core.wasm`,
      })
      ffmpegRef.current = ff
      setState(s => ({ ...s, ffmpegAvailable: true, engine: 'ffmpeg' }))
    } catch {
      // FFmpeg optional — pure JS engine still works
    } finally {
      ffmpegLoadingRef.current = false
    }
  }

  const setProgress = useCallback((p: number) => {
    setState(s => ({ ...s, progress: p }))
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && (f.type.startsWith('audio/') || f.type.startsWith('video/'))) {
      setFile(f)
      setResultUrl(null)
      setState(s => ({ ...s, status: 'ready', error: '', progress: 0 }))
    }
  }

  const handleConvert = async () => {
    if (!file || state.status === 'processing') return

    setState(s => ({ ...s, status: 'processing', progress: 5, error: '', message: 'Reading file…' }))
    setResultUrl(null)

    const baseName = file.name.replace(/\.[^.]+$/, '')
    const outName = `${baseName}_converted.${targetFormat}`

    try {
      // ── Video formats → need FFmpeg ──────────────
      if (VIDEO_FORMATS.some(v => v.fmt === targetFormat)) {
        // If FFmpeg is still loading, wait up to 15s for it
        if (!ffmpegRef.current && ffmpegLoadingRef.current) {
          setState(s => ({ ...s, message: 'Waiting for FFmpeg to load…', progress: 2 }))
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('FFmpeg load timed out')), 15000)
            const check = setInterval(() => {
              if (ffmpegRef.current) {
                clearInterval(check)
                clearTimeout(timeout)
                resolve()
              }
            }, 300)
          })
        }
        if (!ffmpegRef.current) {
          throw new Error('FFmpeg engine not available. Try a hard-refresh (Ctrl+Shift+R) to enable video conversion.')
        }

        await convertWithFFmpeg(file, targetFormat as VideoFmt, outName)
        return
      }

      // ── Audio formats → pure JS engine ───────────
      setState(s => ({ ...s, message: 'Decoding audio…', progress: 10 }))
      const arrayBuf = await file.arrayBuffer()
      const ctx = new AudioContext()
      let audioBuffer: AudioBuffer

      try {
        audioBuffer = await ctx.decodeAudioData(arrayBuf)
      } catch {
        throw new Error(
          'Could not decode this file. Supported input formats: MP3, WAV, OGG, M4A, AAC, FLAC, MP4 (audio track), WebM.'
        )
      } finally {
        ctx.close()
      }

      setState(s => ({ ...s, message: 'Encoding…', progress: 20 }))

      let blob: Blob

      if (targetFormat === 'wav') {
        blob = encodeWav(audioBuffer)
        setProgress(95)
      } else if (targetFormat === 'mp3') {
        setState(s => ({ ...s, message: `Encoding MP3 @ ${bitrate} kbps…` }))
        blob = encodeMp3(audioBuffer, bitrate, setProgress)
      } else {
        // ogg / webm via MediaRecorder
        const mime = targetFormat === 'ogg'
          ? 'audio/ogg; codecs=opus'
          : 'audio/webm; codecs=opus'
        setState(s => ({ ...s, message: `Encoding ${targetFormat.toUpperCase()} via browser…` }))
        blob = await encodeViaMediaRecorder(audioBuffer, mime, setProgress)
      }

      const url = URL.createObjectURL(blob)
      setResultUrl(url)
      setResultName(outName)
      setState(s => ({
        ...s, status: 'done', progress: 100,
        message: `Converted · ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        engine: 'webAudio',
      }))

      window.dispatchEvent(new CustomEvent('convertit-history', {
        detail: { action: `Media: ${file.name} → ${targetFormat.toUpperCase()}`, ts: Date.now() }
      }))

    } catch (e: any) {
      console.error(e)
      setState(s => ({
        ...s, status: 'error', progress: 0,
        error: e.message || 'Conversion failed. Please try a different format or file.',
      }))
    }
  }

  const convertWithFFmpeg = async (file: File, fmt: VideoFmt, outName: string) => {
    const { fetchFile } = await import('@ffmpeg/util')
    const ff = ffmpegRef.current
    const safeName = file.name.replace(/\s+/g, '_')
    setState(s => ({ ...s, message: 'Writing file to FFmpeg…', engine: 'ffmpeg' }))

    ff.on('progress', ({ progress }: any) => setProgress(Math.round(progress * 90)))
    await ff.writeFile(safeName, await fetchFile(file))

    const args = ['-i', safeName]
    if (fmt === 'webm') args.push('-c:v', 'vp8', '-c:a', 'libvorbis')
    else if (fmt === 'avi') args.push('-c:v', 'mpeg4', '-c:a', 'mp3')
    else if (fmt === 'mkv') args.push('-c:v', 'copy', '-c:a', 'copy')
    args.push(outName)

    setState(s => ({ ...s, message: 'FFmpeg processing…' }))
    const ret = await ff.exec(args)
    if (ret !== 0) throw new Error(`FFmpeg exited with code ${ret}`)

    const data = await ff.readFile(outName) as Uint8Array
    const blob = new Blob([data.buffer as ArrayBuffer], { type: `video/${fmt}` })
    const url = URL.createObjectURL(blob)

    setResultUrl(url)
    setResultName(outName)
    setState(s => ({
      ...s, status: 'done', progress: 100,
      message: `Converted · ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
      engine: 'ffmpeg',
    }))

    ff.deleteFile(safeName).catch(() => {})
    ff.deleteFile(outName).catch(() => {})

    window.dispatchEvent(new CustomEvent('convertit-history', {
      detail: { action: `Media: ${file.name} → ${fmt.toUpperCase()}`, ts: Date.now() }
    }))
  }

  const reset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setFile(null)
    setResultUrl(null)
    setResultName('')
    setState(s => ({ ...s, status: 'ready', progress: 0, error: '', message: '' }))
  }

  const isVideoFmt = VIDEO_FORMATS.some(v => v.fmt === targetFormat)

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Engine Status Badge ────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
          <Zap size={11} />
          Web Audio Engine · Always Available
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
          state.ffmpegAvailable
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
        }`}>
          <Cpu size={11} />
          FFmpeg Engine · {state.ffmpegAvailable ? 'Loaded ✓' : 'Not Available'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        {/* ── Left: File + Status ─────────────── */}
        <div className="space-y-4">

          {/* Drop Zone */}
          {!file ? (
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-rose-400 dark:hover:border-rose-500 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-14 text-center cursor-pointer transition-all hover:bg-rose-50/50 dark:hover:bg-rose-900/10 group"
            >
              <div className="flex justify-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music size={28} className="text-rose-500" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:scale-110 transition-transform" style={{ transitionDelay: '50ms' }}>
                  <Film size={28} className="text-violet-500" />
                </div>
              </div>
              <p className="text-gray-900 dark:text-white font-bold text-lg">Drop a media file here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Audio: MP3, WAV, OGG, FLAC, M4A, AAC &nbsp;·&nbsp; Video: MP4, WebM, AVI, MKV
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">or click to browse</p>
              <input
                ref={inputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setFile(e.target.files[0])
                    setResultUrl(null)
                    setState(s => ({ ...s, status: 'ready', error: '', progress: 0 }))
                  }
                }}
              />
            </div>
          ) : (
            <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/50 p-4 rounded-xl flex items-center justify-between animate-fade-in-up">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                  {file.type.startsWith('video/') ? (
                    <Film className="text-violet-500" size={22} />
                  ) : (
                    <Music className="text-rose-500" size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || 'media'}</p>
                </div>
              </div>
              <button onClick={reset} className="ml-3 text-sm text-red-500 hover:text-red-700 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0">
                Remove
              </button>
            </div>
          )}

          {/* Error */}
          {state.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl flex flex-col gap-2 text-sm animate-fade-in-up">
              <div className="flex gap-2 items-start font-medium">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {state.error}
              </div>
              <button
                onClick={() => setState(s => ({ ...s, error: '' }))}
                className="self-start text-xs font-semibold text-red-600 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Processing */}
          {state.status === 'processing' && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3 animate-fade-in-up">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
                  <span className="w-4 h-4 border-2 border-rose-400 border-t-rose-600 rounded-full animate-spin inline-block" />
                  {state.message || 'Processing…'}
                </div>
                <span className="text-rose-600 font-bold">{state.progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500 rounded-full"
                  style={{ width: `${state.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-600">
                Engine: {state.engine === 'ffmpeg' ? '⚡ FFmpeg WASM' : '🎵 Web Audio API'}
              </p>
            </div>
          )}

          {/* Done */}
          {state.status === 'done' && resultUrl && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center gap-4 text-center animate-scale-in">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">Conversion Complete!</h3>
                <p className="text-sm text-gray-500 mt-1">{state.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{resultName}</p>
              </div>

              {/* Audio preview */}
              {!isVideoFmt && (
                <div className="w-full bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1.5">
                    <Volume2 size={12} />
                    Preview
                  </div>
                  <audio controls className="w-full h-8" src={resultUrl} />
                </div>
              )}

              <div className="flex gap-3 w-full">
                <a
                  href={resultUrl}
                  download={resultName}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors btn-press"
                >
                  <Download size={18} /> Download
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors btn-press"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Settings Panel ──────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-5 h-fit shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
            <Settings2 size={16} className="text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Conversion Settings</h3>
          </div>

          {/* Audio / Video tab */}
          <div>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-3">
              {(['audio', 'video'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setTabMode(t)
                    setTargetFormat(t === 'audio' ? 'mp3' : 'mp4')
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    tabMode === t
                      ? 'bg-rose-500 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {t === 'audio' ? '🎵 Audio' : '🎬 Video'}
                </button>
              ))}
            </div>

            {tabMode === 'video' && !state.ffmpegAvailable && (
              <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 mb-3 flex gap-1.5 items-start">
                <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                Video conversion needs FFmpeg. Try a hard-refresh (Ctrl+Shift+R) to enable it.
              </div>
            )}

            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Output Format
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(tabMode === 'audio' ? AUDIO_FORMATS : VIDEO_FORMATS).map(({ fmt, label, engine }) => (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  className={`py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all relative ${
                    targetFormat === fmt
                      ? 'bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40 scale-[1.02]'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                  <span className={`absolute top-0.5 right-0.5 text-[8px] font-bold opacity-60 ${targetFormat === fmt ? 'text-white' : 'text-gray-400'}`}>
                    {engine}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Bitrate (audio MP3/OGG) */}
          {['mp3', 'ogg'].includes(targetFormat) && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                MP3 Bitrate
              </label>
              <div className="space-y-2">
                {[{ v: 128, l: '128 kbps — Standard' }, { v: 192, l: '192 kbps — High' }, { v: 320, l: '320 kbps — Studio' }].map(({ v, l }) => (
                  <button
                    key={v}
                    onClick={() => setBitrate(v)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      bitrate === v
                        ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                    }`}
                  >
                    {bitrate === v ? '● ' : '○ '}{l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Convert button */}
          <button
            id="media-convert-btn"
            onClick={handleConvert}
            disabled={!file || state.status === 'processing'}
            className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md shadow-rose-200 dark:shadow-rose-900/30 btn-press"
          >
            {state.status === 'processing' ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Converting…
              </>
            ) : (
              <>
                Convert Now <ArrowRight size={18} />
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            Audio converts instantly · No upload required
          </p>
        </div>
      </div>
    </div>
  )
}
