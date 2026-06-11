'use client'

import { useEffect, useId, useState } from 'react'

export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '')
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          suppressErrorRendering: true,
          themeVariables: {
            background: 'transparent',
            primaryColor: '#1c2230',
            primaryBorderColor: '#3b82f6',
            lineColor: '#64748b',
            fontFamily: 'var(--font-mono)',
          },
        })

        // Valida antes de renderizar para evitar erro visual do Mermaid
        await mermaid.parse(chart.trim())

        const result = await mermaid.render(`mermaid-${id}`, chart.trim())
        if (!cancelled) setSvg(result.svg)
      } catch {
        if (!cancelled) {
          setFailed(true)
          // Remove qualquer elemento de erro que o Mermaid possa ter injetado no DOM
          document.getElementById(`d${id}`)?.remove()
          document.getElementById(`mermaid-${id}`)?.remove()
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart, id])

  if (failed) {
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
        <code>{chart}</code>
      </pre>
    )
  }

  if (!svg) {
    return (
      <div className="my-2 flex justify-center rounded-lg border border-border bg-secondary/30 p-4">
        <span className="text-xs text-muted-foreground">Renderizando diagrama...</span>
      </div>
    )
  }

  return (
    <div
      className="my-2 flex justify-center overflow-x-auto rounded-lg border border-border bg-secondary/30 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
