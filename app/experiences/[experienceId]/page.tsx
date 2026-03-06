export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params; // required by Next.js 15

  return (
    <iframe
      src="/research/index.html"
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        border: 'none', display: 'block',
      }}
      title="Apex Research Terminal"
    />
  );
}
