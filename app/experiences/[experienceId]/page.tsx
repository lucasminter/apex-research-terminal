export const dynamic = "force-dynamic";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  return <pre>{experienceId}</pre>;
}
