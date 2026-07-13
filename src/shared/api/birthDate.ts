// Age from an ISO birth date (YYYY-MM-DD) — the profile stores the derived
// age (public), the birth date itself lives in users/{uid}/private/account.
export const computeAgeFromBirthDate = (isoDate: string): number | null => {
  const birth = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
};
