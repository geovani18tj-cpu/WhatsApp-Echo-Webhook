import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  Info,
  LayoutPanelTop,
  Link2,
  ListFilter,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Conversation = {
  id: string;
  name: string;
  initials: string;
  tone: string;
  preview: string;
  time: string;
  unread?: number;
  status: "needs reply" | "waiting" | "resolved";
  messages: { from: "customer" | "business"; text: string; time: string; read?: boolean }[];
  context: string;
  tag: string;
};

const conversations: Conversation[] = [
  {
    id: "danielle",
    name: "Danielle Brown",
    initials: "DB",
    tone: "bg-[#d7e6df] text-[#1d5b4b]",
    preview: "Wah time yuh reach round Mona?",
    time: "10:42 AM",
    unread: 2,
    status: "needs reply",
    tag: "Delivery",
    context: "Order #1048 · Kingston",
    messages: [
      { from: "customer", text: "Hi, mi would like to order the Sunday lunch box please.", time: "10:36 AM" },
      { from: "business", text: "Sure Danielle. The Sunday lunch box is J$2,850 and serves one. What would you like as your main?", time: "10:38 AM", read: true },
      { from: "customer", text: "Curry goat please, and can I get it delivered to Mona?", time: "10:40 AM" },
      { from: "customer", text: "Wah time yuh reach round Mona?", time: "10:42 AM" },
    ],
  },
  {
    id: "marcus",
    name: "Marcus Williams",
    initials: "MW",
    tone: "bg-[#e8ded3] text-[#7b4a2d]",
    preview: "The jerk chicken was proper!",
    time: "9:18 AM",
    status: "resolved",
    tag: "Feedback",
    context: "Order #1042 · New Kingston",
    messages: [
      { from: "customer", text: "The jerk chicken was proper! Big up the kitchen team.", time: "9:13 AM" },
      { from: "business", text: "Respect Marcus, glad you enjoyed it. We appreciate you taking the time to tell us.", time: "9:18 AM", read: true },
    ],
  },
  {
    id: "keisha",
    name: "Keisha Grant",
    initials: "KG",
    tone: "bg-[#e1e2cf] text-[#526332]",
    preview: "Do you have any dairy-free options?",
    time: "Yesterday",
    status: "waiting",
    tag: "Menu",
    context: "Question · Half Way Tree",
    messages: [
      { from: "customer", text: "Good morning. Do you have any dairy-free options?", time: "Yesterday, 4:28 PM" },
      { from: "business", text: "Morning Keisha. Yes, the ital stew and the rice and peas are dairy-free. I can check today's sides for you.", time: "Yesterday, 4:34 PM", read: true },
    ],
  },
  {
    id: "andre",
    name: "Andre Thompson",
    initials: "AT",
    tone: "bg-[#dbe1ea] text-[#31537b]",
    preview: "Can I pay by bank transfer?",
    time: "Mon",
    status: "resolved",
    tag: "Payment",
    context: "Order #1037 · Constant Spring",
    messages: [
      { from: "customer", text: "Can I pay by bank transfer when I order?", time: "Mon, 11:09 AM" },
      { from: "business", text: "Yes, Andre. We accept NCB and Scotiabank transfers. We will send the details with your order confirmation.", time: "Mon, 11:12 AM", read: true },
    ],
  },
];

const facts = [
  { label: "Opening hours", value: "Mon–Sat, 9:00 am–6:00 pm", note: "Today · Open until 6:00 pm", icon: Clock3 },
  { label: "Delivery areas", value: "Kingston, St. Andrew & Portmore", note: "Typical delivery · 45–75 min", icon: MapPin },
  { label: "Payment methods", value: "Cash, NCB, Scotiabank & card", note: "Payment confirmed before dispatch", icon: ShieldCheck },
  { label: "Business location", value: "14 Lady Musgrave Road, Kingston 5", note: "Pick-up available", icon: LayoutPanelTop },
];

const mediaFiles = [
  { name: "April menu & prices", type: "PDF", detail: "2.4 MB · updated 04 Apr", trigger: "menu, prices, what food" },
  { name: "Delivery zones", type: "PNG", detail: "418 KB · updated 28 Mar", trigger: "delivery area, deliver to" },
];

function Avatar({ initials, tone, small = false }: { initials: string; tone: string; small?: boolean }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.04em] ${small ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs"} ${tone}`}>
      {initials}
    </div>
  );
}

function StatusPill({ status }: { status: Conversation["status"] }) {
  const styles = {
    "needs reply": "border-[#efc4a9] bg-[#fff5ed] text-[#a3542d]",
    waiting: "border-[#e3d8a8] bg-[#fbf8e7] text-[#7b6b2b]",
    resolved: "border-[#bedacb] bg-[#eef8f1] text-[#2d6b4e]",
  };
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${styles[status]}`}>{status}</span>;
}

function FactCard({ label, value, note, icon: Icon, onEdit }: (typeof facts)[number] & { onEdit: () => void }) {
  return (
    <div className="group rounded-2xl border border-[#e7ddd2] bg-[#fffdfa] p-4 transition hover:-translate-y-0.5 hover:border-[#bad5c8] hover:shadow-[0_12px_30px_rgba(49,89,71,0.08)]">
      <div className="mb-3 flex items-start justify-between">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#eaf4ee] text-[#26735b]">
          <Icon size={15} strokeWidth={1.8} />
        </div>
        <button onClick={onEdit} className="rounded-lg p-1.5 text-[#9b958d] opacity-0 transition hover:bg-[#f4eee8] hover:text-[#296d59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] group-hover:opacity-100" aria-label={`Edit ${label}`}>
          <Pencil size={13} />
        </button>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#938b82]">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-[#2b3430]">{value}</p>
      <p className="mt-2 text-[11px] text-[#8a8881]">{note}</p>
    </div>
  );
}

function ConversationRow({ conversation, selected, onSelect }: { conversation: Conversation; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className={`group flex w-full items-start gap-3 border-b border-[#eee7df] px-4 py-4 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#238b68] ${selected ? "bg-[#edf7f1]" : "bg-[#fffdfa] hover:bg-[#faf5ef]"}`}>
      <Avatar initials={conversation.initials} tone={conversation.tone} small />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-bold text-[#26332d]">{conversation.name}</span>
          <span className={`shrink-0 text-[10px] ${selected ? "font-semibold text-[#2d765c]" : "text-[#9b958d]"}`}>{conversation.time}</span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-[#777b75]">{conversation.preview}</span>
          {conversation.unread ? <span className="grid h-4 min-w-4 place-items-center rounded-full bg-[#197b5d] px-1 text-[9px] font-bold text-white">{conversation.unread}</span> : null}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${conversation.status === "needs reply" ? "bg-[#de8154]" : conversation.status === "waiting" ? "bg-[#d8b643]" : "bg-[#56a477]"}`} />
          <span className="text-[10px] font-medium capitalize text-[#97918a]">{conversation.status}</span>
        </span>
      </span>
    </button>
  );
}

export function Experience() {
  const [activeNav, setActiveNav] = useState("Inbox");
  const [activeId, setActiveId] = useState("danielle");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [autoReply, setAutoReply] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [showKnowledge, setShowKnowledge] = useState(true);
  const [savedNotice, setSavedNotice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sentMessages, setSentMessages] = useState<string[]>([]);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];
  const visibleConversations = useMemo(
    () => conversations.filter((conversation) => `${conversation.name} ${conversation.preview} ${conversation.tag}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const selectConversation = (id: string) => {
    setActiveId(id);
    setDraft("");
    setSavedNotice("");
  };

  const sendMessage = () => {
    const value = draft.trim();
    if (!value) return;
    setSentMessages((messages) => [...messages, value]);
    setDraft("");
    setSavedNotice("Reply queued for WhatsApp");
    window.setTimeout(() => setSavedNotice(""), 2400);
  };

  const applySuggestion = (value: string) => {
    setDraft(value);
    setSavedNotice("Suggested reply loaded");
  };

  return (
    <div className="min-h-[100dvh] bg-[#f6f1eb] font-['DM_Sans',ui-sans-serif,system-ui,sans-serif] text-[#26332d]">
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #cbe8d9; color: #173f32; }
        .wa-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
        .wa-scroll::-webkit-scrollbar-thumb { background: #d6cfc6; border-radius: 99px; }
        .wa-scroll::-webkit-scrollbar-track { background: transparent; }
        @keyframes wa-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .wa-rise { animation: wa-rise .45s ease-out both; }
      `}</style>
      <header className="sticky top-0 z-30 border-b border-[#e7ddd2] bg-[#fffdfa]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#1c775b] text-white shadow-[0_6px_16px_rgba(28,119,91,0.22)]">
              <MessageCircle size={21} fill="currentColor" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[15px] font-bold tracking-[-0.03em] text-[#1c382d]">Delegate</p>
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a09990] sm:block">WhatsApp command centre</p>
            </div>
          </div>
          <nav className="hidden items-center gap-1 rounded-xl bg-[#f4eee8] p-1 md:flex" aria-label="Primary">
            {["Inbox", "Knowledge", "Media", "Activity"].map((item) => (
              <button key={item} onClick={() => setActiveNav(item)} className={`rounded-lg px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] ${activeNav === item ? "bg-[#fffdfa] text-[#176b52] shadow-sm" : "text-[#88847e] hover:text-[#38584b]"}`}>
                {item}
                {item === "Inbox" ? <span className="ml-2 rounded-full bg-[#dc8454] px-1.5 py-0.5 text-[9px] text-white">3</span> : null}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setSavedNotice("No new messages")} className="relative rounded-xl p-2.5 text-[#777d76] transition hover:bg-[#f4eee8] hover:text-[#176b52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]" aria-label="Notifications">
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#d9794e]" />
            </button>
            <button onClick={() => setSavedNotice("Settings preview coming next")} className="hidden rounded-xl p-2.5 text-[#777d76] transition hover:bg-[#f4eee8] hover:text-[#176b52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] sm:block" aria-label="Settings">
              <Settings2 size={17} />
            </button>
            <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-[#d8c7ad] text-[10px] font-bold text-[#684f32]">KS</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <section className="wa-rise mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#a29b92]">
              <span>Tuesday, 16 April 2024</span><span className="h-1 w-1 rounded-full bg-[#c5bcb2]" /><span className="text-[#328062]">Kingston · Open</span>
            </div>
            <h1 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,3vw,42px)] font-bold tracking-[-0.065em] text-[#213b30]">Good morning, Kendra.</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#777b75]">Your front desk is clear on what to say, and ready for what comes in next.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-[#d8e4dc] bg-[#eef7f0] px-3 py-2.5 text-xs text-[#397158]">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ca475] opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ca475]" /></span>
            <span><strong className="font-bold">WhatsApp connected</strong> · replies are protected by your facts</span>
          </div>
        </section>

        <section className="wa-rise grid gap-4 lg:grid-cols-[minmax(210px,0.85fr)_minmax(410px,1.65fr)_minmax(260px,0.92fr)]" style={{ animationDelay: "70ms" }}>
          <aside className="flex min-h-[700px] flex-col overflow-hidden rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(73,60,46,0.05)]">
            <div className="border-b border-[#eee7df] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-lg font-bold tracking-[-0.04em] text-[#293d33]">Inbox</h2>
                  <p className="mt-0.5 text-[11px] text-[#9a958e]">12 conversations today</p>
                </div>
                <button onClick={() => setFilterOpen((open) => !open)} className={`rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] ${filterOpen ? "bg-[#eaf4ee] text-[#207357]" : "text-[#8c8b84] hover:bg-[#f4eee8]"}`} aria-label="Filter conversations">
                  <ListFilter size={16} />
                </button>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-[#e8dfd6] bg-[#faf7f3] px-3 py-2.5 text-[#9b978f] focus-within:border-[#77b79b] focus-within:ring-2 focus-within:ring-[#d7eee0]">
                <Search size={14} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-[#40514a] outline-none placeholder:text-[#aaa39a]" placeholder="Search conversations" aria-label="Search conversations" />
                {search ? <button onClick={() => setSearch("")} className="rounded p-0.5 hover:bg-[#eee6dd]" aria-label="Clear search"><X size={12} /></button> : null}
              </label>
              {filterOpen ? <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#f8f2ea] px-3 py-2 text-[11px] text-[#7f7b73]"><Filter size={12} className="text-[#26735b]" /> Showing all open conversations <ChevronDown size={12} className="ml-auto" /></div> : null}
            </div>
            <div className="wa-scroll flex-1 overflow-y-auto">
              {visibleConversations.length ? visibleConversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id === activeId} onSelect={() => selectConversation(conversation.id)} />) : <div className="p-8 text-center"><Search className="mx-auto mb-3 text-[#b7aea4]" size={22} /><p className="text-xs font-semibold text-[#6f756e]">No conversations found</p><p className="mt-1 text-[11px] text-[#aaa39a]">Try a name, tag, or message.</p></div>}
            </div>
            <div className="border-t border-[#eee7df] p-3">
              <button onClick={() => setSavedNotice("New conversation flow opened")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#cbd9d1] bg-[#f4faf5] py-2.5 text-xs font-bold text-[#2b775c] transition hover:border-[#77b79b] hover:bg-[#e9f5ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Plus size={14} /> Start a conversation</button>
            </div>
          </aside>

          <section className="flex min-h-[700px] flex-col overflow-hidden rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(73,60,46,0.05)]">
            <div className="flex items-center justify-between border-b border-[#eee7df] px-4 py-3.5 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar initials={activeConversation.initials} tone={activeConversation.tone} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold text-[#26372f]">{activeConversation.name}</h2><span className="hidden rounded-full bg-[#f2eee9] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#918a81] sm:inline">{activeConversation.tag}</span></div>
                  <p className="mt-0.5 truncate text-[11px] text-[#99948d]">{activeConversation.context} <span className="mx-1 text-[#c8c0b8]">·</span> WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setSavedNotice("Conversation marked resolved")} className="hidden rounded-lg px-2.5 py-2 text-[11px] font-bold text-[#31745a] transition hover:bg-[#edf7f1] sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]">Resolve</button>
                <button onClick={() => setSavedNotice("More conversation actions")} className="rounded-lg p-2 text-[#928e87] transition hover:bg-[#f4eee8] hover:text-[#4f6058] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><MoreHorizontal size={17} /></button>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-[#f0e9e1] bg-[#fdf9f4] px-5 py-2.5 text-[10px]">
              <span className="flex items-center gap-1.5 text-[#8d8981]"><ShieldCheck size={13} className="text-[#378363]" /> AI can only use approved business facts</span>
              <button onClick={() => setShowContext((open) => !open)} className="font-bold text-[#34775d] hover:text-[#1c6049] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]">{showContext ? "Hide details" : "Show details"}</button>
            </div>
            <div className="wa-scroll flex-1 space-y-4 overflow-y-auto bg-[#fbf8f4] px-4 py-5 sm:px-8">
              <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#f0ebe4] px-3 py-1 text-[10px] font-semibold text-[#9a948b]"><Clock3 size={11} /> Today</div>
              <div className="mx-auto max-w-[540px] rounded-xl border border-[#e2dbd3] bg-[#f6f0e8] px-3.5 py-2.5 text-center text-[11px] leading-5 text-[#817c74]"><Info size={12} className="mr-1 inline text-[#a36b43]" /> This customer is asking about an order. Keep the reply warm and specific.</div>
              {activeConversation.messages.map((message, index) => (
                <div key={`${activeConversation.id}-${index}`} className={`flex ${message.from === "customer" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[68%] ${message.from === "customer" ? "rounded-tl-md border border-[#e4dbd2] bg-[#fffdfa]" : "rounded-tr-md border border-[#b8ddc7] bg-[#dff3e5]"}`}>
                    <p className="text-[13px] leading-5 text-[#35413b]">{message.text}</p>
                    <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${message.from === "customer" ? "text-[#a19b93]" : "text-[#73947f]"}`}><span>{message.time}</span>{message.from === "business" ? <Check size={12} className={message.read ? "text-[#278661]" : ""} /> : null}</div>
                  </div>
                </div>
              ))}
              {sentMessages.map((message, index) => <div key={`sent-${index}`} className="flex justify-end"><div className="max-w-[68%] rounded-2xl rounded-tr-md border border-[#b8ddc7] bg-[#dff3e5] px-4 py-3 shadow-sm"><p className="text-[13px] leading-5 text-[#35413b]">{message}</p><div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px] text-[#73947f]"><span>Just now</span><Check size={12} className="text-[#278661]" /></div></div></div>)}
            </div>
            <div className="border-t border-[#eee7df] bg-[#fffdfa] p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <button onClick={() => applySuggestion("Hi Danielle, we can reach Mona between 12:30 and 1:30 pm today. Does that work for you?")} className="rounded-full border border-[#d6e5dc] bg-[#f4faf5] px-3 py-1.5 text-[10px] font-semibold text-[#37765d] transition hover:border-[#9ac9ae] hover:bg-[#eaf6ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Sparkles size={11} className="mr-1 inline" /> Suggest delivery reply</button>
                <button onClick={() => applySuggestion("I can confirm that for you. One moment while I check today's availability.")} className="rounded-full border border-[#e8ddd2] bg-[#faf7f3] px-3 py-1.5 text-[10px] font-semibold text-[#7f766d] transition hover:border-[#c7b8a8] hover:bg-[#f5eee7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]">Buy a moment</button>
              </div>
              <div className="flex items-end gap-2 rounded-2xl border border-[#dcd5cc] bg-[#fffdfa] p-2 transition focus-within:border-[#77b79b] focus-within:ring-2 focus-within:ring-[#d7eee0]">
                <button onClick={() => setSavedNotice("Attachment picker opened")} className="rounded-xl p-2 text-[#9a958c] transition hover:bg-[#f3eee8] hover:text-[#33785c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Paperclip size={16} /></button>
                <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} className="max-h-20 min-h-[38px] flex-1 resize-none bg-transparent px-1 py-2 text-xs leading-5 text-[#3a4841] outline-none placeholder:text-[#a6a098]" placeholder="Write a reply in your voice…" aria-label="Write a reply" />
                <button onClick={sendMessage} disabled={!draft.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-[#1d795b] text-white transition hover:bg-[#145d46] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Send size={15} /></button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-[#a29c94]"><span>Press Enter to send · Shift + Enter for a new line</span>{savedNotice ? <span className="font-semibold text-[#3c825f]">{savedNotice}</span> : <span className="flex items-center gap-1"><ShieldCheck size={11} /> Human approval on</span>}</div>
            </div>
          </section>

          <aside className="min-h-[700px] space-y-4">
            <div className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(73,60,46,0.05)]">
              <button onClick={() => setShowContext((open) => !open)} className="flex w-full items-center justify-between border-b border-[#eee7df] px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#238b68]">
                <span className="flex items-center gap-2 text-xs font-bold text-[#37463f]"><LayoutPanelTop size={15} className="text-[#358263]" /> Conversation context</span><ChevronDown size={15} className={`text-[#a39b92] transition ${showContext ? "rotate-180" : ""}`} />
              </button>
              {showContext ? <div className="space-y-3 p-4">
                <div className="rounded-xl bg-[#f8f3ed] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b9188]">Customer note</p><p className="mt-1.5 text-xs leading-5 text-[#5d665f]">Prefers delivery updates before dispatch. Address saved in order notes.</p></div>
                <div className="flex items-center gap-2 text-[11px] text-[#777d76]"><Tag size={13} className="text-[#c0784f]" /> Repeat customer · 4 orders</div>
                <div className="flex items-center gap-2 text-[11px] text-[#777d76]"><MapPin size={13} className="text-[#5d8a77]" /> Mona, Kingston 6</div>
              </div> : null}
            </div>

            <div className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] shadow-[0_10px_32px_rgba(73,60,46,0.05)]">
              <div className="flex items-center justify-between border-b border-[#eee7df] px-4 py-3.5">
                <button onClick={() => setShowKnowledge((open) => !open)} className="flex items-center gap-2 text-xs font-bold text-[#37463f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><BookOpen size={15} className="text-[#358263]" /> Approved knowledge</button>
                <button onClick={() => setSavedNotice("Knowledge editor opened")} className="rounded-lg p-1.5 text-[#9d968e] transition hover:bg-[#f4eee8] hover:text-[#30765a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Plus size={15} /></button>
              </div>
              {showKnowledge ? <div className="p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-[11px] text-[#8a8982]">4 facts active</p><span className="flex items-center gap-1 text-[10px] font-semibold text-[#478162]"><span className="h-1.5 w-1.5 rounded-full bg-[#58a879]" /> Synced</span></div>
                <div className="space-y-2.5">{facts.map((fact) => <FactCard key={fact.label} {...fact} onEdit={() => setSavedNotice(`${fact.label} ready to edit`)} />)}</div>
                <button onClick={() => setSavedNotice("All knowledge opened")} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-bold text-[#36785d] transition hover:bg-[#eff8f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]">View all facts <ChevronRight size={13} /></button>
              </div> : null}
            </div>
          </aside>
        </section>

        <section className="wa-rise mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" style={{ animationDelay: "140ms" }}>
          <div className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5 shadow-[0_10px_32px_rgba(73,60,46,0.04)] sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a29a91]">Trust controls</p><h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-xl font-bold tracking-[-0.04em] text-[#2b4035]">Keep the human in the loop.</h2><p className="mt-1 max-w-md text-xs leading-5 text-[#85847d]">Del, your business's AI assistant, can draft replies from your knowledge. You decide what leaves the front desk.</p></div>
              <button onClick={() => setAutoReply((enabled) => !enabled)} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] ${autoReply ? "bg-[#23815f]" : "bg-[#cbc7c0]"}`} aria-label={autoReply ? "Turn Del off" : "Turn Del on"}><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${autoReply ? "translate-x-5" : "translate-x-0"}`} /></button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { icon: Bot, title: "Drafts from facts", copy: "No guessing on hours, prices, or places." },
                { icon: ShieldCheck, title: "Approval required", copy: "A person checks every customer reply." },
                { icon: CircleHelp, title: "Escalates kindly", copy: "Unknown questions come back to you." },
              ].map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-xl border border-[#eee6de] bg-[#fcfaf7] p-3.5"><Icon size={16} className="mb-2 text-[#3b8366]" /><p className="text-xs font-bold text-[#46554d]">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#929089]">{copy}</p></div>)}
            </div>
          </div>
          <div className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5 shadow-[0_10px_32px_rgba(73,60,46,0.04)] sm:p-6">
            <div className="mb-5 flex items-start justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a29a91]">Today at a glance</p><h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-xl font-bold tracking-[-0.04em] text-[#2b4035]">A steady front desk.</h2></div><div className="grid h-8 w-8 place-items-center rounded-xl bg-[#f5eee3] text-[#ad7346]"><Star size={15} fill="currentColor" /></div></div>
            <div className="grid grid-cols-3 gap-2">
              {[{ value: "18", label: "conversations" }, { value: "11", label: "replied" }, { value: "3", label: "need you" }].map((item) => <div key={item.label} className="rounded-xl bg-[#f8f4ef] p-3 text-center"><p className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-2xl font-bold tracking-[-0.06em] text-[#2e5947]">{item.value}</p><p className="mt-0.5 text-[10px] text-[#918c84]">{item.label}</p></div>)}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-[#88867f]"><span className="flex items-center gap-1.5"><ArrowDownLeft size={13} className="text-[#d27b53]" /> 6 new since 9:00 am</span><button onClick={() => setActiveNav("Activity")} className="font-bold text-[#34775d] hover:text-[#1e604a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]">See activity <ArrowUpRight size={12} className="ml-0.5 inline" /></button></div>
          </div>
        </section>

        <section className="wa-rise mt-5 rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5 shadow-[0_10px_32px_rgba(73,60,46,0.04)] sm:p-6" style={{ animationDelay: "210ms" }}>
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a29a91]">Media library</p><h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-xl font-bold tracking-[-0.04em] text-[#2b4035]">The things customers ask to see.</h2><p className="mt-1 text-xs text-[#85847d]">Files Del can confidently share when the words match.</p></div><button onClick={() => setSavedNotice("Upload flow opened")} className="flex w-fit items-center gap-2 rounded-xl bg-[#edf7f0] px-3.5 py-2.5 text-xs font-bold text-[#2e7559] transition hover:bg-[#e0f1e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68]"><Plus size={14} /> Add media</button></div>
          <div className="grid gap-3 md:grid-cols-2">
            {mediaFiles.map((file) => <div key={file.name} className="group flex items-center gap-3 rounded-xl border border-[#eee6de] bg-[#fcfaf7] p-3.5 transition hover:border-[#b9d7c5] hover:bg-[#f6fbf7]"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e8dd] text-[#b16b44]"><FileText size={19} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#47544d]">{file.name}</p><p className="mt-1 text-[10px] text-[#969088]">{file.type} · {file.detail}</p><p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#5f8975]"><Link2 size={11} /> “{file.trigger}”</p></div><button onClick={() => setSavedNotice(`${file.name} options opened`)} className="rounded-lg p-2 text-[#a29b93] opacity-0 transition hover:bg-[#e9f4ec] hover:text-[#2f765a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#238b68] group-hover:opacity-100" aria-label={`More options for ${file.name}`}><MoreHorizontal size={16} /></button></div>)}
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-[1480px] items-center justify-between px-6 pb-8 pt-2 text-[10px] text-[#aaa39a] lg:px-8"><span>Delegate · Built for the busy bits between orders.</span><span className="hidden items-center gap-1.5 sm:flex"><ShieldCheck size={11} /> Your business facts are in control</span></footer>
    </div>
  );
}