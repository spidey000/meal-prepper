interface SectionHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export const SectionHeader = ({ title, description, actions }: SectionHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-surface-700/50 pb-6">
    <div>
      <h2 className="font-display text-2xl font-semibold text-surface-100">{title}</h2>
      {description && <p className="mt-2 text-sm text-surface-400">{description}</p>}
    </div>
    {actions}
  </div>
)
