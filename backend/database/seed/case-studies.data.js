// The four case studies the website shipped with, lifted word for word out of
// the page component they used to live in.
//
// They sit in their own file because two things seed them: the MySQL seed
// script next to this one, and the SQLite stand-in in dev-sqlite/, which has
// no MySQL to run that script against. One copy, two callers.
//
// The images are the files already in frontend/public/case-studies, so these
// rows point at the website's own folder rather than at an upload. Anything
// added through the admin panel from now on will be an upload instead.
export const CASE_STUDIES = [
  {
    title: "Patches",
    slug: "patches",
    client: "Patches",
    service: "Brand identity",
    summary:
      "Repositioning a SaaS startup for Series A growth with a bold, modern identity system.",
    imageUrl: "/case-studies/Patches.png",
    imageAlt: "Patches branded burger box packaging",
    sortOrder: 0,
  },
  {
    title: "Skyline Finance",
    slug: "skyline-finance",
    client: "Skyline Finance",
    service: "Launch campaign",
    summary:
      "Launch campaign for a fintech platform making investing accessible to everyone.",
    imageUrl: "/case-studies/Skyline.png",
    imageAlt: "Skyline Finance campaign wrapped around a corner billboard",
    sortOrder: 1,
  },
  {
    title: "Lumina Wellness",
    slug: "lumina-wellness",
    client: "Lumina Wellness",
    service: "Brand identity",
    summary:
      "Creating a serene brand identity for a wellness startup focused on mindful living.",
    imageUrl: "/case-studies/Lumina.png",
    imageAlt: "Client receiving a facial treatment at a Lumina Wellness studio",
    sortOrder: 2,
  },
  {
    title: "Atlas Construction Group",
    slug: "atlas-construction-group",
    client: "Atlas Construction Group",
    service: "Brand activation",
    summary:
      "Launch campaign for a fintech platform making investing accessible to everyone.",
    imageUrl: "/case-studies/Atlas.png",
    imageAlt: "ACG signage fixed to a construction site hoarding",
    sortOrder: 3,
  },
];
