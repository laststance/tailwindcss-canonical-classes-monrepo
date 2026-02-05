'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { IconSearch } from '@tabler/icons-react'

const components = [
  // Forms
  { name: 'Button', category: 'Forms', href: '/showcase/forms#button' },
  {
    name: 'Button Group',
    category: 'Forms',
    href: '/showcase/forms#button-group',
  },
  { name: 'Checkbox', category: 'Forms', href: '/showcase/forms#checkbox' },
  { name: 'Combobox', category: 'Forms', href: '/showcase/forms#combobox' },
  { name: 'Field', category: 'Forms', href: '/showcase/forms#field' },
  { name: 'Input', category: 'Forms', href: '/showcase/forms#input' },
  {
    name: 'Input Group',
    category: 'Forms',
    href: '/showcase/forms#input-group',
  },
  { name: 'Input OTP', category: 'Forms', href: '/showcase/forms#input-otp' },
  { name: 'Label', category: 'Forms', href: '/showcase/forms#label' },
  {
    name: 'Native Select',
    category: 'Forms',
    href: '/showcase/forms#native-select',
  },
  {
    name: 'Radio Group',
    category: 'Forms',
    href: '/showcase/forms#radio-group',
  },
  { name: 'Select', category: 'Forms', href: '/showcase/forms#select' },
  { name: 'Slider', category: 'Forms', href: '/showcase/forms#slider' },
  { name: 'Switch', category: 'Forms', href: '/showcase/forms#switch' },
  { name: 'Textarea', category: 'Forms', href: '/showcase/forms#textarea' },
  { name: 'Toggle', category: 'Forms', href: '/showcase/forms#toggle' },
  {
    name: 'Toggle Group',
    category: 'Forms',
    href: '/showcase/forms#toggle-group',
  },
  // Navigation
  {
    name: 'Breadcrumb',
    category: 'Navigation',
    href: '/showcase/navigation#breadcrumb',
  },
  {
    name: 'Command',
    category: 'Navigation',
    href: '/showcase/navigation#command',
  },
  {
    name: 'Context Menu',
    category: 'Navigation',
    href: '/showcase/navigation#context-menu',
  },
  {
    name: 'Dropdown Menu',
    category: 'Navigation',
    href: '/showcase/navigation#dropdown-menu',
  },
  {
    name: 'Menubar',
    category: 'Navigation',
    href: '/showcase/navigation#menubar',
  },
  {
    name: 'Navigation Menu',
    category: 'Navigation',
    href: '/showcase/navigation#navigation-menu',
  },
  {
    name: 'Pagination',
    category: 'Navigation',
    href: '/showcase/navigation#pagination',
  },
  {
    name: 'Sidebar',
    category: 'Navigation',
    href: '/showcase/navigation#sidebar',
  },
  { name: 'Tabs', category: 'Navigation', href: '/showcase/navigation#tabs' },
  // Feedback
  { name: 'Alert', category: 'Feedback', href: '/showcase/feedback#alert' },
  {
    name: 'Alert Dialog',
    category: 'Feedback',
    href: '/showcase/feedback#alert-dialog',
  },
  { name: 'Dialog', category: 'Feedback', href: '/showcase/feedback#dialog' },
  { name: 'Drawer', category: 'Feedback', href: '/showcase/feedback#drawer' },
  {
    name: 'Hover Card',
    category: 'Feedback',
    href: '/showcase/feedback#hover-card',
  },
  { name: 'Popover', category: 'Feedback', href: '/showcase/feedback#popover' },
  { name: 'Sheet', category: 'Feedback', href: '/showcase/feedback#sheet' },
  { name: 'Sonner', category: 'Feedback', href: '/showcase/feedback#sonner' },
  { name: 'Spinner', category: 'Feedback', href: '/showcase/feedback#spinner' },
  { name: 'Tooltip', category: 'Feedback', href: '/showcase/feedback#tooltip' },
  // Data Display
  {
    name: 'Accordion',
    category: 'Data Display',
    href: '/showcase/data-display#accordion',
  },
  {
    name: 'Avatar',
    category: 'Data Display',
    href: '/showcase/data-display#avatar',
  },
  {
    name: 'Badge',
    category: 'Data Display',
    href: '/showcase/data-display#badge',
  },
  {
    name: 'Calendar',
    category: 'Data Display',
    href: '/showcase/data-display#calendar',
  },
  {
    name: 'Card',
    category: 'Data Display',
    href: '/showcase/data-display#card',
  },
  {
    name: 'Carousel',
    category: 'Data Display',
    href: '/showcase/data-display#carousel',
  },
  {
    name: 'Chart',
    category: 'Data Display',
    href: '/showcase/data-display#chart',
  },
  {
    name: 'Collapsible',
    category: 'Data Display',
    href: '/showcase/data-display#collapsible',
  },
  {
    name: 'Progress',
    category: 'Data Display',
    href: '/showcase/data-display#progress',
  },
  {
    name: 'Skeleton',
    category: 'Data Display',
    href: '/showcase/data-display#skeleton',
  },
  {
    name: 'Table',
    category: 'Data Display',
    href: '/showcase/data-display#table',
  },
  // Layout
  {
    name: 'Aspect Ratio',
    category: 'Layout',
    href: '/showcase/layout-components#aspect-ratio',
  },
  {
    name: 'Resizable',
    category: 'Layout',
    href: '/showcase/layout-components#resizable',
  },
  {
    name: 'Scroll Area',
    category: 'Layout',
    href: '/showcase/layout-components#scroll-area',
  },
  {
    name: 'Separator',
    category: 'Layout',
    href: '/showcase/layout-components#separator',
  },
]

/**
 * Global component search dialog.
 * Opens with Cmd+K (Mac) or Ctrl+K (Windows/Linux).
 */
export function ComponentSearch() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="text-muted-foreground relative w-full justify-start text-sm sm:w-64"
        onClick={() => setOpen(true)}
      >
        <IconSearch className="mr-2 size-4" />
        <span>Search components...</span>
        <kbd className="bg-muted pointer-events-none absolute right-2 hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-xs font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search components..." />
        <CommandList>
          <CommandEmpty>No components found.</CommandEmpty>
          {['Forms', 'Navigation', 'Feedback', 'Data Display', 'Layout'].map(
            (category) => (
              <CommandGroup key={category} heading={category}>
                {components
                  .filter((c) => c.category === category)
                  .map((component) => (
                    <CommandItem
                      key={component.name}
                      onSelect={() =>
                        runCommand(() => router.push(component.href))
                      }
                    >
                      {component.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            ),
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
