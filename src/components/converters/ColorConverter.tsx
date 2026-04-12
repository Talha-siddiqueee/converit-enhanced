import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '')
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(clean)) return null
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  return {
    r: parseInt(full.substring(0, 2), 16),
    g: parseInt(full.substring(2, 4), 16),
    b: parseInt(full.substring(4, 6), 16),
  }
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = s / 100, ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = ln - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1 rounded text-gray-400 hover:text-violet-600 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
    </button>
  )
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#7C3AED')
  const [rgb, setRgb] = useState<RGB>({ r: 124, g: 58, b: 237 })
  const [hsl, setHsl] = useState<HSL>({ h: 263, s: 83, l: 58 })
  const [hexError, setHexError] = useState('')
  const [rgbError, setRgbError] = useState('')
  const [hslError, setHslError] = useState('')

  const fromHex = (v: string) => {
    setHex(v)
    setHexError('')
    const r = hexToRgb(v)
    if (!r) { if (v.replace('#', '').length >= 3) setHexError('Invalid hex color'); return }
    setRgb(r)
    setHsl(rgbToHsl(r))
  }

  const fromRgb = (r: number, g: number, b: number) => {
    setRgbError('')
    if ([r, g, b].some(v => v < 0 || v > 255 || isNaN(v))) { setRgbError('RGB values must be 0–255'); return }
    const newRgb = { r, g, b }
    setRgb(newRgb)
    setHex(rgbToHex(newRgb))
    setHsl(rgbToHsl(newRgb))
  }

  const fromHsl = (h: number, s: number, l: number) => {
    setHslError('')
    if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) { setHslError('H: 0–360, S/L: 0–100'); return }
    const newHsl = { h, s, l }
    setHsl(newHsl)
    const newRgb = hslToRgb(newHsl)
    setRgb(newRgb)
    setHex(rgbToHex(newRgb))
  }

  const hexStr = hex.toUpperCase()
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  const cssVar = `--color: ${hexStr};`

  // Color shades
  const shades = [10, 20, 30, 40, 50, 60, 70, 80, 90].map(l => {
    const c = hslToRgb({ h: hsl.h, s: hsl.s, l })
    return { l, hex: rgbToHex(c) }
  })

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-start">
        <div
          className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-700 shadow-lg flex-shrink-0"
          style={{ backgroundColor: hex }}
        />
        <div className="flex-1">
          <input
            type="color"
            value={hex.length === 7 ? hex : '#7c3aed'}
            onChange={e => fromHex(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border-0 bg-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Click to open color picker</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HEX */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">HEX</label>
          <div className="flex items-center gap-1">
            <input
              value={hex}
              onChange={e => fromHex(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm uppercase"
            />
            <CopyBtn text={hexStr} />
          </div>
          {hexError && <p className="text-xs text-red-500">{hexError}</p>}
        </div>

        {/* RGB */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">RGB</label>
          <div className="grid grid-cols-3 gap-1">
            {(['r','g','b'] as const).map(ch => (
              <div key={ch}>
                <span className="text-xs text-gray-500 uppercase">{ch}</span>
                <input
                  type="number" min={0} max={255}
                  value={rgb[ch]}
                  onChange={e => fromRgb(ch === 'r' ? +e.target.value : rgb.r, ch === 'g' ? +e.target.value : rgb.g, ch === 'b' ? +e.target.value : rgb.b)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-mono truncate">{rgbStr}</span>
            <CopyBtn text={rgbStr} />
          </div>
          {rgbError && <p className="text-xs text-red-500">{rgbError}</p>}
        </div>

        {/* HSL */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">HSL</label>
          <div className="grid grid-cols-3 gap-1">
            {([['h','H',360],['s','S',100],['l','L',100]] as [keyof HSL, string, number][]).map(([ch, label, max]) => (
              <div key={ch}>
                <span className="text-xs text-gray-500">{label}</span>
                <input
                  type="number" min={0} max={max}
                  value={hsl[ch]}
                  onChange={e => fromHsl(ch === 'h' ? +e.target.value : hsl.h, ch === 's' ? +e.target.value : hsl.s, ch === 'l' ? +e.target.value : hsl.l)}
                  className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 font-mono truncate">{hslStr}</span>
            <CopyBtn text={hslStr} />
          </div>
          {hslError && <p className="text-xs text-red-500">{hslError}</p>}
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">CSS Values</h4>
        <div className="space-y-1">
          {[
            { label: 'HEX', value: hexStr },
            { label: 'RGB', value: rgbStr },
            { label: 'HSL', value: hslStr },
            { label: 'CSS Var', value: cssVar },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 w-12">{row.label}</span>
              <code className="text-xs font-mono text-gray-800 dark:text-gray-200 flex-1 px-2">{row.value}</code>
              <CopyBtn text={row.value} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lightness Shades</h4>
        <div className="flex gap-1">
          {shades.map(({ l, hex: h }) => (
            <button
              key={l}
              onClick={() => fromHex(h)}
              title={`L: ${l}% · ${h}`}
              className="flex-1 h-10 rounded transition-transform hover:scale-110"
              style={{ backgroundColor: h }}
            />
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          {shades.map(({ l }) => (
            <p key={l} className="flex-1 text-center text-xs text-gray-500">{l}</p>
          ))}
        </div>
      </div>
    </div>
  )
}
