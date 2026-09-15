import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  FileText,
  Menu,
  X,
  ChevronDown,
  Smartphone,
  MousePointerClick,
  Play,
  Clock3,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { DelAvatar } from "@/components/del-avatar";

// Founding-offer inventory. This is a real, honest count Geo edits by hand as
// spots are claimed — never a simulated or auto-decrementing countdown.
const FOUNDING_SPOTS_REMAINING = 5;

// TODO: replace with a real, sourced, current JA part-time wage figure
// before launch — do not invent this number
const PART_TIME_SHIFT_COST_JMD: number | null = null;

const MINUTES_PER_REPLY = 2;

type Currency = "JMD" | "USD";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    jmd: 7500,
    usd: 49,
    foundingJmd: 4500,
    popular: false,
    features: ["WhatsApp inbox", "Media library", "Approved FAQs", "Correction loop", "Morning digest"],
  },
  {
    id: "plus",
    name: "Plus",
    jmd: 12500,
    usd: 79,
    foundingJmd: null as number | null,
    popular: true,
    features: ["Everything in Starter", "Instagram DMs", "One inbox, split by platform"],
  },
  {
    id: "pro",
    name: "Pro",
    jmd: 20000,
    usd: 129,
    foundingJmd: null as number | null,
    popular: false,
    features: ["Everything in Plus", "Messenger", "A second connected account"],
  },
] as const;

function formatPrice(amount: number, currency: Currency): string {
  return currency === "JMD" ? `J$${amount.toLocaleString()}` : `US$${amount.toLocaleString()}`;
}

// The demo script below is illustrative — a fixed conversation showing how Del
// actually behaves, not a log of real messages or a claim about real results.
type DemoEvent =
  | { kind: "customer"; text: string; time: string }
  | { kind: "auto"; text: string; tag: string; media?: string }
  | { kind: "escalate"; text: string }
  | { kind: "digest" };

const DEMO_SCRIPT: DemoEvent[] = [
  { kind: "customer", text: "Good morning! Unu have di price list?", time: "08:42" },
  { kind: "auto", text: "", tag: "Sent automatically · 08:42", media: "Wholesale_Prices.pdf" },
  { kind: "customer", text: "Wah time unu open?", time: "08:44" },
  { kind: "auto", text: "We're open Mon–Sat, 8am–5pm. Closed Sundays.", tag: "Answered automatically · 08:44" },
  { kind: "customer", text: "Unu deliver a Portmore?", time: "08:45" },
  { kind: "auto", text: "Yes — Kingston, St. Andrew & Portmore. Usually 45–75 min.", tag: "Answered automatically · 08:45" },
  { kind: "customer", text: "Mi waan buy inna bulk, like 200 units. Wah di price stay?", time: "08:51" },
  { kind: "auto", text: "Bulk pricing depends on quantity and delivery — let me get the owner to send you an exact number.", tag: "Collected for the owner · no price guessed" },
  { kind: "customer", text: "Mi order neva reach yet an a two days now!", time: "08:58" },
  { kind: "escalate", text: "Sent straight to the owner's phone — not answered automatically" },
  { kind: "digest" },
];

const DEMO_STEP_MS = 2000;
const DEMO_HOLD_MS = 4200;

function DemoChatWidget() {
  const [visibleCount, setVisibleCount] = useState(2);
  const [playing, setPlaying] = useState(true);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const atEnd = visibleCount >= DEMO_SCRIPT.length;
    const timer = setTimeout(() => {
      setVisibleCount((current) => (atEnd ? 2 : current + 1));
      // Del "sends" something on every step but the customer's own messages.
      const next = DEMO_SCRIPT[atEnd ? 1 : visibleCount];
      if (next && next.kind !== "customer") setPulse((p) => p + 1);
    }, atEnd ? DEMO_HOLD_MS : DEMO_STEP_MS);
    return () => clearTimeout(timer);
  }, [visibleCount, playing]);

  const events = DEMO_SCRIPT.slice(0, visibleCount);

  return (
    <div className="relative max-w-[400px] w-full mx-auto">
      <div className="absolute -inset-0.5 rounded-[26px] bg-gradient-to-b from-[#e5dbd1] to-transparent opacity-50" />
      <div className="relative rounded-[24px] border border-[#e5dbd1] bg-[#f2ede7] shadow-[0_24px_64px_rgba(73,60,46,0.12)] overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 bg-[#1c775b] px-4 py-3 text-white">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 font-bold text-sm">C</div>
          <div className="flex-1">
            <p className="text-[13px] font-bold">Customer</p>
            <p className="text-[10px] text-white/80">online</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold uppercase tracking-wider">
            <Play size={9} fill="currentColor" /> Live demo
          </span>
        </div>
        <div className="flex-1 min-h-[380px] p-4 space-y-3 text-[13px]">
          {events.map((event, i) => {
            if (event.kind === "customer") {
              return (
                <div key={i} className="flex justify-start wa-rise">
                  <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[#26332d] shadow-sm max-w-[85%]">
                    {event.text}
                    <p className="mt-1 text-[9px] text-right text-[#9b958d]">{event.time}</p>
                  </div>
                </div>
              );
            }
            if (event.kind === "auto") {
              return (
                <div key={i} className="flex justify-end wa-rise">
                  <div className="max-w-[85%] flex flex-col items-end">
                    <div className="rounded-2xl rounded-tr-sm bg-[#eaf6ee] px-3.5 py-2.5 text-[#1a4a38] shadow-sm">
                      {event.media ? (
                        <div className="flex items-center gap-2 mb-1 p-2 rounded-xl bg-white/60">
                          <div className="h-8 w-8 bg-[#cde4d8] text-[#1c775b] rounded-lg grid place-items-center"><FileText size={16} /></div>
                          <div className="text-[11px] font-bold">{event.media}</div>
                        </div>
                      ) : event.text}
                      <p className="mt-1 text-[9px] text-right text-[#699c86] flex items-center justify-end gap-1">
                        <DelAvatar size={12} pulse={pulse} /> {event.tag}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }
            if (event.kind === "escalate") {
              return (
                <div key={i} className="flex justify-center wa-rise">
                  <div className="flex items-center gap-1.5 rounded-full bg-[#fdf0e6] px-3 py-1.5 text-[10px] font-bold text-[#a64a2b]">
                    <AlertTriangle size={11} /> {event.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="wa-rise mt-2 rounded-2xl border border-dashed border-[#c7bcae] bg-white/70 p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <DelAvatar size={14} pulse={pulse} />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#a29a91]">Sample day-end digest</p>
                </div>
                <p className="mt-1.5 text-[15px] font-bold text-[#213b30]">47 messages · 39 handled · 8 need you</p>
                <p className="mt-1 text-[10px] text-[#918c84]">Illustrative — every business's numbers will differ.</p>
                <p className="mt-2 text-[10px] font-bold text-[#5c675f]">— Del</p>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => { setVisibleCount(2); setPlaying(true); }}
          className="border-t border-[#e5dbd1] bg-white/70 py-2 text-center text-[10px] font-bold text-[#5c675f] transition hover:bg-white"
        >
          Replay demo
        </button>
      </div>
    </div>
  );
}

function FaqAccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e5dbd1] bg-[#fffdfa]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#238b68]"
        aria-expanded={open}
      >
        <span className="text-sm font-bold text-[#213b30]">{question}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#9c958d] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-[#eee7df] px-5 py-4 text-sm leading-relaxed text-[#59635e]">{answer}</div>}
    </div>
  );
}

const FAQS = [
  {
    question: "My staff already handle this.",
    answer: "They do — for now. How much of their day does it actually take, and what else could they be doing with it?",
  },
  {
    question: "My customers want to talk to a real person.",
    answer: "They still will. Del only answers the price list and the basics. The moment it's uncertain, it's you they're talking to — same as today.",
  },
  {
    question: "What if Del says something wrong?",
    answer: "It can't say anything you didn't write. And if it ever gets one wrong, one tap turns it off, permanently, right there in the chat.",
  },
  {
    question: "Isn't this expensive?",
    answer: "Compare it to one missed order this month. Most businesses lose more than the subscription costs the first time a message goes unanswered too long.",
  },
];

function RoiCalculator() {
  const [messagesPerDay, setMessagesPerDay] = useState(40);
  const hoursPerWeek = (messagesPerDay * 7 * MINUTES_PER_REPLY) / 60;
  const starter = PLANS.find((plan) => plan.id === "starter")!;
  const partTimeLine =
    PART_TIME_SHIFT_COST_JMD && PART_TIME_SHIFT_COST_JMD > (starter.foundingJmd ?? starter.jmd)
      ? "Del costs less than one part-time shift a month."
      : null;

  return (
    <div className="rounded-3xl border border-[#e5dbd1] bg-[#fffdfa] p-8 md:p-10 max-w-[720px] mx-auto">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a7a5d] mb-2">An estimate, not a promise</p>
      <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-2xl md:text-3xl font-bold tracking-[-0.04em] text-[#213b30] mb-6">
        See what Del could be worth to you
      </h2>

      <label className="block text-sm font-bold text-[#38584b] mb-3" htmlFor="messages-per-day">
        Messages per day: <span className="text-[#1c775b]">{messagesPerDay}</span>
      </label>
      <div className="flex items-center gap-4">
        <input
          id="messages-per-day"
          type="range"
          min={5}
          max={200}
          step={5}
          value={messagesPerDay}
          onChange={(event) => setMessagesPerDay(Number(event.target.value))}
          className="w-full accent-[#1c775b]"
        />
        <input
          type="number"
          min={0}
          value={messagesPerDay}
          onChange={(event) => setMessagesPerDay(Math.max(0, Number(event.target.value) || 0))}
          className="w-20 shrink-0 rounded-lg border border-[#dcd5cc] bg-[#fbf8f4] px-2 py-1.5 text-sm text-center"
          aria-label="Messages per day (exact number)"
        />
      </div>

      <div className="mt-8 rounded-2xl bg-[#eaf4ee] p-6 text-center">
        <p className="text-4xl font-bold font-['Space_Grotesk',ui-sans-serif,sans-serif] tracking-[-0.04em] text-[#1c775b]">
          ~{hoursPerWeek.toFixed(1)} hrs/week
        </p>
        <p className="mt-2 text-sm text-[#4a5750]">estimated time freed up, assuming {MINUTES_PER_REPLY} minutes per reply</p>
      </div>
      <p className="mt-3 text-xs text-[#918c84] text-center">Based on the numbers you enter — actual results vary.</p>

      {partTimeLine && <p className="mt-6 text-center text-sm font-bold text-[#38584b]">{partTimeLine}</p>}
    </div>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>("JMD");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 560);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryCta = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#dc8454] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#c66f40] shadow-[0_8px_24px_rgba(220,132,84,0.3)]";

  return (
    <div className="min-h-[100dvh] bg-[#fffdfa] font-['DM_Sans',ui-sans-serif,system-ui,sans-serif] text-foreground">
      <header className="sticky top-0 z-50 border-b border-[#e7ddd2] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 lg:px-8">
          <Logo />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#53665b]">
            <a href="#how-it-works" className="hover:text-[#1c775b] transition">How it works</a>
            <a href="#pricing" className="hover:text-[#1c775b] transition">Pricing</a>
            <a href="#faq" className="hover:text-[#1c775b] transition">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-[#53665b] transition hover:text-[#1c775b]">
              Log in
            </Link>
            <Link href="/signup?plan=starter" className={primaryCta}>
              Start free for 2 weeks
            </Link>
          </div>

          <button
            className="md:hidden relative z-50 p-2 -mr-2 text-[#53665b]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#fffdfa] border-b border-[#e7ddd2] shadow-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">How it works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">FAQ</a>
            <hr className="border-[#e7ddd2] my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">
              Log in
            </Link>
            <Link href="/signup?plan=starter" onClick={() => setMobileMenuOpen(false)} className={`mt-2 w-full ${primaryCta}`}>
              Start free for 2 weeks
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 px-5 md:px-8">
          <div className="mx-auto max-w-[1200px] grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="wa-rise md:pr-10">
              <DelAvatar size={48} className="mb-6" />
              <h1 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(44px,6vw,72px)] font-bold leading-[1.02] tracking-[-0.05em] text-[#213b30]">
                Meet Del — the assistant who watches your phone so you don't have to.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#59635e]">
                Load your price list once. From then on, Del answers what you've approved and hands you everything else — so the order that matters doesn't get buried under the twentieth "wah time unu open."
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/signup?plan=starter" className={primaryCta}>
                  Start free for 2 weeks
                </Link>
                <a href="#demo" className="inline-flex items-center gap-2 rounded-xl bg-[#f4eee8] px-6 py-3.5 text-sm font-bold text-[#38584b] transition hover:bg-[#e7ddd2]">
                  <Play size={14} fill="currentColor" /> Watch Del work — 60 seconds
                </a>
              </div>
              <p className="mt-4 text-xs font-semibold text-[#8a938c]">No card required to start. Same WhatsApp number — nothing to migrate.</p>
            </div>

            <div className="wa-rise flex justify-center" style={{ animationDelay: "150ms" }}>
              <div className="w-[280px] rounded-[36px] border-[6px] border-[#213b30] bg-[#213b30] shadow-[0_32px_64px_rgba(33,59,48,0.25)]">
                <img
                  src="/screenshots/inbox-mobile.png"
                  alt="Delegate inbox dashboard showing Del's morning digest and conversation list"
                  className="w-full rounded-[30px] block"
                />
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM / AGITATION */}
        <section className="border-y border-[#eee7df] bg-[#e6f2ea] py-20 px-5 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-12">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30]">
                You already know which messages eat your day.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                "“Wah time unu open?” — asked, answered, asked again, forty times a week.",
                "A wholesale order sitting under fifteen “hi”s.",
                "A complaint unread for six hours because the phone never stopped buzzing.",
              ].map((line) => (
                <div key={line} className="rounded-2xl border border-[#cfe3d7] bg-[#fffdfa] p-6">
                  <p className="text-base leading-relaxed text-[#2c4038] font-semibold">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MEET DEL */}
        <section className="py-24 px-5 lg:px-8 bg-[#fffdfa]">
          <div className="mx-auto max-w-[760px] text-center">
            <DelAvatar size={40} className="mx-auto mb-8" />
            <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30] mb-6">
              Meet Del
            </h2>
            <p className="text-xl leading-relaxed text-[#38584b]">
              Del is not a person, and never claims to be one. Del is the assistant that takes over the parts of your WhatsApp inbox you'd hand to a trusted employee — the parts with a fixed, correct answer — and leaves everything else exactly where it belongs: with you. Del doesn't guess. Del doesn't improvise a price. Del doesn't invent a delivery date. If it isn't something you've explicitly approved, it goes straight to your phone, flagged, waiting.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="scroll-mt-20 py-24 px-5 lg:px-8 bg-[#e6f2ea]">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30]">
                How it works
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 relative mb-20">
              <div className="hidden sm:block absolute top-6 left-[16%] right-[16%] h-[1px] bg-gradient-to-r from-transparent via-[#bcd6c7] to-transparent" />
              {[
                { title: "Load what Del is allowed to say", desc: "Your price list, your hours, your delivery areas — once." },
                { title: "Del answers instantly", desc: "In the words you gave it, day or night." },
                { title: "Anything else comes to you", desc: "A complaint, a custom order, a question nobody's asked before — comes straight to you." },
              ].map((step, i) => (
                <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fffdfa] border border-[#cfe3d7] text-lg font-bold text-[#1c775b] shadow-sm mb-5">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-[#213b30] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#4a5750] leading-relaxed max-w-[260px]">{step.desc}</p>
                </div>
              ))}
            </div>

            <div id="demo" className="scroll-mt-24">
              <DemoChatWidget />
            </div>
          </div>
        </section>

        {/* TRANSPARENCY BOX */}
        <section className="py-20 px-5 lg:px-8 bg-[#fffdfa]">
          <div className="mx-auto max-w-[900px]">
            <div className="rounded-3xl border-2 border-dashed border-[#c7bcae] bg-[#faf5ef] p-8 md:p-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#a36b43] mb-3">What Del will never do</p>
              <p className="text-xl md:text-2xl leading-relaxed font-semibold text-[#213b30]">
                No price you didn't set. No delivery date you didn't confirm. No order taken, no payment collected, no photo interpreted beyond reading the words on it. If it's uncertain, it's yours — every time.
              </p>
            </div>
          </div>
        </section>

        {/* THREE PROMISES */}
        <section className="py-20 px-5 lg:px-8 bg-[#e6f2ea]">
          <div className="mx-auto max-w-[1000px]">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: Smartphone, text: "Same number, same phone. Nothing to relearn, nothing to migrate." },
                { icon: ShieldCheck, text: "Del only ever says what you wrote — never once, never invented." },
                { icon: MousePointerClick, text: "One tap disables a wrong answer, instantly, for good." },
              ].map((promise) => (
                <div key={promise.text} className="flex flex-col items-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fffdfa] text-[#1c775b] mb-4">
                    <promise.icon size={24} />
                  </div>
                  <p className="text-sm font-semibold text-[#2c4038] leading-relaxed max-w-[240px]">{promise.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROI CALCULATOR */}
        <section className="py-24 px-5 lg:px-8 bg-[#fffdfa]">
          <RoiCalculator />
        </section>

        {/* PRICING */}
        <section id="pricing" className="scroll-mt-20 py-24 px-5 lg:px-8 text-white" style={{ backgroundColor: '#152e25' }}>
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-6">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-white">
                Simple pricing
              </h2>
              <p className="mt-3 text-sm text-[#9aa8a1]">No hidden fees.</p>
            </div>

            <div className="mx-auto mb-10 max-w-2xl text-center rounded-xl bg-[#1c4a39] border border-[#2a6650] py-3 px-4">
              <p className="text-sm font-bold text-[#c2f2da]">
                First five businesses: J$4,500/month, locked for life. After that, the price goes up for good.
              </p>
            </div>

            <div className="mb-10 flex justify-center">
              <div className="inline-flex rounded-full bg-[#1c4a39] p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrency("JMD")}
                  className={`rounded-full px-4 py-2 transition ${currency === "JMD" ? "bg-white text-[#0d261e]" : "text-[#9aa8a1]"}`}
                >
                  J$ JMD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`rounded-full px-4 py-2 transition ${currency === "USD" ? "bg-white text-[#0d261e]" : "text-[#9aa8a1]"}`}
                >
                  US$ USD
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-[1000px] mx-auto items-start">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={
                    plan.popular
                      ? "relative rounded-3xl border-2 border-[#3fc192] bg-[#1c3f32] p-8 md:-mt-4 md:mb-4 shadow-[0_24px_64px_rgba(0,0,0,0.4)]"
                      : "rounded-3xl border border-[#2a4539] bg-[#1a382d] p-8"
                  }
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3fc192] text-[#0d261e] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Most popular
                    </div>
                  )}
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    {plan.foundingJmd && currency === "JMD" ? (
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl font-bold text-[#6e857b] line-through">{formatPrice(plan.jmd, currency)}</span>
                        <span className="text-3xl font-bold text-[#3fc192]">{formatPrice(plan.foundingJmd, currency)}</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">{formatPrice(plan.jmd, currency)}</span>
                    )}
                    <span className="text-sm text-[#8ea098]"> /mo</span>
                    {currency === "JMD" && <p className="text-xs text-[#6e857b] mt-1">~{formatPrice(plan.usd, "USD")}/mo</p>}
                  </div>
                  {plan.foundingJmd && currency === "JMD" && (
                    <p className="mb-6 text-xs font-bold text-[#3fc192]">
                      Locked for the first {FOUNDING_SPOTS_REMAINING} businesses only, for as long as they stay.
                    </p>
                  )}
                  <ul className={`space-y-4 text-sm text-[#a3b3ac] ${plan.foundingJmd ? "mb-6" : "mb-8 mt-6"}`}>
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> {feature}</li>
                    ))}
                  </ul>
                  <Link
                    href={`/signup?plan=${plan.id}`}
                    className={
                      plan.popular
                        ? "block w-full text-center rounded-xl bg-[#dc8454] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c66f40] shadow-lg"
                        : "block w-full text-center rounded-xl border border-[#305948] bg-transparent px-5 py-3 text-sm font-bold text-white transition hover:bg-[#204234]"
                    }
                  >
                    Start free for 2 weeks
                  </Link>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-2xl text-center rounded-2xl border border-[#2a6650] bg-[#1c4a39] py-6 px-6">
              <p className="text-lg font-bold text-[#c2f2da]">Two weeks, completely free. If Del doesn't earn its place on your phone, we remove it ourselves. No call, no chase, no hard feelings.</p>
            </div>
          </div>
        </section>

        {/* FOUNDER NOTE */}
        <section className="py-24 px-5 lg:px-8 bg-[#fffdfa]">
          <div className="mx-auto max-w-[720px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a7a5d] mb-3 text-center">Why I built this</p>
            <div className="rounded-3xl border border-[#e5dbd1] bg-[#faf7f3] p-8 md:p-10">
              <p className="text-lg leading-relaxed text-[#3a4841]">
                I built Del because {/* Geo: replace [why] with your real reason */}[why]. I set it up myself, in person, in about 30 minutes — you hand me your price list, I load it, you watch it work before I leave.
              </p>
              <p className="mt-6 font-['Space_Grotesk',ui-sans-serif,sans-serif] text-base font-bold text-[#213b30]">— Geo</p>
            </div>
            {/* TODO: replace with real customer quotes once first five are live, never fill with invented names */}
          </div>
        </section>

        {/* OBJECTION FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 px-5 lg:px-8 bg-[#e6f2ea]">
          <div className="mx-auto max-w-[760px]">
            <div className="text-center mb-12">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30]">
                Questions owners actually ask
              </h2>
            </div>
            <div className="space-y-3">
              {FAQS.map((item, i) => (
                <FaqAccordionItem
                  key={item.question}
                  question={item.question}
                  answer={item.answer}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq((current) => (current === i ? null : i))}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="bg-[#16352b] py-24 px-5 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(32px,5vw,48px)] font-bold tracking-[-0.04em] text-white leading-tight">
              Ready to stop typing the same answer twice a day?
            </h2>
            <p className="mt-4 text-sm text-[#9aa8a1]">Two weeks free. Same number. Nothing changes until you approve it.</p>
            <div className="mt-10 flex justify-center">
              <Link href="/signup?plan=starter" className={primaryCta}>
                Start free for 2 weeks <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky mobile CTA */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e5dbd1] bg-[#fffdfa]/95 backdrop-blur-xl px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(73,60,46,0.1)] transition-transform duration-200 ${showStickyCta ? "translate-y-0" : "translate-y-full"}`}
      >
        <Link href="/signup?plan=starter" className={`w-full ${primaryCta}`}>
          <Clock3 size={15} /> Start free for 2 weeks
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#e7ddd2] bg-[#fffdfa] py-12 px-5 lg:px-8 pb-24 md:pb-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#777b75]">Approved answers and shared media for WhatsApp and Instagram, with a person in control.</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#213b30]">Product</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#777b75]">
                <a href="#how-it-works" className="hover:text-[#1c775b]">How it works</a>
                <a href="#pricing" className="hover:text-[#1c775b]">Pricing</a>
                <a href="#faq" className="hover:text-[#1c775b]">FAQ</a>
                <Link href="/login" className="hover:text-[#1c775b]">Log in</Link>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#213b30]">Contact</h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[#777b75]">
                <span>[YOUR SUPPORT EMAIL]</span>
                <span>[YOUR WHATSAPP NUMBER]</span>
              </div>
            </div>
          </div>
          <p className="mt-10 border-t border-[#eee7df] pt-6 text-xs text-[#9a958e]">© 2026 Delegate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
