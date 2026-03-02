import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { storeFile } from "@/lib/storage";
import { getMentorProfileOrThrow } from "@/lib/mentorship/verification-helpers";
import { VerificationDocumentType } from "@prisma/client";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const UPLOAD_DOC_TYPES: VerificationDocumentType[] = [
  "GOVERNMENT_ID",
  "EMPLOYMENT_PROOF",
];

export async function POST(req: Request) {
  let mentorProfileId: string;
  try {
    const profile = await getMentorProfileOrThrow();
    mentorProfileId = profile.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Mentor profile required" },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const documentTypeRaw = formData.get("documentType");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "file is required and must be a file" },
      { status: 400 }
    );
  }

  const documentType = UPLOAD_DOC_TYPES.includes(
    documentTypeRaw as VerificationDocumentType
  )
    ? (documentTypeRaw as VerificationDocumentType)
    : null;
  if (!documentType) {
    return NextResponse.json(
      { error: "documentType must be GOVERNMENT_ID or EMPLOYMENT_PROOF" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "File type must be JPEG, PNG, or PDF" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File size must be at most 5MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `mentorship/verification/${mentorProfileId}/${documentType}/${timestamp}_${safeName}`;

  const storedKey = await storeFile(key, buffer, file.type);

  let verification = await prisma.mentorVerification.findUnique({
    where: { mentorProfileId },
  });
  if (!verification) {
    verification = await prisma.mentorVerification.create({
      data: {
        mentorProfileId,
        status: "UNVERIFIED",
      },
    });
  }

  const doc = await prisma.verificationDocument.create({
    data: {
      mentorVerificationId: verification.id,
      type: documentType,
      fileUrl: storedKey,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
  });

  return NextResponse.json({
    documentId: doc.id,
    fileUrl: storedKey,
    status: verification.status,
  });
}
