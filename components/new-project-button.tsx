'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createProject } from '@/app/actions/projects'
import { Button } from '@/components/ui/button'

export function NewProjectButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const project = await createProject()
      router.push(`/dashboard/${project.id}`)
    })
  }

  return (
    <Button onClick={handleClick} disabled={isPending} className="gap-2">
      <Plus className="size-4" />
      {isPending ? 'Criando...' : 'Nova sessão'}
    </Button>
  )
}
