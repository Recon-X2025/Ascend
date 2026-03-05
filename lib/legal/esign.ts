/**
 * BL-18: Aadhaar eSign — stub for post-pilot legal signing upgrade.
 * Replaces email OTP for contracts. Requires CCA/DSC or equivalent provider.
 */

export interface EsignInitParams {
  userId: string;
  contractId: string;
  documentHash: string;
  redirectUrl: string;
}

export interface EsignInitResult {
  ok: boolean;
  authUrl?: string;
  transactionId?: string;
  error?: string;
}

export interface EsignCallbackParams {
  transactionId: string;
  signedHash?: string;
  aadhaarRef?: string;
}

export interface EsignCallbackResult {
  ok: boolean;
  signedEvidence?: string;
  error?: string;
}

/** Stub: returns error — wire to actual eSign provider when keys available. */
export async function initEsign(params: EsignInitParams): Promise<EsignInitResult> {
  void params; // Used when provider is wired
  // TODO: Integrate CCA/DSC or Aadhaar-based eSign service
  // Flow: redirect to provider → user authenticates with Aadhaar → callback with signed evidence
  return {
    ok: false,
    error: "Aadhaar eSign not yet configured. Use email OTP for now.",
  };
}

/** Stub: handle callback from eSign provider. */
export async function handleEsignCallback(params: EsignCallbackParams): Promise<EsignCallbackResult> {
  void params; // Used when provider is wired
  return { ok: false, error: "Aadhaar eSign not configured" };
}
