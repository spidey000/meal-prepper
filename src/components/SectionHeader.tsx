interface SectionHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export const SectionHeader = ({ title, description, actions }: SectionHeaderProps) => (
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4">
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {actions}
  </div>
)
