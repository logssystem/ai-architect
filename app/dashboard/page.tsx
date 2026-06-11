import { redirect } from 'next/navigation'
import { getProjects } from '@/app/actions/projects'
import { NewProjectButton } from '@/components/new-project-button'

export default async function DashboardPage() {
  const projects = await getProjects()

  if (projects[0]) {
    redirect(`/dashboard/${projects[0].id}`)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 font-mono text-xl font-bold text-primary">
        AI
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Bem-vindo ao AI Solutions Architect</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Crie sua primeira sessão e descreva a necessidade de negócio que você quer resolver.
        </p>
      </div>
      <NewProjectButton />
    </div>
  )
}
