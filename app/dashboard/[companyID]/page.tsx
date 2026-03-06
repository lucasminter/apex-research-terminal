import { redirect } from 'next/navigation';

export default async function Page({
  params,
}: {
  params: Promise<{ companyID: string }>;
}) {
  await params;
  redirect('/research/index.html');
}
