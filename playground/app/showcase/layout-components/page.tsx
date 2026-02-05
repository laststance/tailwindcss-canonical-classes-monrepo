'use client'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="space-y-4 rounded-lg border p-4">{children}</div>
    </section>
  )
}

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`,
)

export default function LayoutComponentsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold">Layout</h1>
        <p className="text-muted-foreground mt-2">
          Layout primitives and utilities.
        </p>
      </div>

      <Section id="aspect-ratio" title="Aspect Ratio">
        <div className="w-72">
          <AspectRatio ratio={16 / 9} className="bg-muted">
            <div className="from-muted to-muted-foreground/20 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br">
              <span className="text-muted-foreground text-sm">16:9</span>
            </div>
          </AspectRatio>
        </div>
        <div className="flex gap-4">
          <div className="w-32">
            <AspectRatio ratio={1} className="bg-muted">
              <div className="from-muted to-muted-foreground/20 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br">
                <span className="text-muted-foreground text-sm">1:1</span>
              </div>
            </AspectRatio>
          </div>
          <div className="w-32">
            <AspectRatio ratio={4 / 3} className="bg-muted">
              <div className="from-muted to-muted-foreground/20 flex h-full w-full items-center justify-center rounded-md bg-gradient-to-br">
                <span className="text-muted-foreground text-sm">4:3</span>
              </div>
            </AspectRatio>
          </div>
        </div>
      </Section>

      <Section id="resizable" title="Resizable">
        <ResizablePanelGroup className="min-h-[200px] max-w-md rounded-lg border">
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Left Panel</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>
            <div className="flex h-full items-center justify-center p-6">
              <span className="font-semibold">Right Panel</span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Section>

      <Section id="scroll-area" title="Scroll Area">
        <div className="flex gap-8">
          {/* Vertical scroll */}
          <ScrollArea className="h-72 w-48 rounded-md border">
            <div className="p-4">
              <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
              {tags.map((tag) => (
                <div key={tag} className="text-sm">
                  {tag}
                  <Separator className="my-2" />
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Horizontal scroll */}
          <ScrollArea className="w-96 rounded-md border whitespace-nowrap">
            <div className="flex w-max space-x-4 p-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-muted flex h-20 w-32 shrink-0 items-center justify-center rounded-md"
                >
                  Item {i + 1}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Section>

      <Section id="separator" title="Separator">
        <div>
          <div className="space-y-1">
            <h4 className="text-sm leading-none font-medium">
              Radix Primitives
            </h4>
            <p className="text-muted-foreground text-sm">
              An open-source UI component library.
            </p>
          </div>
          <Separator className="my-4" />
          <div className="flex h-5 items-center space-x-4 text-sm">
            <div>Blog</div>
            <Separator orientation="vertical" />
            <div>Docs</div>
            <Separator orientation="vertical" />
            <div>Source</div>
          </div>
        </div>
      </Section>
    </div>
  )
}
