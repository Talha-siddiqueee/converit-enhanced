import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed'

const CATEGORIES: Category[] = ['length', 'weight', 'temperature', 'area', 'volume', 'speed']

const UNITS: Record<Category, { label: string; key: string }[]> = {
  length: [
    { label: 'Millimeter (mm)', key: 'mm' },
    { label: 'Centimeter (cm)', key: 'cm' },
    { label: 'Meter (m)', key: 'm' },
    { label: 'Kilometer (km)', key: 'km' },
    { label: 'Inch (in)', key: 'in' },
    { label: 'Foot (ft)', key: 'ft' },
    { label: 'Yard (yd)', key: 'yd' },
    { label: 'Mile (mi)', key: 'mi' },
  ],
  weight: [
    { label: 'Milligram (mg)', key: 'mg' },
    { label: 'Gram (g)', key: 'g' },
    { label: 'Kilogram (kg)', key: 'kg' },
    { label: 'Metric Ton (t)', key: 't' },
    { label: 'Ounce (oz)', key: 'oz' },
    { label: 'Pound (lb)', key: 'lb' },
  ],
  temperature: [
    { label: 'Celsius (°C)', key: 'c' },
    { label: 'Fahrenheit (°F)', key: 'f' },
    { label: 'Kelvin (K)', key: 'k' },
  ],
  area: [
    { label: 'sq mm (mm²)', key: 'mm2' },
    { label: 'sq cm (cm²)', key: 'cm2' },
    { label: 'sq m (m²)', key: 'm2' },
    { label: 'sq km (km²)', key: 'km2' },
    { label: 'sq in (in²)', key: 'in2' },
    { label: 'sq ft (ft²)', key: 'ft2' },
    { label: 'Acre', key: 'ac' },
    { label: 'Hectare (ha)', key: 'ha' },
  ],
  volume: [
    { label: 'Milliliter (mL)', key: 'ml' },
    { label: 'Liter (L)', key: 'l' },
    { label: 'Cubic meter (m³)', key: 'm3' },
    { label: 'US fluid oz', key: 'floz' },
    { label: 'US Cup', key: 'cup' },
    { label: 'US Pint (pt)', key: 'pt' },
    { label: 'US Gallon (gal)', key: 'gal' },
  ],
  speed: [
    { label: 'm/s', key: 'ms' },
    { label: 'km/h', key: 'kmh' },
    { label: 'mph', key: 'mph' },
    { label: 'knot', key: 'kn' },
    { label: 'ft/s', key: 'fts' },
  ],
}

// Convert everything to a base unit first
const TO_BASE: Record<string, (v: number) => number> = {
  // length → meters
  mm: v => v / 1000, cm: v => v / 100, m: v => v, km: v => v * 1000,
  in: v => v * 0.0254, ft: v => v * 0.3048, yd: v => v * 0.9144, mi: v => v * 1609.344,
  // weight → grams
  mg: v => v / 1000, g: v => v, kg: v => v * 1000, t: v => v * 1e6, oz: v => v * 28.3495, lb: v => v * 453.592,
  // temperature → celsius (special)
  c: v => v, f: v => (v - 32) / 1.8, k: v => v - 273.15,
  // area → m²
  mm2: v => v / 1e6, cm2: v => v / 1e4, m2: v => v, km2: v => v * 1e6,
  in2: v => v * 6.4516e-4, ft2: v => v * 0.092903, ac: v => v * 4046.86, ha: v => v * 10000,
  // volume → liters
  ml: v => v / 1000, l: v => v, m3: v => v * 1000, floz: v => v * 0.0295735,
  cup: v => v * 0.236588, pt: v => v * 0.473176, gal: v => v * 3.78541,
  // speed → m/s
  ms: v => v, kmh: v => v / 3.6, mph: v => v * 0.44704, kn: v => v * 0.514444, fts: v => v * 0.3048,
}

const FROM_BASE: Record<string, (v: number) => number> = {
  mm: v => v * 1000, cm: v => v * 100, m: v => v, km: v => v / 1000,
  in: v => v / 0.0254, ft: v => v / 0.3048, yd: v => v / 0.9144, mi: v => v / 1609.344,
  mg: v => v * 1000, g: v => v, kg: v => v / 1000, t: v => v / 1e6, oz: v => v / 28.3495, lb: v => v / 453.592,
  c: v => v, f: v => v * 1.8 + 32, k: v => v + 273.15,
  mm2: v => v * 1e6, cm2: v => v * 1e4, m2: v => v, km2: v => v / 1e6,
  in2: v => v / 6.4516e-4, ft2: v => v / 0.092903, ac: v => v / 4046.86, ha: v => v / 10000,
  ml: v => v * 1000, l: v => v, m3: v => v / 1000, floz: v => v / 0.0295735,
  cup: v => v / 0.236588, pt: v => v / 0.473176, gal: v => v / 3.78541,
  ms: v => v, kmh: v => v * 3.6, mph: v => v / 0.44704, kn: v => v / 0.514444, fts: v => v / 0.3048,
}

function doConvert(value: number, from: string, to: string): number {
  const base = TO_BASE[from](value)
  return FROM_BASE[to](base)
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1e9 || (Math.abs(n) < 0.0001 && n !== 0)) return n.toExponential(6)
  return parseFloat(n.toPrecision(10)).toString()
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')
  const [inputVal, setInputVal] = useState('1')

  const units = UNITS[category]

  const changeCategory = (cat: Category) => {
    setCategory(cat)
    setFromUnit(UNITS[cat][0].key)
    setToUnit(UNITS[cat][1]?.key || UNITS[cat][0].key)
    setInputVal('1')
  }

  const result = (() => {
    const v = parseFloat(inputVal)
    if (isNaN(v)) return '—'
    return fmt(doConvert(v, fromUnit, toUnit))
  })()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => changeCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${category === cat ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
          <select
            value={fromUnit}
            onChange={e => setFromUnit(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
          >
            {units.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
          </select>
          <input
            type="number"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-lg font-mono"
          />
        </div>

        <div className="flex justify-center">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-full text-violet-600 dark:text-violet-400">
            <ArrowRight size={22} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
          <select
            value={toUnit}
            onChange={e => setToUnit(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm"
          >
            {units.map(u => <option key={u.key} value={u.key}>{u.label}</option>)}
          </select>
          <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-lg font-mono min-h-[44px]">
            {result}
          </div>
        </div>
      </div>

      <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-xl">
        <p className="text-sm text-violet-800 dark:text-violet-300 font-mono text-center">
          {inputVal} {units.find(u => u.key === fromUnit)?.label} = {result} {units.find(u => u.key === toUnit)?.label}
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">All conversions for {inputVal} {units.find(u => u.key === fromUnit)?.label}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {units.map(u => {
            const v = parseFloat(inputVal)
            const val = isNaN(v) ? '—' : fmt(doConvert(v, fromUnit, u.key))
            return (
              <div key={u.key} className={`px-3 py-2 rounded-lg border text-sm ${u.key === toUnit ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-600' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">{u.label}</p>
                <p className="font-mono font-medium text-gray-800 dark:text-gray-200 truncate">{val}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
