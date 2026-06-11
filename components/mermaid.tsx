'use client'

import { useEffect, useId, useRef, useState } from 'react'

// Renderiza um diagrama Mermaid. O mermaid é carregado dinamicamente no cliente
// para não pesar no bundle inicial e por depender de APIs de browser.
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          themeVariables: {
            background: 'transparent',
            primaryColor: '#1c2230',
            primaryBorderColor: '#3b82f6',
            lineColor: '#64748b',
            fontFamily: 'var(--font-mono)',
          },
        })
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim())
        if (!cancelled) {
          setSvg(svg)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao renderizar diagrama')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [chart, id])

  if (error) {
    // Fallback: mostra o código bruto do diagrama se a renderização falhar.
    return (
      <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/50 p-4 text-xs text-muted-foreground">
        <code>{chart}</code>
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-2 flex justify-center overflow-x-auto rounded-lg border border-border bg-secondary/30 p-4"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    >
      {!svg ? (
        <span className="text-xs text-muted-foreground">
          Renderizando diagrama...
        </span>
      ) : null}
    </div>
  )
}
