/**
 * BL-20: SAML SSO — SP-initiated flow.
 * SsoConfig collected in Phase 18; this implements the handshake.
 */

import { NextRequest, NextResponse } from "next/server";

/** GET: Initiate SP-initiated SAML flow. Query: domain=company.com */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }
  // TODO: Look up SsoConfig by company domain, build SAML AuthnRequest,
  // redirect to IdP entryPoint with encoded request
  return NextResponse.json({
    ok: false,
    message: "SAML SSO not yet activated. SsoConfig exists; wire to SAML library when ready.",
  });
}
