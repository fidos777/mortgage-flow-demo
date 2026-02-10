import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const DEFAULT_EXPIRY_DAYS = 7;
const TOKEN_BYTES = 32;

interface GenerateLinkParams {
  caseId?: string | null;
  propertyId?: string | null;
  unitId?: string | null;
  createdBy: string;
  accessType?: "buyer" | "agent" | "developer" | "admin";
  scope?: "full" | "read" | "limited";
  expiryDays?: number;
  maxUses?: number | null;
  generateQR?: boolean;
}

interface GenerateLinkResult {
  success: boolean;
  data?: {
    linkId: string;
    token: string;
    tokenHash: string;
    url: string;
    qrUrl: string | null;
    expiresAt: string;
  };
  error?: string;
}

export async function generateSecureLink(
  params: GenerateLinkParams,
  baseUrl: string = "https://snang.my"
): Promise<GenerateLinkResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    caseId = null,
    propertyId = null,
    createdBy,
    accessType = "buyer",
    scope = "full",
    expiryDays = DEFAULT_EXPIRY_DAYS,
    maxUses = null,
    generateQR = true,
  } = params;

  if (!caseId && !propertyId) {
    return { success: false, error: "Either caseId or propertyId required" };
  }
  if (!createdBy) {
    return { success: false, error: "createdBy required" };
  }

  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  const now = new Date().toISOString();

  const { data: link, error } = await supabase
    .from("secure_links")
    .insert({
      token: rawToken,
      token_hash: tokenHash,
      case_id: caseId || null,
      property_id: propertyId,
      access_type: accessType,
      scope,
      expires_at: expiresAt.toISOString(),
      max_uses: maxUses,
      use_count: 0,
      created_by: createdBy,
      status: "active",
      qr_generated_at: generateQR ? now : null,
      qr_format: generateQR ? "svg" : null,
    })
    .select("id, expires_at")
    .single();

  if (error || !link) {
    console.error("[generate-link] Error:", error);
    return { success: false, error: error?.message || "Insert failed" };
  }

  const accessUrl = `${baseUrl}/q/${rawToken}`;
  const qrUrl = generateQR
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(accessUrl)}&format=svg`
    : null;

  return {
    success: true,
    data: {
      linkId: link.id,
      token: rawToken,
      tokenHash,
      url: accessUrl,
      qrUrl,
      expiresAt: link.expires_at,
    },
  };
}
