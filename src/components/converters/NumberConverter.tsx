import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

type Base = 'decimal' | 'binary' | 'octal' | 'hex'

const BASES: { key: Base; label: string; radix: number; prefix: string }[] = [
  { key: 'decimal', label: 'Decimal (Base 10)', radix: 10, prefix: '' },
  { key: 'binary', label: 'Binary (Base 2)', radix: 2, prefix: '0b' },
  { key: 'octal', label: 'Octal (Base 8)', radix: 8, prefix: '0o' },
  { key: 'hex', label: 'Hexadecimal (Base 16)', radix: 16, prefix: '0x' },
]

function toDecimal(value: string, base: Base): bigint | null {
  const radix = BASES.find(b => b.key === base)!.radix
  const clean = value.trim().toLowerCase().replace(/^(0b|0o|0x)/, '')
  if (!clean) return null
  try {
    return BigInt(parseInt(clean, radix))
  } catch {
    return null
  }
}

function fromDecimal(n: bigint, base: Base): string {
  const radix = BASES.find(b => b.key === base)!.radix
  if (base === 'hex') return n.toString(16).toUpperCase()
  return n.toString(radix)
}

export default function NumberConverter() {
  const [activeBase, setActiveBase] = useState<Base>('decimal')
  const [values, setValues] = useState<Record<Base, string>>({
    decimal: '', binary: '', octal: '', hex: '',
  })
  const [error, setError] = useState('')

  const handleChange = (base: Base, raw: string) => {
    setActiveBase(base)
    setError('')
    const newVals: Record<Base, string> = { decimal: '', binary: '', octal: '', hex: '' }
    newVals[base] = raw

    if (!raw.trim()) { setValues(newVals); return }

    const decimal = toDecimal(raw, base)
    if (decimal === null || decimal < 0n) {
      setError(`Invalid ${base} value.`)
      newVals[base] = raw
      setValues(newVals)
      return
    }

    for (const b of BASES) {
      if (b.key !== base) {
        newVals[b.key] = fromDecimal(decimal, b.key)
      }
    }
    setValues(newVals)
  }

  const VALID_CHARS: Record<Base, RegExp> = {
    decimal: /^[0-9]*$/,
    binary: /^[01]*$/,
    octal: /^[0-7]*$/,
    hex: /^[0-9a-fA-F]*$/,
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BASES.map(b => (
          <div key={b.key} className={`p-4 rounded-xl border-2 transition-colors ${activeBase === b.key ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-700'}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{b.label}</label>
            <div className="flex items-center gap-2">
              {b.prefix && (
                <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{b.prefix}</span>
              )}
              <input
                type="text"
                value={values[b.key]}
                onChange={e => {
                  if (VALID_CHARS[b.key].test(e.target.value) || e.target.value === '') {
                    handleChange(b.key, e.target.value)
                  }
                }}
                placeholder={b.key === 'hex' ? 'e.g. FF' : b.key === 'binary' ? 'e.g. 1010' : b.key === 'octal' ? 'e.g. 17' : 'e.g. 42'}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-mono text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {values.decimal && !error && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Conversion Summary</h4>
          <div className="grid grid-cols-2 gap-3">
            {BASES.map(b => (
              <div key={b.key} className="space-y-0.5">
                <p className="text-xs text-gray-500 dark:text-gray-400">{b.label}</p>
                <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 break-all">
                  {b.prefix}{values[b.key] || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Quick Reference</h4>
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(n => (
            <div key={n} className="text-center p-1.5 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
              <p className="font-mono font-bold text-blue-700 dark:text-blue-300">{n}</p>
              <p className="text-gray-500">{n.toString(2).padStart(4,'0')}</p>
              <p className="text-gray-500">{n.toString(16).toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
