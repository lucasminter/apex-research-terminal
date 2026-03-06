export const dynamic = 'force-dynamic';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return (
    <div style={{ padding: 12, height: '100vh', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Apex Research Terminal</h2>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Experience: {experienceId}</div>
      </div>

      <iframe
        src="/research/index.html"
        style={{
          width: '100%',
          height: 'calc(100vh - 60px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          background: 'white',
        }}
        title="Research Terminal"
      />
    </div>
  );
}
