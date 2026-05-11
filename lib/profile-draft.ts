/** `profiles.id` from the access request (POST /api/send-request). */
export const PENDING_PROFILE_ID_KEY = 'sokiwrld_pending_profile_id';

export function isProfileDraftUuid(value: string | null): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}
