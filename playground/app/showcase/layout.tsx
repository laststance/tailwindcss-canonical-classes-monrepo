import { ShowcaseNav } from '@/components/showcase/nav'
import { ThemeToggle } from '@/components/showcase/theme-toggle'
import { ComponentSearch } from '@/components/showcase/search'

/**
 * Layout for showcase pages.
 * Includes sidebar navigation, search, and theme toggle.
 */
export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="bg-card sticky top-0 hidden h-screen w-64 shrink-0 border-r p-4 md:block">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Components</h1>
            <ThemeToggle />
          </div>
          <ComponentSearch />
          <div className="flex-1 overflow-y-auto">
            <ShowcaseNav />
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="bg-background/95 fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
        <h1 className="text-lg font-semibold">Components</h1>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="flex-1 pt-14 md:pt-0">
        <div className="container max-w-4xl py-8">{children}</div>
      </main>
    </div>
  )
}
