import { Metadata } from 'next'
import EditMediaPageContent from './EditMediaPageContent'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  void id
  return {
    title: `Edit Media`,
    description: 'Edit and resubmit your media submission for review.',
  }
}

export default async function EditMediaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // NOTE: id is a UUID string — do NOT cast to Number
  return <EditMediaPageContent id={id} />
}
