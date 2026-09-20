// The blog posts the website ships with, shared by the MySQL seed
// (blog-posts.seed.js) and the SQLite stand-in used in development
// (dev-sqlite/sqlite-db.js), so the two can never drift apart.
//
// A post's category is whichever of its tags matches a row in `categories` -
// the pairing the blog grid already uses - so "branding" here is what files
// this post, and its block images, under the Branding category. Any tag after
// it is just a topic: the post page reads the first one as the last step of
// its breadcrumb, which is what makes the trail read
// Blog > Branding > Scaling Brands.

export const BLOG_POSTS = [
  {
    title: "How to Build Thoughtful Brands with Clear Direction",
    slug: "how-to-build-thoughtful-brands-with-clear-direction",
    excerpt: "Building brands with intentionality and direction.",
    author: "Olamide Andrew",
    tags: ["branding", "scaling-brands"],
    // The same file as the post's image block, kept under
    // uploads/blog/branding/the-problem-with-pressure/. The "Image
    // description" prints as its caption.
    coverImageUrl: "/uploads/blog/branding/the-problem-with-pressure/26f64686bd8dbd2bc9f766a3bce0c778.png",
    coverImageAlt: "Sample: Coca Cola Branding",
    // Written a sentence to a line rather than in packed paragraphs: inside a
    // section .blog-prose sets consecutive lines of body copy on the same
    // leading, so each statement lands on its own line and only a heading
    // opens a gap.
    content: [
      "In a world where new businesses launch every day, looking good is no longer enough. The brands that stand out aren't always the loudest or the most visually impressive — they're the ones that know who they are, what they stand for, and how to communicate it consistently. That's what separates a thoughtful brand from a forgettable one.",

      "## What Makes a Brand Thoughtful?",
      "A thoughtful brand is built intentionally. Every decision—from the words you use to the colors you choose—supports a bigger purpose.",
      "It's not about chasing trends or creating the most elaborate logo. It's about creating clarity.",
      "Thoughtful brands answer three simple questions:",
      "- Who are we?\n- Who are we serving?\n- Why should people care?",
      "When these questions are clear, everything else becomes easier.",

      "## Start with Strategy, Not Design",
      "Many businesses jump straight into visual identity. They want a logo, a website, or social media graphics.",
      "But design without strategy is decoration.",
      "Before creating visual assets, define:",
      "- Your mission and purpose\n- Your target audience\n- Your positioning\n- Your brand personality\n- Your key messages",
      "A strong strategy becomes the foundation that guides every future decision.",

      "## Create an Identity That Reflects Your Purpose",
      "Many businesses jump straight into visual identity. They want a logo, a website, or social media graphics.",
      "But design without strategy is decoration.",
      "Before creating visual assets, define:",
      "- Your mission and purpose\n- Your target audience\n- Your positioning\n- Your brand personality\n- Your key messages",
      "A strong strategy becomes the foundation that guides every future decision.",

      "## Consistency Builds Trust",
      "One of the biggest mistakes businesses make is showing up differently everywhere.",
      "A thoughtful brand creates a consistent experience across every touchpoint—from social media and websites to presentations and campaigns.",
      "People trust brands they recognize.",
      "Consistency doesn't mean being repetitive. It means being recognizable.",

      "## Use Campaigns to Bring Your Brand to Life",
      "A strong brand strategy and identity provide direction, but campaigns create momentum.",
      "Campaigns help you communicate your message, launch new products, tell stories, and connect with your audience in meaningful ways.",
      "The most effective campaigns don't feel disconnected from the brand. They reinforce what the brand already stands for.",
      "When strategy, identity, and campaigns work together, every interaction strengthens your brand.",

      "## Think Long-Term",
      "Building a thoughtful brand isn't a one-time exercise.",
      "As your business evolves, your brand should evolve with it while remaining rooted in the same core purpose and direction.",
      "The goal isn't simply to attract attention today.",
      "The goal is to build a brand people remember, trust, and choose repeatedly.",

      "## Final Thoughts",
      "Thoughtful brands aren't built by accident. They're built through intentional decisions, clear strategy, and consistent execution.",
      "When your strategy provides direction, your identity creates recognition, and your campaigns drive engagement, you create more than a brand—you create something people believe in. And that's what turns businesses into brands worth remembering.",
    ].join("\n\n"),
    // No content blocks. An image block needs an image, and an image gets
    // there by being uploaded through the panel - which is also the only
    // thing that files it under
    // uploads/blog/<category>/<block name>/<file>. Seeding one here would
    // mean a block with no image, which the validator rejects, so the post
    // could not be saved again from the form until it was deleted.
    blocks: [],
  },
];
