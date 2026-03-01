export const Card = ({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) => (
  <div
    className={`rounded-2xl border border-surface-700/50 bg-surface-800/40 p-6 shadow-card backdrop-blur-sm transition-all duration-300 hover:border-surface-600/50 hover:shadow-card-hover ${className}`}
    style={style}
  >
    {children}
  </div>
)
