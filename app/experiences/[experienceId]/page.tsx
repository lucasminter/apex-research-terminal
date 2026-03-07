import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// NOTE: The beforeFiles rewrite in next.config.ts serves /research/index.html
// directly at this URL (no iframe, no redirect). This page only runs if the
// rewrite is somehow bypassed.
export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;
  redirect('/research/index.html');
}
