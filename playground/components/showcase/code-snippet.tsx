'use client'

import { useState } from 'react'
import {
  IconCopy,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface CodeSnippetProps {
  code: string
  language?: string
  collapsible?: boolean
  defaultOpen?: boolean
  className?: string
}

/**
 * Code snippet component with copy functionality.
 * Optionally collapsible for long code blocks.
 */
export function CodeSnippet({
  code,
  language = 'tsx',
  collapsible = false,
  defaultOpen = false,
  className,
}: CodeSnippetProps) {
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const codeBlock = (
    <div className={cn('relative', className)}>
      <pre className="bg-muted overflow-x-auto rounded-md p-4 text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 size-8"
        onClick={copyToClipboard}
        aria-label="Copy code"
      >
        {copied ? (
          <IconCheck className="size-4 text-green-500" />
        ) : (
          <IconCopy className="size-4" />
        )}
      </Button>
    </div>
  )

  if (!collapsible) {
    return codeBlock
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 w-full justify-between"
        >
          <span className="text-muted-foreground text-xs">
            {isOpen ? 'Hide code' : 'Show code'}
          </span>
          {isOpen ? (
            <IconChevronUp className="size-4" />
          ) : (
            <IconChevronDown className="size-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>{codeBlock}</CollapsibleContent>
    </Collapsible>
  )
}
