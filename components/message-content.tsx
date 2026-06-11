'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/code-block'
import { Mermaid } from '@/components/mermaid'

const TRUNCATE_CHARS = 4000

export function MessageContent({ content }: { content: string }) {
  const isLong = content.length > TRUNCATE_CHARS
  const [expanded, setExpanded] = useState(!isLong)

  const visible = expanded ? content : content.slice(0, TRUNCATE_CHARS)

  return (
    <div className="prose-chat">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const lang = match?.[1]
            const raw = String(children).replace(/\n$/, '')
            const isInline = !className && !raw.includes('\n')

            if (isInline) {
              return (
                <code
                  className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-accent"
                  {...props}
                >
                  {children}
                </code>
              )
            }

            if (lang === 'mermaid') {
              return <Mermaid chart={raw} />
            }

            return <CodeBlock code={raw} language={lang || 'text'} />
          },
          pre({ children }) {
            return <>{children}</>
          },
          table({ children }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            )
          },
          th({ children }) {
            return (
              <th className="border-b border-border bg-secondary/50 px-3 py-2 text-left font-medium">
                {children}
              </th>
            )
          },
          td({ children }) {
            return (
              <td className="border-b border-border/50 px-3 py-2 align-top">
                {children}
              </td>
            )
          },
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2"
              >
                {children}
              </a>
            )
          },
        }}
      >
        {visible}
      </ReactMarkdown>

      {isLong && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
        >
          Ver resposta completa ({Math.round(content.length / 1000)}k caracteres)
        </button>
      )}
    </div>
  )
}
