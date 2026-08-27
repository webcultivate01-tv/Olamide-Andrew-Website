/**
 * Settings for the admin panel chrome.
 *
 * These are read from NEXT_PUBLIC_* variables so the panel can be pointed at a
 * different timezone or a different owner without touching a component. They
 * are inlined into the client bundle at build time, which is fine — none of it
 * is secret, it is the same information the header already paints on screen.
 */

/**
 * Every timezone Canada actually uses, ordered east to west.
 *
 * The admin header is read by someone working Canadian hours, so it shows
 * Canadian time rather than whatever the browser happens to be set to — a
 * laptop travelling, or a machine left on the wrong clock, must not change
 * what "today" means on an enquiry.
 */
export const CANADA_TIMEZONES = [
  { value: "America/St_Johns", label: "Newfoundland" },
  { value: "America/Halifax", label: "Atlantic" },
  { value: "America/Toronto", label: "Eastern" },
  { value: "America/Winnipeg", label: "Central" },
  { value: "America/Regina", label: "Saskatchewan" },
  { value: "America/Edmonton", label: "Mountain" },
  { value: "America/Vancouver", label: "Pacific" },
];

// Set NEXT_PUBLIC_ADMIN_TIMEZONE to any value above. Eastern is the default
// because it is where most of the country's clock-watching happens.
export const ADMIN_TIMEZONE =
  process.env.NEXT_PUBLIC_ADMIN_TIMEZONE || "America/Toronto";

export const timezoneLabel = (timeZone = ADMIN_TIMEZONE) =>
  CANADA_TIMEZONES.find((zone) => zone.value === timeZone)?.label || timeZone;

// The admins table has no name or photo column yet, so both fall back to the
// site owner. The moment the API starts returning `name` / `avatarUrl` on the
// admin object, the helpers below pick them up with no other change.
const FALLBACK_NAME = process.env.NEXT_PUBLIC_ADMIN_NAME || "Olamide";
const FALLBACK_AVATAR = process.env.NEXT_PUBLIC_ADMIN_AVATAR || "/olamide.png";

export const adminName = (admin) => admin?.name || FALLBACK_NAME;

export const adminAvatar = (admin) => admin?.avatarUrl || FALLBACK_AVATAR;

// "admin" is what the database stores; "Administrator" is what a person reads.
const ROLE_LABELS = {
  admin: "Administrator",
  superadmin: "Super Administrator",
  editor: "Editor",
};

export const adminRole = (admin) => {
  const role = admin?.role;
  if (!role) return "Administrator";
  return ROLE_LABELS[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

// Two letters for the avatar to fall back to when there is no image at all.
export const adminInitials = (admin) => {
  const source = admin?.name || admin?.email || FALLBACK_NAME;
  const words = source.split("@")[0].split(/[\s._-]+/).filter(Boolean);

  if (words.length === 0) return "A";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return (words[0][0] + words[1][0]).toUpperCase();
};
