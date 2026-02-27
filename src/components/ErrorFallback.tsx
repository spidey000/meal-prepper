import type { FallbackProps } from 'react-error-boundary'
import { Button } from './ui/Button'

export const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
    <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
    <p className="mt-2 max-w-md text-sm text-slate-500">{error instanceof Error ? error.message : String(error)}</p>
    <Button className="mt-4" onClick={resetErrorBoundary}>
      Try again
    </Button>
  </div>
)
