export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>
}) {
  const { experienceId } = await params;

  return (
    <div style={{ padding: 40 }}>
      <h1>Apex Research Terminal</h1>

      <p>Experience ID:</p>

      <pre>{experienceId}</pre>

      <p>Your terminal UI will go here.</p>
    </div>
  );
}