// The four case studies the website shipped with, lifted word for word out of
// the page component they used to live in.
//
// They sit in their own file because two things seed them: the MySQL seed
// script next to this one, and the SQLite stand-in in dev-sqlite/, which has
// no MySQL to run that script against. One copy, two callers.
//
// Most images here are files already in frontend/public/case-studies, so
// those rows point at the website's own folder rather than at an upload.
// Skyline Finance is the exception: its images live in
// backend/uploads/case-studies/skyline-finance/, the same per-study upload
// folder the admin panel writes into, as a worked example of that layout.
//
// `intro` is an array of paragraphs here; the seed scripts join it with a
// blank line, the same shape the column stores and the API splits back apart.
//
// The section and promise copy below the first study is placeholder: it is
// the right shape and length for the layout, so the pages read as finished
// rather than as empty frames, but it is written to be replaced from the
// admin panel project by project.

// Every detail page is the same sequence of blocks — the one worked out for
// Skyline Finance: an opening image, a pair of brand-colour panels, two
// headed sections either side of a full-width panel, a second image, another
// colour pair, the brand promise, then a run of images closing on a
// half-width pair.
//
// Built here rather than written out once per study, because that is what
// keeps the four pages in step with each other and what a fifth study seeded
// later inherits without anyone having to remember the order.
//
// A study with only one image of its own uses it in every image slot; the
// admin panel is where the real ones get dropped in.
const detailBlocks = ({ images, colors, sections, promise }) => {
  const [first, second = first] = images;
  const [soft, brand] = colors;

  const image = (picture, layout = "FULL") => ({
    type: "IMAGE",
    layout,
    imageUrl: picture.url,
    imageAlt: picture.alt,
  });

  // A function rather than a constant: the two panels appear twice on the
  // page, and seed rows should not be two references to one object.
  const colorPair = () => [
    { type: "COLOR", layout: "HALF", colorHex: soft },
    { type: "COLOR", layout: "HALF", colorHex: brand },
  ];

  const text = ({ heading, body }, variant = "DEFAULT") => ({
    type: "TEXT",
    layout: "FULL",
    variant,
    heading,
    body,
  });

  return [
    image(second),
    ...colorPair(),
    text(sections[0]),
    { type: "COLOR", layout: "FULL", colorHex: brand },
    text(sections[1]),
    image(first),
    ...colorPair(),
    text(promise, "PROMISE"),
    image(second),
    image(first),
    image(second, "HALF"),
    image(first, "HALF"),
  ];
};

const PATCHES_IMAGE = {
  url: "/case-studies/Patches.png",
  alt: "Patches branded burger box packaging",
};

const SKYLINE_BILLBOARD = {
  url: "/uploads/case-studies/skyline-finance/skyline1.png",
  alt: "Skyline Finance campaign wrapped around a corner billboard",
};

const SKYLINE_ATM = {
  url: "/uploads/case-studies/skyline-finance/skyline2.png",
  alt: "Customer withdrawing cash at a Skyline Finance ATM",
};

const LUMINA_IMAGE = {
  url: "/case-studies/Lumina.png",
  alt: "Client receiving a facial treatment at a Lumina Wellness studio",
};

const ATLAS_IMAGE = {
  url: "/case-studies/Atlas.png",
  alt: "ACG signage fixed to a construction site hoarding",
};

export const CASE_STUDIES = [
  {
    title: "Patches",
    slug: "patches",
    client: "Patches",
    service: "Brand identity",
    summary:
      "Repositioning a SaaS startup for Series A growth with a bold, modern identity system.",
    imageUrl: PATCHES_IMAGE.url,
    imageAlt: PATCHES_IMAGE.alt,
    sortOrder: 0,
    tagline: "A bolder identity for a product that had outgrown its first one.",
    categories: ["Technology", "SaaS", "Brand Identity", "Packaging"],
    intro: [
      "Growth rarely waits for a brand to catch up.",
      "Patches had built a product people depended on and kept an identity that still looked like the side project it started as. With a Series A closing and the category getting louder every quarter, the distance between what the company had become and what it looked like had stopped being cosmetic.",
      "Our role was to rebuild the brand from its positioning up — a system confident enough to hold its own against far larger competitors, and loose enough to stretch across everything the company had not shipped yet.",
    ],
    blocks: detailBlocks({
      images: [PATCHES_IMAGE],
      colors: ["#F4E3C1", "#E9762B"],
      sections: [
        {
          heading: "Looking like the company you already are",
          body: "The product had moved on twice while the brand stood still. Customers who had used Patches for years described it in language the website never used, and every new hire redrew the logo slightly differently because there was nothing to redraw it from. None of that shows up on a roadmap, but all of it shows up in a pitch. The work started by writing down what the company actually stood for, in the words its own customers already used, and then building outward from there.",
        },
        {
          heading: "A system built to stretch",
          body: "A brand that only works at the sizes it was designed for is a brand that breaks the first time it is needed somewhere new. So Patches got a system rather than a set of files: a type scale that holds up from a packaging panel to a product tooltip, a palette with enough range to signal without shouting, and rules plain enough that a marketer with no design training can follow them at four in the afternoon.",
        },
      ],
      promise: {
        heading: "Our brand promise",
        body: "We make the everyday work feel lighter than it has any right to. A promise the product has to keep before the brand can make it, which is why it was written with the team that ships, not only the team that markets.",
      },
    }),
  },
  {
    title: "Skyline Finance",
    slug: "skyline-finance",
    client: "Skyline Finance",
    service: "Launch campaign",
    summary:
      "Launch campaign for a fintech platform making investing accessible to everyone.",
    imageUrl: SKYLINE_BILLBOARD.url,
    imageAlt: SKYLINE_BILLBOARD.alt,
    sortOrder: 1,
    tagline: "Building a financial brand that grows with a new generation.",
    categories: ["Finance", "Investment", "Corporate Banking", "Digital Banking"],
    intro: [
      "The future of banking isn't about holding money. It's about building confidence.",
      "Skyline Finance was envisioned as a modern, digital-first credit union designed for young professionals entering one of the most defining periods of their financial lives. While traditional institutions continue to rely on complexity and legacy systems, Skyline set out to become something different—a trusted financial partner that makes progress feel achievable.",
      "Our role was to define a strategic brand foundation that would help Skyline earn trust, communicate with clarity, and create an identity capable of growing alongside its members.",
    ],
    blocks: detailBlocks({
      images: [SKYLINE_BILLBOARD, SKYLINE_ATM],
      colors: ["#AEC9E0", "#4FAE82"],
      sections: [
        {
          heading: "Bridging the gap between banking and belonging",
          body: "Most financial institutions speak the language of finance. Their customers speak the language of life. One talks about rates, terms, and products. The other worries about buying a first home, paying off debt, starting a family, or investing for the future. Somewhere along the way, banking became transactional. People no longer felt guided. For younger consumers especially, traditional banking felt distant, complicated, and disconnected from the realities of modern life. The opportunity wasn't to reinvent banking. The opportunity was to make it feel human again.",
        },
        {
          heading: "A new kind of financial partner",
          body: "What if a financial institution evolved with its members? This question became the foundation of the Skyline Finance strategy. Instead of positioning the brand as a place where people store money, we positioned it as a partner that helps people build their future. A shift from transactions to transformation. A shift from products to progress. A shift from managing finances to enabling possibilities.",
        },
      ],
      promise: {
        heading: "Our brand promise",
        body: "We help our members make confident financial decisions at every stage of life. A promise that extends beyond marketing. A commitment that influences every interaction, every product, and every experience. Because the strongest financial brands don't simply hold people's money. They help people move forward.",
      },
    }),
  },
  {
    title: "Lumina Wellness",
    slug: "lumina-wellness",
    client: "Lumina Wellness",
    service: "Brand identity",
    summary:
      "Creating a serene brand identity for a wellness startup focused on mindful living.",
    imageUrl: LUMINA_IMAGE.url,
    imageAlt: LUMINA_IMAGE.alt,
    sortOrder: 2,
    tagline: "A quieter brand for people trying to slow down.",
    categories: ["Wellness", "Lifestyle", "Brand Identity", "Retail"],
    intro: [
      "Calm is easy to claim and very hard to design.",
      "Lumina Wellness opened its first studio into a category that had learned to sell rest the way everything else is sold — loudly, urgently, and with a countdown timer attached. The founders wanted the opposite, and knew that saying so was not the same as being it.",
      "Our role was to build an identity that behaves the way the studio does: unhurried, legible, and warm enough that the first visit feels like a second one.",
    ],
    blocks: detailBlocks({
      images: [LUMINA_IMAGE],
      colors: ["#E7D8C9", "#8FA99B"],
      sections: [
        {
          heading: "Rest is not a product feature",
          body: "Wellness branding has a habit of borrowing from the industries it claims to be an antidote to — the same urgency, the same scarcity, the same promises measured in weeks. Lumina's audience had already seen through it. What they responded to instead was specificity: what happens in the room, how long it takes, who is in it with you, and what it costs. The brand's job was to answer those plainly and then get out of the way.",
        },
        {
          heading: "An identity that can hold still",
          body: "Every decision was made against a single test: does this ask the reader for anything? Generous margins, one typeface used at three sizes, a palette taken from the studio's own materials, and photography that shows the treatment rather than a model's reaction to it. The system is deliberately small, because a small system is one a two-person team can actually keep consistent across a year of posts, price lists and signage.",
        },
      ],
      promise: {
        heading: "Our brand promise",
        body: "We give you back the hour you booked, and nothing you didn't ask for. It sets the standard for the studio's own behaviour first — no upsell at the door, no rebooking pressure — and for everything the brand says second.",
      },
    }),
  },
  {
    title: "Atlas Construction Group",
    slug: "atlas-construction-group",
    client: "Atlas Construction Group",
    service: "Brand activation",
    summary:
      "Turning hoardings, vehicles and site signage into a construction group's most visible campaign.",
    imageUrl: ATLAS_IMAGE.url,
    imageAlt: ATLAS_IMAGE.alt,
    sortOrder: 3,
    tagline: "The sites were already the advertising. They just weren't saying anything.",
    categories: ["Construction", "Industrial", "Brand Activation", "Wayfinding"],
    intro: [
      "A construction group's largest media buy is the one it already owns.",
      "Atlas Construction Group had eleven active sites across the region, every one of them wrapped in hoarding that thousands of people walked past daily. The hoarding carried a logo, a phone number, and nothing else. Meanwhile the marketing budget went on trade press almost none of those people read.",
      "Our role was to treat the estate as the channel it already was: a system of hoardings, vehicles, hats and site signage that tells the same story at fifty metres and at arm's length.",
    ],
    blocks: detailBlocks({
      images: [ATLAS_IMAGE],
      colors: ["#D7DEE3", "#F0B429"],
      sections: [
        {
          heading: "Built where everyone can see it",
          body: "Construction brands tend to be judged on evidence rather than claims, and Atlas had eleven pieces of evidence standing in public. The gap was that none of them said what was being built, who was building it, or when the street would get its pavement back. Answering those three questions in large type turned a barrier into the most useful sign on the road, and the most persuasive thing the company had ever put its name on.",
        },
        {
          heading: "One system, eleven sites, no design team",
          body: "Whatever the system was, it had to be installed by site managers with a print quote and a deadline, not by a studio. So the work shipped as a kit: fixed panel sizes, a colour pair that survives being printed cheaply and left in the sun, type set large enough to be read from a moving car, and a one-page rule sheet. Consistency across eleven sites came from making the correct version the easiest one to order.",
        },
      ],
      promise: {
        heading: "Our brand promise",
        body: "We tell you what we're building and when we'll be done. Printed on every hoarding, which is the only place a promise like that counts — and the reason it had to be one the business could keep.",
      },
    }),
  },
];
