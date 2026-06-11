import Link from 'next/link'
import { ArrowRight, CheckCircle, Code2, Database, GitBranch } from 'lucide-react'

const STEPS = [
  'Escuta Inicial',
  'Levantamento de Requisitos',
  'Validação e Confirmação',
  'Arquitetura',
  'Modelagem de Dados',
  'Especificação de APIs',
  'Geração de Código',
  'Testes e Validação',
  'DevOps e Deploy',
  'Entrega Final',
]

const FEATURES = [
  {
    icon: CheckCircle,
    title: 'Fluxo estruturado em 10 etapas',
    description:
      'Do levantamento de requisitos até a entrega final com código, arquitetura e deploy prontos.',
  },
  {
    icon: Code2,
    title: 'Código real e funcional',
    description:
      'Nada de pseudocódigo. Gera código que compila, testes e configuração de ambiente.',
  },
  {
    icon: Database,
    title: 'Modelagem de dados completa',
    description:
      'Diagrama ER, script SQL, índices recomendados e schema pronto para produção.',
  },
  {
    icon: GitBranch,
    title: 'DevOps e CI/CD inclusos',
    description:
      'Dockerfile, Docker Compose, pipeline GitHub Actions e checklist de deploy.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
            AI
          </div>
          <span className="font-semibold tracking-tight">Solutions Architect</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Entrar
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar grátis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
          <span className="inline-block size-1.5 rounded-full bg-primary" />
          Powered by AI
        </div>
        <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Transforme necessidades de negócio em{' '}
          <span className="text-primary">projetos técnicos completos</span>
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-pretty text-lg text-muted-foreground">
          Um arquiteto de soluções AI que conduz sessões estruturadas e entrega arquitetura,
          modelagem, código e deploy prontos para produção.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar agora
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight">
          Tudo que um projeto precisa, gerado automaticamente
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="size-4 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">
          Fluxo de 10 etapas
        </h2>
        <p className="mb-10 text-center text-sm text-muted-foreground">
          Cada sessão segue um protocolo rigoroso. Nenhuma etapa é pulada.
        </p>
        <div className="relative">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-border" />
          <div className="flex flex-col gap-4">
            {STEPS.map((step, i) => (
              <div key={step} className="relative flex items-center gap-4 pl-10">
                <div className="absolute left-0 flex size-8 items-center justify-center rounded-full border border-border bg-background text-xs font-medium">
                  {i + 1}
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-10">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">
            Pronto para gerar seu próximo projeto?
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Descreva sua necessidade e receba arquitetura, código e deploy em minutos.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Criar conta grátis
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        AI Solutions Architect — Powered by Claude
      </footer>
    </div>
  )
}
