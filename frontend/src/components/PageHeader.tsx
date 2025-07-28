interface PageHeaderProps {
  title: string
  actions?: React.ReactNode
  subtitle?: string
}

export function PageHeader({ title, actions, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
