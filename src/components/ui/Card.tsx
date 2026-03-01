import React from 'react'

export const Card = React.memo<{
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}>(({ children, className = '', style }) => (
  <div
    className={`rounded-2xl border border-surface-700/50 bg-surface-800/40 p-6 shadow-card transition-all duration-300 hover:border-surface-600/50 hover:shadow-card ${className}`}
    style={style}
  >
    {children}
  </div>
))

Card.displayName = 'Card'
