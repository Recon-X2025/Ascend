import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma/client";

export const runtime = "edge";
export const alt = "Job posting on Ascend";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params;
  const job = await prisma.jobPost.findUnique({
    where: { slug },
    select: {
      title: true,
      locations: true,
      type: true,
      companyRef: { select: { name: true, logo: true } },
    },
  });

  if (!job) {
    return new ImageResponse(
      (
        <div
          style={{
            background: "#0c0c0f",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#a0a0b8",
            fontSize: 24,
          }}
        >
          Job not found
        </div>
      ),
      { ...size }
    );
  }

  const companyName = job.companyRef?.name ?? "Company";
  const location = job.locations?.[0] ?? "India";

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c0c0f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 60,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ color: "#6366f1", fontSize: 28, fontWeight: 600 }}>{companyName}</div>

        <div
          style={{
            color: "#e0e0f0",
            fontSize: 56,
            fontWeight: 800,
            lineHeight: 1.15,
            maxWidth: "80%",
          }}
        >
          {job.title}
        </div>

        <div style={{ display: "flex", gap: 24, color: "#a0a0b8", fontSize: 24 }}>
          <span>{location}</span>
          <span>·</span>
          <span>{job.type.replace(/_/g, " ")}</span>
          <span>·</span>
          <span style={{ color: "#e0e0f0", fontWeight: 600 }}>Ascend</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
