import { JoinClient } from "@/components/growth/JoinClient";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; email?: string }>;
}) {
  const { ref: refCode, email } = await searchParams;
  const code = refCode?.trim() ?? undefined;
  const emailParam = email?.trim() ?? undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-12">
      <JoinClient refCode={code} emailParam={emailParam} />
    </div>
  );
}
