import { Link, useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // real auth (a business_users table, password hashing, sessions) is a separate task, not covered here.
    setLocation("/inbox");
  };

  return (
    <div className="min-h-[100dvh] flex font-['DM_Sans',ui-sans-serif,system-ui,sans-serif]">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] max-w-[600px] p-12 text-white relative overflow-hidden" style={{ backgroundColor: '#16352b' }}>
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ backgroundColor: '#1c4a39' }}></div>
        
        <div className="relative z-10">
          <Logo light />
          
          <div className="mt-32">
            <h1 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-4xl font-bold leading-[1.1] tracking-[-0.04em] text-white">
              Your customers' messages, answered the way you'd answer them.
            </h1>
            
            <ul className="mt-10 space-y-5 text-[#a3b3ac] text-sm">
              <li className="flex gap-4 items-start">
                <CheckCircle2 size={20} className="text-[#3fc192] shrink-0 mt-0.5" />
                <span>Same WhatsApp number your customers already have</span>
              </li>
              <li className="flex gap-4 items-start">
                <CheckCircle2 size={20} className="text-[#3fc192] shrink-0 mt-0.5" />
                <span>Nothing goes out that you didn't write yourself</span>
              </li>
              <li className="flex gap-4 items-start">
                <CheckCircle2 size={20} className="text-[#3fc192] shrink-0 mt-0.5" />
                <span>One inbox, WhatsApp and Instagram side by side</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 text-sm font-semibold text-[#8ea098]">
          Built in Kingston, for Kingston wholesalers.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-5 py-12 lg:px-12 bg-[#faf7f3]">
        <div className="lg:hidden mb-12">
          <Logo />
        </div>
        
        <div className="mx-auto w-full max-w-[420px] bg-[#fffdfa] border border-[#e5dbd1] rounded-3xl p-8 lg:p-10 shadow-[0_16px_42px_rgba(73,60,46,0.06)] wa-rise">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#2a7a5d] mb-3">Log in</p>
          <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-3xl font-bold tracking-[-0.05em] text-[#213b30] mb-8">
            Welcome back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#938b82] mb-2">Email address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-4 py-3 text-sm text-[#26332d] outline-none transition focus:border-[#67a98b] focus:bg-white" 
                placeholder="you@business.com" 
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#938b82]">Password</label>
                <button type="button" className="text-xs font-semibold text-[#1c775b] hover:text-[#145d46]">Forgot password?</button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-4 py-3 text-sm text-[#26332d] outline-none transition focus:border-[#67a98b] focus:bg-white" 
                placeholder="••••••••" 
              />
            </div>

            <button type="submit" className="w-full rounded-xl bg-[#1c775b] py-3.5 text-sm font-bold text-white transition hover:bg-[#145d46] shadow-[0_4px_12px_rgba(28,119,91,0.2)] mt-2">
              Log in
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e5dbd1]"></div></div>
            <span className="relative bg-[#fffdfa] px-3 text-[11px] font-bold uppercase tracking-widest text-[#a29b92]">Or</span>
          </div>

          <button type="button" className="w-full rounded-xl border border-[#d8cec3] bg-transparent py-3.5 text-sm font-bold text-[#38584b] transition hover:bg-[#f4eee8]">
            Email me a login link
          </button>

          <p className="mt-8 text-center text-sm text-[#777b75]">
            New to Delegate?{" "}
            <Link href="/" className="font-bold text-[#1c775b] hover:text-[#145d46]">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
