export default function ExperiencePage({
  params,
}: {
  params: { experienceId: string }
}) {
  return (
    <div style={{ padding: 40 }}>
      <h1>Apex Research Terminal</h1>

      <p>Experience ID:</p>

      <pre>{params.experienceId}</pre>

      <p>Your terminal UI will go here.</p>
    </div>
  )
}