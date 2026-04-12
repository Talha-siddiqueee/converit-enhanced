import { useReducer, useState } from 'react'

interface State {
  display: string
  expression: string
  previousValue: string | null
  operation: string | null
  overwrite: boolean
  memory: number
}

type Action =
  | { type: 'ADD_DIGIT'; digit: string }
  | { type: 'CHOOSE_OPERATION'; operation: string }
  | { type: 'EVALUATE' }
  | { type: 'CLEAR' }
  | { type: 'DELETE_DIGIT' }
  | { type: 'PERCENT' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'SCIENTIFIC'; fn: string }
  | { type: 'MEMORY_STORE' }
  | { type: 'MEMORY_RECALL' }
  | { type: 'MEMORY_CLEAR' }

function evalBinary(a: string, b: string, op: string): string {
  const x = parseFloat(a), y = parseFloat(b)
  if (isNaN(x) || isNaN(y)) return 'Error'
  let r: number
  switch (op) {
    case '+': r = x + y; break
    case '−': r = x - y; break
    case '×': r = x * y; break
    case '÷': if (y === 0) return 'Error'; r = x / y; break
    case 'xʸ': r = Math.pow(x, y); break
    default: return b
  }
  const rounded = parseFloat(r.toPrecision(12))
  return String(rounded)
}

function applyScientific(val: string, fn: string): string {
  const x = parseFloat(val)
  if (isNaN(x)) return 'Error'
  let r: number
  switch (fn) {
    case 'sin': r = Math.sin((x * Math.PI) / 180); break
    case 'cos': r = Math.cos((x * Math.PI) / 180); break
    case 'tan': r = Math.tan((x * Math.PI) / 180); break
    case 'sin⁻¹': r = (Math.asin(x) * 180) / Math.PI; break
    case 'cos⁻¹': r = (Math.acos(x) * 180) / Math.PI; break
    case 'tan⁻¹': r = (Math.atan(x) * 180) / Math.PI; break
    case 'log': if (x <= 0) return 'Error'; r = Math.log10(x); break
    case 'ln': if (x <= 0) return 'Error'; r = Math.log(x); break
    case '√': if (x < 0) return 'Error'; r = Math.sqrt(x); break
    case 'x²': r = x * x; break
    case '1/x': if (x === 0) return 'Error'; r = 1 / x; break
    case 'π': r = Math.PI; break
    case 'e': r = Math.E; break
    case '10ˣ': r = Math.pow(10, x); break
    case 'eˣ': r = Math.exp(x); break
    case 'n!': {
      if (x < 0 || !Number.isInteger(x)) return 'Error'
      r = 1; for (let i = 2; i <= x; i++) r *= i
      break
    }
    default: return val
  }
  const rounded = parseFloat(r.toPrecision(12))
  return String(rounded)
}

const initialState: State = {
  display: '0',
  expression: '',
  previousValue: null,
  operation: null,
  overwrite: false,
  memory: 0,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_DIGIT': {
      if (state.display === 'Error') return { ...state, display: action.digit, overwrite: false, expression: action.digit }
      if (action.digit === '.' && state.display.includes('.')) return state
      if (state.overwrite) {
        return { ...state, display: action.digit, overwrite: false }
      }
      if (state.display === '0' && action.digit !== '.') {
        return { ...state, display: action.digit }
      }
      const next = state.display + action.digit
      if (next.replace('-', '').replace('.', '').length > 16) return state
      return { ...state, display: next }
    }
    case 'CHOOSE_OPERATION': {
      if (state.display === 'Error') return state
      if (state.previousValue != null && !state.overwrite) {
        const result = evalBinary(state.previousValue, state.display, state.operation!)
        if (result === 'Error') return { ...initialState, display: 'Error' }
        return {
          ...state,
          display: result,
          previousValue: result,
          operation: action.operation,
          overwrite: true,
          expression: `${result} ${action.operation}`,
        }
      }
      return {
        ...state,
        previousValue: state.display,
        operation: action.operation,
        overwrite: true,
        expression: `${state.display} ${action.operation}`,
      }
    }
    case 'EVALUATE': {
      if (state.previousValue == null || state.operation == null || state.overwrite) return state
      const result = evalBinary(state.previousValue, state.display, state.operation)
      return {
        display: result,
        expression: `${state.previousValue} ${state.operation} ${state.display} =`,
        previousValue: null,
        operation: null,
        overwrite: true,
        memory: state.memory,
      }
    }
    case 'SCIENTIFIC': {
      const result = applyScientific(state.display, action.fn)
      return {
        ...state,
        display: result,
        expression: `${action.fn}(${state.display}) =`,
        overwrite: true,
      }
    }
    case 'CLEAR':
      return { ...initialState, memory: state.memory }
    case 'DELETE_DIGIT': {
      if (state.display === 'Error' || state.overwrite) return { ...state, display: '0', overwrite: false }
      if (state.display.length === 1 || (state.display.length === 2 && state.display.startsWith('-'))) return { ...state, display: '0' }
      return { ...state, display: state.display.slice(0, -1) }
    }
    case 'PERCENT': {
      if (state.display === 'Error') return state
      const val = parseFloat(state.display)
      if (isNaN(val)) return state
      return { ...state, display: String(parseFloat((val / 100).toPrecision(12))), overwrite: true }
    }
    case 'TOGGLE_SIGN': {
      if (state.display === 'Error' || state.display === '0') return state
      return {
        ...state,
        display: state.display.startsWith('-') ? state.display.slice(1) : '-' + state.display,
      }
    }
    case 'MEMORY_STORE':
      return { ...state, memory: parseFloat(state.display) || 0 }
    case 'MEMORY_RECALL':
      return { ...state, display: String(state.memory), overwrite: true }
    case 'MEMORY_CLEAR':
      return { ...state, memory: 0 }
    default:
      return state
  }
}

function formatDisplay(value: string) {
  if (value === 'Error') return 'Error'
  if (value.includes('e')) return value
  if (value.includes('.') && value.endsWith('.')) return value
  const num = parseFloat(value)
  if (isNaN(num)) return value
  if (value.includes('.')) {
    const [int, dec] = value.split('.')
    const formattedInt = parseInt(int).toLocaleString('en-US')
    const trimmed = dec ? dec.replace(/0+$/, '') : ''
    return trimmed ? `${formattedInt}.${trimmed}` : formattedInt
  }
  return num.toLocaleString('en-US', { maximumFractionDigits: 10 })
}

interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'digit' | 'operator' | 'function' | 'equals' | 'clear' | 'memory'
  wide?: boolean
  active?: boolean
  small?: boolean
}

function CalcButton({ label, onClick, variant = 'digit', wide, active, small }: ButtonProps) {
  const base = `relative flex items-center justify-center rounded-xl font-semibold transition-all duration-150 select-none cursor-pointer
    active:scale-95 active:brightness-110
    before:absolute before:inset-0 before:rounded-xl before:opacity-0 before:transition-opacity
    hover:before:opacity-100`

  const variantStyles: Record<string, string> = {
    digit: `bg-gradient-to-b from-[#393c44] to-[#2c2f35] text-white/90
            shadow-[0_4px_0_#1a1c20,0_1px_3px_rgba(0,0,0,0.6)]
            hover:from-[#44474f] hover:to-[#373a41]`,
    operator: `bg-gradient-to-b from-[#f5a623] to-[#d4861c] text-white
              shadow-[0_4px_0_#a86010,0_1px_3px_rgba(0,0,0,0.6)]
              hover:from-[#f7b43f] hover:to-[#e09020]`,
    function: `bg-gradient-to-b from-[#2a2d35] to-[#1e2128] text-[#9ba3b8]
              shadow-[0_3px_0_#13151a,0_1px_2px_rgba(0,0,0,0.5)]
              hover:from-[#30333c] hover:to-[#242730] hover:text-white`,
    equals: `bg-gradient-to-b from-[#f5a623] to-[#d4861c] text-white
             shadow-[0_4px_0_#a86010,0_1px_3px_rgba(0,0,0,0.6)]
             hover:from-[#f7b43f] hover:to-[#e09020]`,
    clear: `bg-gradient-to-b from-[#e64543] to-[#c73533] text-white
            shadow-[0_4px_0_#8b1f1e,0_1px_3px_rgba(0,0,0,0.6)]
            hover:from-[#ee5553] hover:to-[#d44340]`,
    memory: `bg-gradient-to-b from-[#1e6b9e] to-[#155480] text-white/90 text-xs
             shadow-[0_3px_0_#0d3a57,0_1px_2px_rgba(0,0,0,0.5)]
             hover:from-[#2278b0] hover:to-[#1a6090]`,
  }

  const displayLabel = active
    ? `<span style="color:#ffd580;">${label}</span>`
    : label

  return (
    <button
      onClick={onClick}
      className={`${base} ${variantStyles[variant]} ${wide ? 'col-span-2' : ''} ${small ? 'text-xs' : variant === 'function' ? 'text-sm' : 'text-lg'} h-12`}
      dangerouslySetInnerHTML={active ? { __html: displayLabel } : undefined}
    >
      {!active ? label : undefined}
    </button>
  )
}

export default function Calculator() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [shiftMode, setShiftMode] = useState(false)

  const isActive = (op: string) => state.operation === op && state.overwrite

  const scientificFn = (fn: string) => dispatch({ type: 'SCIENTIFIC', fn })

  const displayValue = formatDisplay(state.display)
  const displaySize = displayValue.length > 14 ? 'text-2xl' : displayValue.length > 10 ? 'text-3xl' : 'text-4xl'

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Calculator Body */}
      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, #1a1d23 0%, #12141a 100%)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.05) inset, 0 -1px 0 rgba(0,0,0,0.5) inset',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Top branding strip */}
        <div className="px-6 pt-4 pb-1 flex items-center justify-between">
          <span className="text-[10px] text-gray-600 font-bold tracking-[0.2em] uppercase">ConvertIt Sci-Pro</span>
          <div className="flex gap-1 items-center">
            {state.memory !== 0 && (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded font-bold tracking-wider">MEM</span>
            )}
            <span className="text-[10px] text-gray-600 font-mono">{shiftMode ? 'INV' : 'DEG'}</span>
          </div>
        </div>

        {/* LCD Screen */}
        <div
          className="mx-5 mb-4 rounded-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0d1610 0%, #0a1209 100%)',
            boxShadow: '0 0 0 1px rgba(0,200,50,0.1), inset 0 2px 8px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,160,30,0.03)',
          }}
        >
          {/* Expression row */}
          <div className="px-4 pt-3 pb-1 text-right min-h-[24px] overflow-hidden">
            <span
              className="text-xs font-mono tracking-wide truncate block"
              style={{ color: 'rgba(80,200,60,0.5)', textShadow: '0 0 8px rgba(50,200,50,0.3)' }}
            >
              {state.expression || '\u00A0'}
            </span>
          </div>
          {/* Main display */}
          <div className="px-4 pb-4 text-right">
            <span
              className={`font-mono tracking-tight leading-none ${displaySize} transition-all duration-100`}
              style={{
                color: state.display === 'Error' ? '#ff6b6b' : 'rgba(140,255,100,0.95)',
                textShadow: state.display === 'Error'
                  ? '0 0 20px rgba(255,80,80,0.8)'
                  : '0 0 20px rgba(100,255,70,0.6), 0 0 40px rgba(60,200,40,0.3)',
              }}
            >
              {displayValue}
            </span>
          </div>
        </div>

        {/* Button Grid */}
        <div className="px-4 pb-5 space-y-2">

          {/* Row 0: Memory */}
          <div className="grid grid-cols-5 gap-2">
            <CalcButton label="MC" onClick={() => dispatch({ type: 'MEMORY_CLEAR' })} variant="memory" small />
            <CalcButton label="MR" onClick={() => dispatch({ type: 'MEMORY_RECALL' })} variant="memory" small />
            <CalcButton label="M+" onClick={() => dispatch({ type: 'MEMORY_STORE' })} variant="memory" small />
            <CalcButton label="INV" onClick={() => setShiftMode(s => !s)} variant="memory" active={shiftMode} small />
            <CalcButton label="⌫" onClick={() => dispatch({ type: 'DELETE_DIGIT' })} variant="function" small />
          </div>

          {/* Row 1: Scientific top row */}
          <div className="grid grid-cols-5 gap-2">
            <CalcButton label={shiftMode ? 'sin⁻¹' : 'sin'} onClick={() => scientificFn(shiftMode ? 'sin⁻¹' : 'sin')} variant="function" small />
            <CalcButton label={shiftMode ? 'cos⁻¹' : 'cos'} onClick={() => scientificFn(shiftMode ? 'cos⁻¹' : 'cos')} variant="function" small />
            <CalcButton label={shiftMode ? 'tan⁻¹' : 'tan'} onClick={() => scientificFn(shiftMode ? 'tan⁻¹' : 'tan')} variant="function" small />
            <CalcButton label={shiftMode ? 'eˣ' : 'ln'} onClick={() => scientificFn(shiftMode ? 'eˣ' : 'ln')} variant="function" small />
            <CalcButton label={shiftMode ? '10ˣ' : 'log'} onClick={() => scientificFn(shiftMode ? '10ˣ' : 'log')} variant="function" small />
          </div>

          {/* Row 2: Scientific row 2 */}
          <div className="grid grid-cols-5 gap-2">
            <CalcButton label="x²" onClick={() => scientificFn('x²')} variant="function" small />
            <CalcButton label="√" onClick={() => scientificFn('√')} variant="function" small />
            <CalcButton label="1/x" onClick={() => scientificFn('1/x')} variant="function" small />
            <CalcButton label="n!" onClick={() => scientificFn('n!')} variant="function" small />
            <CalcButton label="xʸ" onClick={() => dispatch({ type: 'CHOOSE_OPERATION', operation: 'xʸ' })} variant="function" active={isActive('xʸ')} small />
          </div>

          {/* Row 3: π, e, (, ), C */}
          <div className="grid grid-cols-5 gap-2">
            <CalcButton label="π" onClick={() => scientificFn('π')} variant="function" small />
            <CalcButton label="e" onClick={() => scientificFn('e')} variant="function" small />
            <CalcButton label="+/-" onClick={() => dispatch({ type: 'TOGGLE_SIGN' })} variant="function" small />
            <CalcButton label="%" onClick={() => dispatch({ type: 'PERCENT' })} variant="function" small />
            <CalcButton label="C" onClick={() => dispatch({ type: 'CLEAR' })} variant="clear" small />
          </div>

          {/* Separator */}
          <div className="border-t border-gray-700/40 my-1" />

          {/* Row 4: 7 8 9 ÷ */}
          <div className="grid grid-cols-4 gap-2">
            <CalcButton label="7" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '7' })} variant="digit" />
            <CalcButton label="8" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '8' })} variant="digit" />
            <CalcButton label="9" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '9' })} variant="digit" />
            <CalcButton label="÷" onClick={() => dispatch({ type: 'CHOOSE_OPERATION', operation: '÷' })} variant="operator" active={isActive('÷')} />
          </div>

          {/* Row 5: 4 5 6 × */}
          <div className="grid grid-cols-4 gap-2">
            <CalcButton label="4" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '4' })} variant="digit" />
            <CalcButton label="5" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '5' })} variant="digit" />
            <CalcButton label="6" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '6' })} variant="digit" />
            <CalcButton label="×" onClick={() => dispatch({ type: 'CHOOSE_OPERATION', operation: '×' })} variant="operator" active={isActive('×')} />
          </div>

          {/* Row 6: 1 2 3 − */}
          <div className="grid grid-cols-4 gap-2">
            <CalcButton label="1" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '1' })} variant="digit" />
            <CalcButton label="2" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '2' })} variant="digit" />
            <CalcButton label="3" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '3' })} variant="digit" />
            <CalcButton label="−" onClick={() => dispatch({ type: 'CHOOSE_OPERATION', operation: '−' })} variant="operator" active={isActive('−')} />
          </div>

          {/* Row 7: 0 (wide) . = + */}
          <div className="grid grid-cols-4 gap-2">
            <CalcButton label="0" onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '0' })} variant="digit" wide />
            <CalcButton label="." onClick={() => dispatch({ type: 'ADD_DIGIT', digit: '.' })} variant="digit" />
            <CalcButton label="+" onClick={() => dispatch({ type: 'CHOOSE_OPERATION', operation: '+' })} variant="operator" active={isActive('+')} />
          </div>

          {/* Row 8: Equals full width */}
          <button
            onClick={() => dispatch({ type: 'EVALUATE' })}
            className="w-full h-12 rounded-xl font-bold text-lg text-white transition-all duration-150 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(180deg, #f5a623 0%, #d4861c 100%)',
              boxShadow: '0 4px 0 #a86010, 0 1px 3px rgba(0,0,0,0.6)',
            }}
          >
            =
          </button>

        </div>
      </div>

      {/* Bottom label */}
      <p className="text-center text-xs text-gray-500 mt-3">Scientific Calculator · Degree Mode</p>
    </div>
  )
}
