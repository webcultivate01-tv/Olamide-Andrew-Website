// Categories now come from the admin panel (GET /api/categories) rather than
// being hard-coded here, so this file no longer holds the list itself - only
// the coloring and matching logic the grid needs to display it.
//
// A category has no color of its own in the database - the admin panel only
// manages a name and a slug - so one is assigned by position instead. That is
// what lets a fourth category, added from the panel, get a color automatically
// rather than falling back to "unstyled" the moment the site outgrows the
// original three.
const PALETTE = [
  { dot: "bg-green", badge: "bg-green" },
  { dot: "bg-navy", badge: "bg-navy" },
  { dot: "bg-accent", badge: "bg-accent" },
  { dot: "bg-muted", badge: "bg-muted" },
  { dot: "bg-foreground/80", badge: "bg-foreground/80" },
];

// Categories, in the order the API returned them, each with a color from the
// palette above. Wrapping the list once here means every place that needs a
// dot or a badge class reads it off the category instead of re-deriving it.
export const withPalette = (categories = []) =>
  categories.map((category, index) => ({
    ...category,
    // The API calls it `name`; every place this list is rendered expects
    // `label`, the same field the old hard-coded array used.
    label: category.name,
    ...PALETTE[index % PALETTE.length],
  }));

export const categoryForTags = (categories, tags = []) =>
  categories.find((category) => tags.includes(category.slug)) ?? null;

// Every card carries a badge - falling back to the post's own first tag
// (title-cased) on a neutral background when none of the known categories
// match, and to a generic label when the post has no tags at all, rather than
// showing no badge.
export const displayCategory = (categories, tags = []) => {
  const known = categoryForTags(categories, tags);
  if (known) return known;

  const [first] = tags;
  const label = first
    ? first
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Insights";

  return { slug: first ?? "insights", label, dot: "bg-muted", badge: "bg-foreground/80" };
};
