import {
  Image as ImageIcon, FileText, Type, Ruler, Hash, DollarSign, Palette, Calculator as CalculatorIcon,
  Code, QrCode, Music, Sparkles
} from 'lucide-react'

export type CategoryKey = 'image' | 'document' | 'text' | 'code' | 'qr' | 'unit' | 'number' | 'currency' | 'color' | 'calculator' | 'media' | 'ai'

export interface Category {
  key: CategoryKey
  label: string
  description: string
  icon: React.ReactNode
  examples: string[]
  gradient: string
  iconBg: string
  badge?: string
}

export const CATEGORIES: Category[] = [
  {
    key: 'ai',
    label: 'AI Text Tools',
    description: 'Rewrite, summarize & brainstorm with Gemini AI',
    icon: <Sparkles size={26} />,
    examples: ['Rewrite Professionally', 'Summarize', 'Brainstorm', 'Fix Grammar'],
    gradient: 'from-violet-600 to-indigo-600',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    badge: 'AI',
  },
  {
    key: 'media',
    label: 'Audio/Video Tools',
    description: 'Convert MP3, MP4, WAV, and more',
    icon: <Music size={26} />,
    examples: ['MP4 → MP3', 'WAV → MP3', 'Video to Audio'],
    gradient: 'from-rose-500 to-orange-500',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
    badge: 'New',
  },
  {
    key: 'image',
    label: 'Image Converter',
    description: 'Convert and resize images between formats',
    icon: <ImageIcon size={26} />,
    examples: ['PNG → JPG', 'JPG → WebP', 'PNG → WebP', 'Resize images'],
    gradient: 'from-pink-500 to-rose-500',
    iconBg: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
  },
  {
    key: 'document',
    label: 'Document Converter',
    description: 'Word, PDF, Excel — fully operational conversions',
    icon: <FileText size={26} />,
    examples: ['Word → PDF', 'PDF → Word', 'Excel → CSV', 'HTML → PDF'],
    gradient: 'from-blue-500 to-cyan-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    badge: 'Enhanced',
  },
  {
    key: 'text',
    label: 'Text Converter',
    description: 'Convert between text and data formats',
    icon: <Type size={26} />,
    examples: ['Markdown → HTML', 'HTML → Markdown', 'JSON → CSV', 'CSV → JSON'],
    gradient: 'from-emerald-500 to-teal-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
  },
  {
    key: 'code',
    label: 'Code Tools',
    description: 'Format JSON, encode strings, hash data',
    icon: <Code size={26} />,
    examples: ['JSON ↔ YAML', 'Base64', 'MD5 / SHA', 'URL Encode'],
    gradient: 'from-blue-600 to-indigo-600',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'qr',
    label: 'QR Generator',
    description: 'Generate high-quality QR codes',
    icon: <QrCode size={26} />,
    examples: ['URL to QR', 'Text to QR', 'Custom Colors'],
    gradient: 'from-emerald-500 to-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-500',
  },
  {
    key: 'unit',
    label: 'Unit Converter',
    description: 'Convert between measurement units',
    icon: <Ruler size={26} />,
    examples: ['Length', 'Weight', 'Temperature', 'Volume & Speed'],
    gradient: 'from-orange-500 to-amber-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
  },
  {
    key: 'number',
    label: 'Number Converter',
    description: 'Convert numbers between numeral systems',
    icon: <Hash size={26} />,
    examples: ['Binary', 'Decimal', 'Hexadecimal', 'Octal'],
    gradient: 'from-violet-500 to-purple-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
  },
  {
    key: 'currency',
    label: 'Currency Converter',
    description: 'Live exchange rates for 150+ currencies',
    icon: <DollarSign size={26} />,
    examples: ['USD → EUR', 'GBP → JPY', 'Live rates', '150+ currencies'],
    gradient: 'from-yellow-500 to-lime-500',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-500',
  },
  {
    key: 'color',
    label: 'Color Converter',
    description: 'Convert and explore colors in any format',
    icon: <Palette size={26} />,
    examples: ['HEX → RGB', 'RGB → HSL', 'Color picker', 'CSS values'],
    gradient: 'from-fuchsia-500 to-pink-500',
    iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400',
  },
  {
    key: 'calculator',
    label: 'Calculator',
    description: 'Full-featured scientific calculator',
    icon: <CalculatorIcon size={26} />,
    examples: ['Add / Subtract', 'Multiply / Divide', 'Percentage', 'Toggle sign'],
    gradient: 'from-slate-500 to-gray-600',
    iconBg: 'bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400',
  },
]
