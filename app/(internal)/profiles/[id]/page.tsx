import { ProfileDetail } from "@/components/profiles/profile-detail";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProfileDetail id={id} />;
}
