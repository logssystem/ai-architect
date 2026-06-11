'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '@/components/code-block'
import { Mermaid } from '@/components/mermaid'

// Renderiza o conteúdo markdown produzido pela IA: títulos, listas, tabelas,
// blocos de código (com highlight) e diagramas Mermaid.
export function MessageContent({ content }: { content: string }) {
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
          // Evita que o react-markdown envolva nossos blocos em <pre>.
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
