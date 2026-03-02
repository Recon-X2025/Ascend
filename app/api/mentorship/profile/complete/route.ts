import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma/client";

const M2_REQUIRED_FIELDS = [
  "fromRole",
  "fromCompanyType",
  "fromIndustry",
  "fromCity",
  "toRole",
  "toCompanyType",
  "toIndustry",
  "toCity",
  "transitionDurationMonths",
  "transitionYear",
  "keyFactor1",
  "keyFactor2",
  "keyFactor3",
  "statementTransitionMade",
  "statementWishIKnew",
  "statementCanHelpWith",
  "statementCannotHelpWith",
  "engagementPreference",
  "sessionFrequency",
  "m2FocusAreas",
  "geographyScope",
] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.mentorProfile.findUnique({
    where: { userId: session.user.id },
    include: { availabilityWindows: true },
  });

  if (!profile) {
    return NextResponse.json({
      complete: false,
      missingFields: ["profile"],
    });
  }

  const missingFields: string[] = [];

  for (const field of M2_REQUIRED_FIELDS) {
    const value = profile[field];
    if (value === null || value === undefined) {
      missingFields.push(field);
    } else if (Array.isArray(value) && value.length === 0) {
      missingFields.push(field);
    }
  }

  if (profile.geographyScope === "SPECIFIC_COUNTRIES") {
    if (!profile.geographyCountries?.length) {
      missingFields.push("geographyCountries");
    }
  }

  if (!profile.availabilityWindows?.length) {
    missingFields.push("availabilityWindows");
  }

  return NextResponse.json({
    complete: missingFields.length === 0,
    missingFields,
  });
}
