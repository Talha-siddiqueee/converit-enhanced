import { useEffect, useState } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'

const POPULAR_CURRENCIES = [
  'USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','MXN',
  'BRL','KRW','SGD','HKD','NOK','SEK','DKK','NZD','ZAR','RUB',
]

export default function CurrencyConverter() {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [amount, setAmount] = useState('1')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const [result, setResult] = useState<number | null>(null)

  const fetchRates = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      if (!res.ok) throw new Error('Failed to fetch rates')
      const data = await res.json()
      if (data.result !== 'success') throw new Error(data['error-type'] || 'API error')
      setRates(data.rates)
      setLastUpdated(new Date(data.time_last_update_utc).toLocaleString())
    } catch (err) {
      setError(`Could not fetch exchange rates: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRates() }, [])

  useEffect(() => {
    if (!rates[from] || !rates[to]) { setResult(null); return }
    const v = parseFloat(amount)
    if (isNaN(v)) { setResult(null); return }
    // Convert: amount FROM → USD → TO
    const inUsd = v / rates[from]
    setResult(inUsd * rates[to])
  }, [amount, from, to, rates])

  const swap = () => { setFrom(to); setTo(from) }

  const currencies = Object.keys(rates).length > 0
    ? [...new Set([...POPULAR_CURRENCIES, ...Object.keys(rates)])].filter(c => rates[c])
    : POPULAR_CURRENCIES

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {lastUpdated ? `Rates updated: ${lastUpdated}` : 'Loading exchange rates…'}
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xl font-semibold"
          />
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">From</label>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={swap}
            className="mb-0.5 p-2.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors"
            title="Swap currencies"
          >
            <RefreshCw size={18} />
          </button>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To</label>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-semibold"
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {result !== null && !error && (
        <div className="p-6 bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/40 dark:to-blue-950/40 rounded-2xl border border-violet-200 dark:border-violet-800 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{amount} {from} equals</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            <span className="text-violet-600 dark:text-violet-400 ml-2">{to}</span>
          </p>
          {rates[from] && rates[to] && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              1 {from} = {(rates[to] / rates[from]).toFixed(6)} {to}
            </p>
          )}
        </div>
      )}

      {Object.keys(rates).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Popular rates vs {from}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {POPULAR_CURRENCIES.filter(c => c !== from && rates[c]).slice(0, 12).map(c => {
              const rate = rates[c] / rates[from]
              return (
                <button
                  key={c}
                  onClick={() => setTo(c)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${to === c ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30' : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700'}`}
                >
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{c}</p>
                  <p className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200">{rate.toFixed(4)}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
