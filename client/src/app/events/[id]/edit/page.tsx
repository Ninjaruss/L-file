import { Metadata } from 'next'
import EditEventPageContent from './EditEventPageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Edit Event #${id}`,
    description: 'Edit and resubmit your event for review.',
  }
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <EditEventPageContent id={Number(id)} />
}
