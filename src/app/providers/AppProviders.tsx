import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '../auth/AuthProvider'
import { ErrorFallback } from '../../components/ErrorFallback'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
})

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AuthProvider>{children}</AuthProvider>
    </ErrorBoundary>
    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
  </QueryClientProvider>
)
