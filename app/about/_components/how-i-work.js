import Reveal from "../../components/reveal";
import SectionHeading from "./section-heading";

const INTRO = [
  "Every project begins with questions before visuals.",
  "Before colours.",
  "Before typography.",
  "Before logos.",
  "I want to understand:",
];

const QUESTIONS = [
  "What makes your business different?",
  "Who are you trying to reach?",
  "Why should people choose you?",
  "How do you want to be remembered?",
  "What business goals should your brand support?",
];

const OUTRO = [
  "Only after those answers become clear does design begin.",
  "Because great brands are not designed first.",
  "They are understood first.",
];

const LINE = "text-base leading-relaxed text-black/75 md:text-lg";

export default function HowIWork() {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-20 lg:px-20 lg:py-24">
      <SectionHeading>
        How I <span className="text-accent">Work</span>
      </SectionHeading>

      <div className="mt-6 max-w-[1180px] space-y-2 md:mt-8">
        {INTRO.map((line, i) => (
          <Reveal as="p" key={line} delay={120 + i * 70} className={LINE}>
            {line}
          </Reveal>
        ))}
      </div>

      {/* The questions come in from the left instead of straight up, so the
          list separates itself from the prose bracketing it. */}
      <ul className="mt-2 max-w-[1180px] space-y-2">
        {QUESTIONS.map((question, i) => (
          <Reveal
            as="li"
            key={question}
            variant="left"
            delay={i * 90}
            className={`flex gap-4 ${LINE}`}
          >
            {/* Solid dot marker, nudged down so it sits on the text's midline. */}
            <span
              aria-hidden="true"
              className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-foreground"
            />
            <span>{question}</span>
          </Reveal>
        ))}
      </ul>

      <div className="mt-2 max-w-[1180px] space-y-2">
        {OUTRO.map((line, i) => (
          <Reveal as="p" key={line} delay={i * 90} className={LINE}>
            {line}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
