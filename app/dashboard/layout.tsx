import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getProjects } from '@/app/actions/projects'
import { Sidebar } from '@/components/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const projects = await getProjects()

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-60 shrink-0">
        <Sidebar projects={projects} userName={session.user.name} />
      </div>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
