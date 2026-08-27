import Image from "next/image";
import { adminAvatar, adminInitials, adminName } from "@/lib/admin-config";

/**
 * The signed-in admin's photo, always a circle.
 *
 * The portrait is a full-length seated shot, so dropping it straight into a
 * 44px circle would leave a face the size of a full stop. Anchoring it to the
 * top of its box and scaling from that same edge crops the circle to head and
 * shoulders instead — the same photo, read as an avatar rather than a shrunken
 * poster. The numbers were picked against the image itself; a different
 * portrait would want its own.
 *
 * `sizes` asks for an image wide enough for the largest circle at the zoom
 * above, so the 96px avatar on the profile page is not upscaled from a
 * thumbnail. Sizing is otherwise left to the caller, so one component can be
 * an 80px block on a profile and a 40px chip in the header.
 */
export default function AdminAvatar({
  admin,
  className = "h-10 w-10",
  sizes = "256px",
  priority = false,
}) {
  const src = adminAvatar(admin);

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full border border-black/10 bg-footer ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={adminName(admin)}
          fill
          sizes={sizes}
          priority={priority}
          className="origin-top scale-[2] object-cover object-top"
        />
      ) : (
        // No photo configured at all — initials keep the circle from reading
        // as a broken image.
        <span className="font-nav absolute inset-0 flex items-center justify-center text-[0.7em] font-bold tracking-[0.06em] text-navy uppercase">
          {adminInitials(admin)}
        </span>
      )}
    </span>
  );
}
