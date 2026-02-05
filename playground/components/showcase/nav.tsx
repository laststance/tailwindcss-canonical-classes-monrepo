'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  IconForms,
  IconNavigation,
  IconBell,
  IconTable,
  IconLayout,
} from '@tabler/icons-react'

const categories = [
  { name: 'Forms', href: '/showcase/forms', icon: IconForms, count: 18 },
  {
    name: 'Navigation',
    href: '/showcase/navigation',
    icon: IconNavigation,
    count: 9,
  },
  { name: 'Feedback', href: '/showcase/feedback', icon: IconBell, count: 10 },
  {
    name: 'Data Display',
    href: '/showcase/data-display',
    icon: IconTable,
    count: 11,
  },
  {
    name: 'Layout',
    href: '/showcase/layout-components',
    icon: IconLayout,
    count: 8,
  },
]

/**
 * Sidebar navigation component for the showcase pages.
 * Displays category links with component counts and highlights current category.
 */
export function ShowcaseNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      <Link
        href="/showcase"
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/showcase'
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        All Components
      </Link>
      <div className="bg-border my-2 h-px" />
      {categories.map((category) => {
        const Icon = category.icon
        const isActive = pathname === category.href
        return (
          <Link
            key={category.href}
            href={category.href}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {category.name}
            </span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs',
                isActive ? 'bg-background/50' : 'bg-muted',
              )}
            >
              {category.count}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
