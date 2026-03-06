import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;
  redirect('/research/index.html');
}
