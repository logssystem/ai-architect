'use client'

import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'

// Bloco de código com syntax highlighting (Shiki) e botão de copiar.
export function CodeBlock({
  code,
  language,
}: {
  code: string
  language: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function highlight() {
      try {
        const out = await codeToHtml(code, {
          lang: language || 'text',
          theme: 'github-dark-default',
        })
        if (!cancelled) setHtml(out)
      } catch {
        // Linguagem desconhecida: cai no texto puro.
        if (!cancelled) setHtml(null)
      }
    }
    highlight()
    return () => {
      cancelled = true
    }
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Copiar código"
        >
          {copied ? (
            <>
              <Check className="size-3" /> Copiado
            </>
          ) : (
            <>
              <Copy className="size-3" /> Copiar
            </>
          )}
        </button>
      </div>
      {html ? (
        <div
          className={cn(
            'overflow-x-auto p-3 text-sm [&_pre]:!bg-transparent [&_pre]:!m-0',
          )}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="overflow-x-auto p-3 text-sm">
          <code className="font-mono">{code}</code>
        </pre>
      )}
    </div>
  )
}
