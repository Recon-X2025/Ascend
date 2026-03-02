import { MentorProfileClient } from "@/components/mentorship/MentorProfileClient";

export default async function MentorProfilePage({
  params,
}: {
  params: Promise<{ mentorId: string }>;
}) {
  const { mentorId } = await params;
  return <MentorProfileClient mentorId={mentorId} />;
}
