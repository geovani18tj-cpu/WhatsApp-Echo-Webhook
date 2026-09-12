import { useState } from "react";
import { Link } from "wouter";
import { 
  MessageCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Image as ImageIcon,
  Clock,
  Instagram,
  FileText,
  Menu,
  X
} from "lucide-react";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3 relative z-50">
      <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#1c775b] text-white shadow-[0_6px_16px_rgba(28,119,91,0.22)]">
        <MessageCircle size={21} fill="currentColor" strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[15px] font-bold tracking-[-0.03em] text-[#1c382d]">Likkle Table</p>
      </div>
    </Link>
  );
}

export default function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-[#fffdfa] font-['DM_Sans',ui-sans-serif,system-ui,sans-serif] text-foreground">
      <header className="sticky top-0 z-50 border-b border-[#e7ddd2] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 lg:px-8">
          <Logo />
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#53665b]">
            <a href="#how-it-works" className="hover:text-[#1c775b] transition">How it works</a>
            <a href="#features" className="hover:text-[#1c775b] transition">Features</a>
            <a href="#pricing" className="hover:text-[#1c775b] transition">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-[#53665b] transition hover:text-[#1c775b]">
              Log in
            </Link>
            <Link href="/login" className="rounded-xl bg-[#1c775b] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#145d46] shadow-[0_6px_16px_rgba(28,119,91,0.15)]">
              Get started
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#fffdfa] border-b border-[#e7ddd2] shadow-xl p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">How it works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">Pricing</a>
            <hr className="border-[#e7ddd2] my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-base font-semibold text-[#213b30] py-2">
              Log in
            </Link>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 w-full text-center rounded-xl bg-[#1c775b] px-5 py-3.5 text-sm font-bold text-white shadow-md">
              Get started
            </Link>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-5 md:px-8">
          <div className="mx-auto max-w-[1200px] grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="wa-rise md:pr-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d8e4dc] bg-[#eef7f0] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#2a7a5d]">
                <MessageCircle size={14} fill="currentColor" />
                <span>WhatsApp + Instagram inbox</span>
              </div>
              <h1 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(40px,5vw,64px)] font-bold leading-[1.05] tracking-[-0.05em] text-[#213b30]">
                Never miss another WhatsApp order.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#59635e]">
                Likkle Table auto-sends your price list, answers the questions you get every day, and only pings you for what actually needs you — on WhatsApp and Instagram, using the number and page you already have.
              </p>
              
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/login" className="rounded-xl bg-[#1c775b] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#145d46] shadow-[0_8px_24px_rgba(28,119,91,0.2)]">
                  Get started
                </Link>
                <a href="#how-it-works" className="rounded-xl bg-[#f4eee8] px-6 py-3.5 text-sm font-bold text-[#38584b] transition hover:bg-[#e7ddd2]">
                  See how it works
                </a>
              </div>

            </div>

            {/* Chat Demo */}
            <div className="wa-rise relative max-w-[400px] w-full mx-auto lg:mx-0" style={{ animationDelay: "150ms" }}>
              <div className="absolute -inset-0.5 rounded-[26px] bg-gradient-to-b from-[#e5dbd1] to-transparent opacity-50"></div>
              <div className="relative rounded-[24px] border border-[#e5dbd1] bg-[#f2ede7] shadow-[0_24px_64px_rgba(73,60,46,0.12)] overflow-hidden flex flex-col">
                <div className="flex items-center gap-3 bg-[#1c775b] px-4 py-3 text-white">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-white/20 font-bold text-sm">C</div>
                  <div>
                    <p className="text-[13px] font-bold">Customer</p>
                    <p className="text-[10px] text-white/80">online</p>
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4 text-[13px]">
                  {/* Customer msg 1 */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[#26332d] shadow-sm max-w-[85%]">
                      Good morning! Unu have di price list?
                      <p className="mt-1 text-[9px] text-right text-[#9b958d]">08:42</p>
                    </div>
                  </div>
                  {/* Auto msg 1 */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] flex flex-col items-end">
                      <div className="rounded-2xl rounded-tr-sm bg-[#eaf6ee] px-3.5 py-2.5 text-[#1a4a38] shadow-sm">
                        <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-white/60">
                          <div className="h-8 w-8 bg-[#cde4d8] text-[#1c775b] rounded-lg grid place-items-center"><FileText size={16} /></div>
                          <div className="text-[11px] font-bold">Wholesale_Prices.pdf</div>
                        </div>
                        <p className="mt-1 text-[9px] text-right text-[#699c86] flex items-center justify-end gap-1">
                          <CheckCircle2 size={10} /> Sent automatically · 08:42
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Customer msg 2 */}
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-[#26332d] shadow-sm max-w-[85%]">
                      Nice. Unu deliver a Portmore?
                      <p className="mt-1 text-[9px] text-right text-[#9b958d]">08:45</p>
                    </div>
                  </div>
                  {/* Auto msg 2 */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] flex flex-col items-end">
                      <div className="rounded-2xl rounded-tr-sm bg-[#eaf6ee] px-3.5 py-2.5 text-[#1a4a38] shadow-sm">
                        Yes — Kingston, St. Andrew & Portmore. Usually 45–75 min.
                        <p className="mt-1 text-[9px] text-right text-[#699c86] flex items-center justify-end gap-1">
                          <CheckCircle2 size={10} /> Answered automatically · 08:45
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#eee7df] bg-[#fffdfa] px-5 py-12 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="text-center font-['Space_Grotesk',ui-sans-serif,sans-serif] text-2xl font-bold tracking-[-0.04em] text-[#213b30]">Built for wholesalers who live on WhatsApp</h2>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              {["Building supplies", "Packaging", "Auto parts", "Food distribution", "Stationery", "Beauty supply", "1–10 staff · Kingston, Jamaica"].map((chip, i) => (
                <span key={chip} className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${i === 6 ? "border border-[#cbe8d9] bg-[#eaf4ee] text-[#1c775b]" : "border border-[#e8dfd6] bg-[#f8f4ef] text-[#777b75]"}`}>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-[#f0e9e1] bg-[#faf7f3] py-24 px-5 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30]">
                How it works
              </h2>
              <p className="mt-3 text-sm text-[#777b75]">Four steps to a quieter phone and faster sales.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-[#d8cec3] to-transparent -translate-y-1/2"></div>
              
              {[
                { title: "Connect your number", desc: "Keep your existing WhatsApp Business number and Instagram page. Nothing changes for your customers." },
                { title: "Load what you already know", desc: "Upload your price lists, delivery zones, and FAQs. Likkle Table builds a knowledge base from your existing documents." },
                { title: "Del takes the repeat questions", desc: "Repeat questions are answered instantly, word for word how you'd say it, using only your approved facts." },
                { title: "You get what's left", desc: "Anything uncertain goes to your phone, plus you receive a morning digest of what needs your attention." }
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fffdfa] border border-[#e5dbd1] text-lg font-bold text-[#1c775b] shadow-sm mb-5">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-[#213b30] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#777b75] leading-relaxed max-w-[250px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-5 lg:px-8 bg-[#fffdfa]">
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-16">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-[#213b30]">
                Built for Jamaican wholesalers
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: FileText, title: "Media library", desc: "Upload PDFs, images, and price lists. The assistant automatically sends the right file when asked." },
                { icon: ShieldCheck, title: "Approved answers only", desc: "No AI hallucinations. If the answer isn't in your Knowledge Base, the assistant hands it over to you." },
                { icon: Zap, title: "One-tap correction", desc: "Edit a generated response before it goes out, or quickly update a fact right from the chat." },
                { icon: ImageIcon, title: "Photo reading", desc: "Reads the text in a customer's photo, but never confirms stock, pricing, or availability by itself." },
                { icon: Clock, title: "Morning digest", desc: "Wake up to a clean summary of what happened overnight and which orders need to go out today." },
                { icon: Instagram, title: "WhatsApp + Instagram", desc: "Manage one inbox with WhatsApp and Instagram conversations clearly split by platform." }
              ].map((feature, i) => (
                <div key={i} className="rounded-2xl border border-[#e5dbd1] bg-[#faf7f3] p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(73,60,46,0.06)] hover:bg-[#fffdfa]">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf4ee] text-[#1c775b] mb-4">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="text-base font-bold text-[#213b30] mb-2">{feature.title}</h3>
                  <p className="text-sm text-[#777b75] leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-5 lg:px-8 text-white" style={{ backgroundColor: '#152e25' }}>
          <div className="mx-auto max-w-[1200px]">
            <div className="text-center mb-6">
              <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,4vw,36px)] font-bold tracking-[-0.04em] text-white">
                Simple pricing
              </h2>
              <p className="mt-3 text-sm text-[#9aa8a1]">No hidden fees. Pay in JMD.</p>
            </div>

            <div className="mx-auto mb-12 max-w-2xl text-center rounded-xl bg-[#1c4a39] border border-[#2a6650] py-3 px-4">
              <p className="text-sm font-bold text-[#c2f2da]">
                The first five businesses lock in J$4,500/mo — for as long as they stay.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
              {/* Starter */}
              <div className="rounded-3xl border border-[#2a4539] bg-[#1a382d] p-8">
                <h3 className="text-lg font-bold text-white mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">J$7,500</span>
                  <span className="text-sm text-[#8ea098]"> /mo</span>
                  <p className="text-xs text-[#6e857b] mt-1">~US$49/mo</p>
                </div>
                <ul className="space-y-4 text-sm text-[#a3b3ac] mb-8">
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> WhatsApp inbox</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Media library</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Approved FAQs</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Correction loop</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Morning digest</li>
                </ul>
                <Link href="/login" className="block w-full text-center rounded-xl border border-[#305948] bg-transparent px-5 py-3 text-sm font-bold text-white transition hover:bg-[#204234]">
                  Start Starter
                </Link>
              </div>

              {/* Plus */}
              <div className="relative rounded-3xl border-2 border-[#3fc192] bg-[#1c3f32] p-8 lg:-mt-4 lg:mb-4 shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#3fc192] text-[#0d261e] text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                  Most popular
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Plus</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">J$12,500</span>
                  <span className="text-sm text-[#8ea098]"> /mo</span>
                  <p className="text-xs text-[#6e857b] mt-1">~US$79/mo</p>
                </div>
                <ul className="space-y-4 text-sm text-[#a3b3ac] mb-8">
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Everything in Starter</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Instagram DMs</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> One inbox, split by platform</li>
                </ul>
                <Link href="/login" className="block w-full text-center rounded-xl bg-[#3fc192] px-5 py-3 text-sm font-bold text-[#0d261e] transition hover:bg-[#34a87e] shadow-lg">
                  Start Plus
                </Link>
              </div>

              {/* Pro */}
              <div className="rounded-3xl border border-[#2a4539] bg-[#1a382d] p-8">
                <h3 className="text-lg font-bold text-white mb-2">Pro</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-white">J$20,000</span>
                  <span className="text-sm text-[#8ea098]"> /mo</span>
                  <p className="text-xs text-[#6e857b] mt-1">~US$129/mo</p>
                </div>
                <ul className="space-y-4 text-sm text-[#a3b3ac] mb-8">
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Everything in Plus</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> Messenger</li>
                  <li className="flex gap-3"><CheckCircle2 size={16} className="text-[#3fc192] shrink-0" /> A second connected account</li>
                </ul>
                <Link href="/login" className="block w-full text-center rounded-xl border border-[#305948] bg-transparent px-5 py-3 text-sm font-bold text-white transition hover:bg-[#204234]">
                  Start Pro
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#16352b] py-24 px-5 lg:px-8 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(32px,5vw,48px)] font-bold tracking-[-0.04em] text-white leading-tight">
              Ready to stop typing the same answer twice a day?
            </h2>
            <div className="mt-10 flex justify-center">
              <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#1c382d] transition hover:bg-[#f4eee8] hover:-translate-y-0.5 shadow-xl">
                Get started <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e7ddd2] bg-[#fffdfa] py-12 px-5 lg:px-8">
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
          <p className="mt-10 border-t border-[#eee7df] pt-6 text-xs text-[#9a958e]">© 2026 Likkle Table. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
