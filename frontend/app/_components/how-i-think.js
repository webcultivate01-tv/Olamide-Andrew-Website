import Reveal from "../components/reveal";

const STEPS = [
  {
    number: "01",
    title: "Research",
    heading: "Understand the landscape.",
    body: "I examine your audience, competitors and business environment to understand how your brand is perceived, what your customers need and where opportunities exist.",
  },
  {
    number: "02",
    title: "Strategy",
    heading: "Find the opportunity.",
    body: "I connect your business goals with customer needs to clarify your value, shape your messaging and determine the direction your brand should take.",
  },
  {
    number: "03",
    title: "Positioning",
    heading: "Give customers a reason to choose you.",
    body: "I help define what makes your business relevant and different, so customers can understand why your brand is the right fit rather than seeing it as just another option.",
  },
];

function LightbulbIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6 text-black/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 16.5a5.5 5.5 0 1 1 5 0v1.5a1.5 1.5 0 0 1-1.5 1.5h-2a1.5 1.5 0 0 1-1.5-1.5v-1.5Z" />
      <path d="M12 19.5v2" />
    </svg>
  );
}

export default function HowIThink() {
  return (
    <section className="py-16 md:py-20 lg:py-24">
      <Reveal
        as="h2"
        variant="up"
        className="font-headline mx-auto max-w-[1600px] px-5 text-center text-[2.25rem] leading-[1.05] tracking-[-0.01em] text-foreground uppercase md:px-10 md:text-[3.5rem] lg:px-20 lg:text-[4.75rem]"
      >
        See how I think
      </Reveal>

      {/* Three cards, so they all fit in a single row from md up and stack on
          mobile — no rail or controls needed. */}
      <div className="mx-auto mt-10 grid max-w-[1600px] gap-5 px-5 md:mt-16 md:grid-cols-3 md:gap-4 md:px-10 lg:gap-6 lg:px-20">
        {STEPS.map((item, index) => (
          // Hairline border that follows the notch: the outer layer is the
          // border colour, the inner one is the card face inset by 1px.
          <Reveal
            key={item.title}
            variant="up"
            mobile={index % 2 === 0 ? "left" : "right"}
            delay={index * 100}
            className="clip-notch bg-black/15 p-px"
          >
            <div className="clip-notch flex h-full flex-col bg-white p-7 pt-9 md:p-6 md:pt-8 lg:min-h-[392px] lg:p-8 lg:pt-11">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-black/[.05]">
                <LightbulbIcon />
              </span>

              <h3 className="mt-8 flex items-baseline gap-3 text-base font-semibold lg:text-lg">
                <span className="text-accent">{item.number}</span>
                <span className="text-accent">{item.title}</span>
              </h3>

              <p className="mt-3 text-lg font-medium leading-snug text-foreground lg:text-xl">
                {item.heading}
              </p>

              <p className="mt-4 text-base leading-relaxed text-black/70 lg:text-lg">
                {item.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
