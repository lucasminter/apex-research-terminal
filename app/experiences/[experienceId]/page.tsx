export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  await params;

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <iframe
        src="/research/index.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Apex Research Terminal"
        allow="fullscreen"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
