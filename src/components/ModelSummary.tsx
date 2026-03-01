import clsx from 'clsx'
import type { OpenRouterModelMetadata } from '../types/app'

interface ModelSummaryProps {
  modelId: string
  metadata?: OpenRouterModelMetadata
  className?: string
  size?: 'sm' | 'md'
}

const sizeStyles = {
  sm: 'text-[11px]',
  md: 'text-xs',
}

export const ModelSummary = ({ modelId, metadata, className, size = 'md' }: ModelSummaryProps) => {
  const label = metadata?.label ?? modelId
  const context = metadata?.contextLength
  const prompt = metadata?.pricing?.prompt
  const completion = metadata?.pricing?.completion
  const modality = metadata?.modality ?? metadata?.tokenizer

  return (
    <div className={clsx('flex flex-wrap items-center gap-2 text-slate-500', sizeStyles[size], className)}>
      <span className="font-semibold text-slate-900">{label}</span>
      {metadata?.isFree && (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Free tier</span>
      )}
      {context && <span>Context {context.toLocaleString()} tokens</span>}
      {typeof prompt === 'number' && (
        <span>Prompt ${formatPrice(prompt)}</span>
      )}
      {typeof completion === 'number' && (
        <span>Completion ${formatPrice(completion)}</span>
      )}
      {modality && <span>{modality}</span>}
    </div>
  )
}

const formatPrice = (value: number) => {
  if (value === 0) return '0'
  if (value < 0.01) {
    return value.toPrecision(2)
  }
  return value.toFixed(2)
}
