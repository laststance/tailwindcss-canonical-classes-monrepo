import Link from 'next/link'
import {
  IconForms,
  IconNavigation,
  IconBell,
  IconTable,
  IconLayout,
} from '@tabler/icons-react'

const categories = [
  {
    name: 'Forms',
    href: '/showcase/forms',
    icon: IconForms,
    count: 18,
    description: 'Buttons, inputs, checkboxes, selects, and more',
  },
  {
    name: 'Navigation',
    href: '/showcase/navigation',
    icon: IconNavigation,
    count: 9,
    description: 'Menus, tabs, breadcrumbs, and pagination',
  },
  {
    name: 'Feedback',
    href: '/showcase/feedback',
    icon: IconBell,
    count: 10,
    description: 'Alerts, dialogs, toasts, and tooltips',
  },
  {
    name: 'Data Display',
    href: '/showcase/data-display',
    icon: IconTable,
    count: 11,
    description: 'Cards, tables, charts, and calendars',
  },
  {
    name: 'Layout',
    href: '/showcase/layout-components',
    icon: IconLayout,
    count: 8,
    description: 'Separators, scroll areas, and resizable panels',
  },
]

/**
 * Showcase index page.
 * Lists all component categories with descriptions.
 */
export default function ShowcasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Component Showcase</h1>
        <p className="text-muted-foreground mt-2">
          Browse all {50} shadcn/ui components organized by category.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.href}
              href={category.href}
              className="group hover:border-accent hover:bg-accent/5 flex flex-col gap-2 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-md">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="group-hover:text-accent font-semibold">
                    {category.name}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {category.count} components
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {category.description}
              </p>
            </Link>
          )
        })}
      </div>

      <div className="bg-muted/50 rounded-lg border p-4">
        <h3 className="font-medium">Keyboard Shortcuts</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Press{' '}
          <kbd className="bg-background rounded border px-1.5 py-0.5 font-mono text-xs">
            ⌘K
          </kbd>{' '}
          to search components quickly.
        </p>
      </div>
    </div>
  )
}
