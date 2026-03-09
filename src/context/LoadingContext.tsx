import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface LoadingContextValue {
  isLoading: boolean
  setLoading: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextValue | null>(null)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error('useLoading must be used inside LoadingProvider')
  return ctx
}
