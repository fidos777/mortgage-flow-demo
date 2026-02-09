/**
 * CR-002A: Token Redirect Handler
 *
 * /q/[token]
 *
 * Validates the secure link token and redirects to buyer portal.
 * Shows loading state during validation.
 * Redirects to /link-expired on invalid tokens.
 */

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  validateToken,
  createSessionCookie,
  getDenialMessageBM,
} from '@/lib/auth/validate-token';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TokenRedirectPage({ params }: PageProps) {
  const { token } = await params;

  // Get request metadata for logging
  const headersList = await headers();
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0] ||
    headersList.get('x-real-ip') ||
    'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer') || undefined;

  // Validate the token
  const result = await validateToken(token, {
    ipAddress,
    userAgent,
    referer,
  });

  // If invalid, redirect to error page with reason
  if (!result.isValid) {
    const reason = result.denialReason || 'invalid';
    redirect(`/link-expired?reason=${reason}`);
  }

  // Create session cookie for authenticated access
  await createSessionCookie(
    result.caseId!,
    result.linkId!,
    result.accessType!
  );

  // Redirect based on access type
  const targetUrl = getTargetUrl(result.accessType!, result.caseId!, result.propertyId);
  redirect(targetUrl);
}

/**
 * Determine redirect target based on access type
 */
function getTargetUrl(
  accessType: string,
  caseId: string,
  propertyId?: string
): string {
  switch (accessType) {
    case 'buyer':
      // Redirect to buyer portal with case context
      return `/buyer?case=${caseId}`;

    case 'agent':
      // Redirect to agent case view
      return `/agent/case/${caseId}`;

    case 'developer':
      // Redirect to developer property view
      return propertyId
        ? `/developer/property/${propertyId}`
        : `/developer/cases/${caseId}`;

    default:
      // Fallback to buyer portal
      return `/buyer?case=${caseId}`;
  }
}

/**
 * Loading UI while validating token
 */
export function generateMetadata() {
  return {
    title: 'Memproses... | Snang.my',
    description: 'Sedang mengesahkan pautan anda...',
  };
}
