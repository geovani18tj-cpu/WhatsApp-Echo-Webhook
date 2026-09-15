import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import {
  AlertCircle, Bell, BookOpen, Bot, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FileText, Filter, Info, Instagram, LayoutPanelTop, ListFilter, Loader2, MapPin, MessageCircle, MoreHorizontal, Paperclip, Pencil, Plus, Search, Send, Settings2, Share2, ShieldCheck, Sparkles, Star, Tag, X, FileUp
} from "lucide-react";
import {
  getHealthCheckQueryKey,
  useHealthCheck,
  useSaveBusinessFact,
} from "@workspace/api-client-react";
import { DelChat, useDelDraft, type DraftKnowledgeProps, type Proposal } from "@/components/draft-studio";
import { Logo } from "@/components/logo";
import { DelAvatar } from "@/components/del-avatar";
import { StatTile, StatusPill } from "@/components/dashboard-ui";

type Conversation = {
  id: string;
  channel: "whatsapp" | "instagram";
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
    channel: "whatsapp",
    name: "Danielle Brown",
    initials: "DB",
    tone: "bg-green-100 text-green-700",
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
    channel: "instagram",
    name: "Marcus Williams",
    initials: "MW",
    tone: "bg-neutral-200 text-neutral-900",
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
    channel: "whatsapp",
    name: "Keisha Grant",
    initials: "KG",
    tone: "bg-neutral-100 text-neutral-900",
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
    channel: "whatsapp",
    name: "Andre Thompson",
    initials: "AT",
    tone: "bg-green-100 text-green-700",
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

const initialFacts = [
  { key: "hours", label: "Opening hours", value: "Mon–Sat, 9:00 am–6:00 pm", note: "Today · Open until 6:00 pm", icon: Clock3 },
  { key: "areas", label: "Delivery areas", value: "Kingston, St. Andrew & Portmore", note: "Typical delivery · 45–75 min", icon: MapPin },
  { key: "payment", label: "Payment methods", value: "Cash, NCB, Scotiabank & card", note: "Payment confirmed before dispatch", icon: ShieldCheck },
  { key: "location", label: "Business location", value: "14 Lady Musgrave Road, Kingston 5", note: "Pick-up available", icon: LayoutPanelTop },
];

const mediaFiles = [
  { name: "April menu & prices", type: "PDF", detail: "2.4 MB · updated 04 Apr", trigger: "menu, prices, what food" },
  { name: "Delivery zones", type: "PNG", detail: "418 KB · updated 28 Mar", trigger: "delivery area, deliver to" },
];

const initialApprovedAnswers = [
  {
    id: "delivery",
    question: "Where do you deliver?",
    answer: "We deliver across Kingston, St. Andrew and Portmore. Delivery usually takes 45–75 minutes.",
    triggers: ["delivery", "deliver to", "Portmore"],
  },
  {
    id: "payment",
    question: "How can I pay?",
    answer: "We accept cash, NCB and Scotiabank transfers, and card payments.",
    triggers: ["pay", "bank transfer", "card"],
  },
];

function Avatar({ initials, tone, small = false }: { initials: string; tone: string; small?: boolean }) {
  return (
    <div className={`grid shrink-0 place-items-center rounded-full font-semibold tracking-[-0.04em] ${small ? "h-8 w-8 text-[13px]" : "h-10 w-10 text-[13px]"} ${tone}`} data-testid={`avatar-${initials}`}>
      {initials}
    </div>
  );
}

function ConversationRow({ conversation, selected, onSelect }: { conversation: Conversation; selected: boolean; onSelect: () => void }) {
  return (
    <button data-testid={`conversation-row-${conversation.id}`} onClick={onSelect} className={`group flex w-full items-start gap-3 border-b border-neutral-200 px-4 py-4 text-left transition focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700 ${selected ? "bg-neutral-100" : "bg-cream-50 hover:bg-neutral-100"}`}>
      <Avatar initials={conversation.initials} tone={conversation.tone} small />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[13px] font-bold text-green-900">{conversation.name}</span>
          <span className={`shrink-0 text-[13px] ${selected ? "font-semibold text-green-700" : "text-neutral-500"}`}>{conversation.time}</span>
        </span>
        <span className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[13px] text-neutral-500">{conversation.preview}</span>
          {conversation.unread ? <span className="grid h-4 min-w-4 place-items-center rounded-full bg-green-700 px-1 text-[13px] font-bold text-white" data-testid={`unread-badge-${conversation.id}`}>{conversation.unread}</span> : null}
        </span>
        <span className="mt-2 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${conversation.status === "needs reply" ? "bg-orange-600" : conversation.status === "waiting" ? "bg-warning" : "bg-green-500"}`} />
          <span className="text-[13px] font-medium capitalize text-neutral-500">{conversation.status}</span>
        </span>
      </span>
    </button>
  );
}

function FactCardSmall({ fact, index, onNotice }: { fact: any, index: number, onNotice: (s:string) => void }) {
  const { register, watch, setValue } = useFormContext();
  const [isEditing, setIsEditing] = useState(false);
  const saveFact = useSaveBusinessFact();

  const handleSave = () => {
     const value = watch(`facts.${index}.value`);
     saveFact.mutate({ data: { key: fact.key, value } }, {
       onSuccess: () => {
         setIsEditing(false);
         onNotice(`${fact.label} updated`);
       }
     });
  };

  const Icon = initialFacts[index].icon;

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-cream-50 p-4 transition hover:-translate-y-0.5 hover:border-green-500 hover:shadow-[0_12px_30px_rgba(49,89,71,0.08)]">
      <div className="mb-3 flex items-start justify-between">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-green-100 text-green-700">
          <Icon size={15} strokeWidth={1.8} />
        </div>
        {!isEditing && (
          <button data-testid={`btn-edit-fact-${fact.key}`} onClick={() => setIsEditing(true)} className="rounded-lg p-1.5 text-neutral-500 opacity-0 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 group-hover:opacity-100" aria-label={`Edit ${fact.label}`}>
            <Pencil size={13} />
          </button>
        )}
      </div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-neutral-500">{fact.label}</p>
      
      {isEditing ? (
        <div className="mt-2 space-y-2 wa-rise">
           <textarea {...register(`facts.${index}.value`)} className="w-full bg-cream-50 border border-neutral-200 rounded p-1.5 text-[13px] text-green-900 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500" autoFocus rows={2} data-testid={`input-fact-${fact.key}`} />
           <div className="flex gap-2">
             <button onClick={() => { setValue(`facts.${index}.value`, fact.value); setIsEditing(false); }} className="flex-1 py-1 text-[13px] font-semibold text-neutral-500 bg-neutral-100 rounded transition hover:bg-neutral-200" data-testid={`btn-cancel-fact-${fact.key}`}>Cancel</button>
             <button onClick={handleSave} disabled={saveFact.isPending} className="flex-1 py-1 text-[13px] font-bold bg-green-700 text-white rounded transition hover:brightness-90 flex items-center justify-center gap-1" data-testid={`btn-save-fact-${fact.key}`}>
               {saveFact.isPending && <span className="h-2.5 w-2.5 border border-white/40 border-t-white rounded-full animate-spin" />} Save
             </button>
           </div>
        </div>
      ) : (
        <p className="mt-1 text-sm font-semibold leading-5 text-green-900" data-testid={`text-fact-${fact.key}`}>{watch(`facts.${index}.value`)}</p>
      )}
      {!isEditing && <p className="mt-2 text-[13px] text-neutral-500">{fact.note}</p>}
    </div>
  );
}

function FactCardLarge({ index, fact, onNotice }: { index: number, fact: any, onNotice: (s:string) => void }) {
  const { register, watch, setValue } = useFormContext();
  const [isEditing, setIsEditing] = useState(false);
  const saveFact = useSaveBusinessFact();

  const handleSave = () => {
     const value = watch(`facts.${index}.value`);
     saveFact.mutate({ data: { key: fact.key, value } }, {
       onSuccess: () => {
         setIsEditing(false);
         onNotice(`${fact.label} updated`);
       }
     });
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-cream-50 p-4 shadow-sm transition hover:border-green-500">
       <div className="flex justify-between items-start mb-2">
         <p className="text-[13px] font-semibold uppercase tracking-[0.13em] text-neutral-500">{fact.label}</p>
         {!isEditing && (
           <button data-testid={`btn-edit-fact-${fact.key}-large`} onClick={() => setIsEditing(true)} className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-green-700 transition"><Pencil size={12} /></button>
         )}
       </div>
       {isEditing ? (
         <div className="mt-2 space-y-3 wa-rise">
           <textarea {...register(`facts.${index}.value`)} className="w-full min-h-[60px] bg-cream-50 border border-neutral-200 rounded-lg p-2 text-sm text-green-900 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500" autoFocus data-testid={`input-fact-${fact.key}-large`} />
           <div className="flex gap-2 justify-end">
             <button onClick={() => { setValue(`facts.${index}.value`, fact.value); setIsEditing(false); }} className="px-3 py-1.5 text-[13px] font-semibold text-neutral-500 hover:bg-neutral-100 rounded-md transition" data-testid={`btn-cancel-fact-${fact.key}-large`}>Cancel</button>
             <button onClick={handleSave} disabled={saveFact.isPending} className="px-3 py-1.5 text-[13px] font-bold bg-green-700 text-white rounded-md hover:brightness-90 transition flex items-center gap-1.5" data-testid={`btn-save-fact-${fact.key}-large`}>
               {saveFact.isPending && <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />} Save fact
             </button>
           </div>
         </div>
       ) : (
         <>
           <p className="text-sm font-semibold leading-5 text-green-900" data-testid={`text-fact-${fact.key}-large`}>{watch(`facts.${index}.value`)}</p>
           <p className="mt-2 text-[13px] text-neutral-500">{fact.note}</p>
         </>
       )}
    </div>
  )
}

type ApprovedMedia = { name: string; type: string; detail: string; trigger: string };

function MediaPanel({ setSavedNotice, approvedMedia = [], embedded = false }: { setSavedNotice: (s: string) => void; approvedMedia?: ApprovedMedia[]; embedded?: boolean }) {
  const { register, watch, setValue, resetField } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const [mediaList, setMediaList] = useState(mediaFiles);

  useEffect(() => {
    setMediaList((current) => {
      const additions = approvedMedia.filter((item) => !current.some((existing) => existing.name === item.name && existing.detail === item.detail));
      return additions.length ? [...current, ...additions] : current;
    });
  }, [approvedMedia]);
  
  const file = watch("mediaUpload.file");
  const label = watch("mediaUpload.label");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !label) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('label', label);
      formData.append('triggers', watch("mediaUpload.triggers") || '');
      formData.append('file', file);
      
      const res = await fetch('/api/media', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      
      setMediaList([...mediaList, { name: label, type: file.name.split('.').pop()?.toUpperCase() || 'FILE', detail: `${(file.size/1024/1024).toFixed(1)} MB · just now`, trigger: watch("mediaUpload.triggers") }]);
      resetField("mediaUpload");
      setSavedNotice("Media uploaded successfully");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch(err) {
      setSavedNotice("Error uploading media");
      setTimeout(() => setSavedNotice(""), 3000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={embedded ? "" : "flex flex-col h-full bg-cream-50 rounded-card border border-neutral-200 shadow-card overflow-hidden"}>
       {!embedded && <div className="p-4 sm:p-6 border-b border-neutral-200">
         <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-green-900">Media Library</h2>
         <p className="text-[13px] text-neutral-500 mt-1">Upload menus, maps, and guides for Del, your business's AI assistant, to share.</p>
       </div>}
       <div className={embedded ? "space-y-5" : "p-4 sm:p-6 flex-1 wa-scroll overflow-y-auto space-y-5"}>
         <form onSubmit={onSubmit} className="bg-neutral-100 p-4 rounded-xl border border-neutral-200 space-y-3" data-testid="form-upload-media">
           <p className="text-[13px] font-bold text-green-700 mb-2 flex items-center gap-2"><FileUp size={14} className="text-warning" /> Upload new media</p>
           
           <div className="grid sm:grid-cols-2 gap-3">
             <label className="block">
               <span className="text-[13px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 block">Label</span>
               <input {...register("mediaUpload.label")} className="w-full bg-cream-50 border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-green-900 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500" placeholder="e.g. May Menu" required data-testid="input-media-label" />
             </label>
             <label className="block">
               <span className="text-[13px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 block">Keywords (optional)</span>
               <input {...register("mediaUpload.triggers")} className="w-full bg-cream-50 border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-green-900 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500" placeholder="e.g. food, prices" data-testid="input-media-triggers" />
             </label>
           </div>
           <label className="block">
               <span className="text-[13px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5 block">File</span>
               <input type="file" onChange={(e) => setValue('mediaUpload.file', e.target.files?.[0])} className="w-full text-[13px] text-neutral-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[13px] file:font-semibold file:bg-green-700 file:text-white hover:file:bg-green-700" required data-testid="input-media-file" />
           </label>
           
           <div className="pt-2 flex justify-end">
             <button type="submit" disabled={uploading || !file || !label} className="bg-green-700 text-white text-[13px] font-bold px-4 py-2 rounded-lg transition hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" data-testid="btn-upload-media">
               {uploading && <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
               {uploading ? "Uploading..." : "Upload file"}
             </button>
           </div>
         </form>

         <div className="space-y-2">
           <h3 className="text-[13px] font-bold text-green-900 mb-3">Available files</h3>
           {mediaList.map((m, i) => (
             <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-white transition hover:border-green-500" data-testid={`media-row-${i}`}>
                <div className="h-10 w-10 shrink-0 grid place-items-center rounded-lg bg-neutral-100 text-green-700 font-bold text-[13px]">{m.type}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-green-900 truncate">{m.name}</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">{m.detail}</p>
                </div>
                {m.trigger && <div className="hidden sm:flex text-[13px] text-neutral-500 items-center gap-1 bg-neutral-100 px-2 py-1 rounded-md"><Tag size={10} /> {m.trigger}</div>}
             </div>
           ))}
         </div>
       </div>
    </div>
  )
}

function KnowledgePanel({ setSavedNotice, embedded = false }: { setSavedNotice: (s: string) => void; embedded?: boolean }) {
  const { watch } = useFormContext();
  const facts = watch("facts");

  return (
    <div className={embedded ? "" : "flex flex-col h-full bg-cream-50 rounded-card border border-neutral-200 shadow-card overflow-hidden"}>
       {!embedded && <div className="p-4 sm:p-6 border-b border-neutral-200 flex justify-between items-center">
         <div>
           <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-green-900">Knowledge Base</h2>
           <p className="text-[13px] text-neutral-500 mt-1">Facts Del uses to answer questions reliably.</p>
         </div>
         <span className="flex items-center gap-1.5 text-[13px] font-semibold text-green-500 bg-neutral-100 px-2.5 py-1.5 rounded-full"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {facts.length} active facts</span>
       </div>}
       <div className={embedded ? "space-y-3" : "p-4 sm:p-6 flex-1 wa-scroll overflow-y-auto space-y-3"}>
         {facts.map((fact: any, index: number) => (
            <FactCardLarge key={fact.key} index={index} fact={fact} onNotice={setSavedNotice} />
         ))}
       </div>
    </div>
  )
}

function KnowledgeSection({
  title,
  description,
  icon: Icon,
  testId,
  children,
}: {
  title: string;
  description: string;
  icon: typeof BookOpen;
  testId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-cream-50" data-testid={testId}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700"
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-green-100 text-green-700"><Icon size={17} /></span>
          <span>
            <span className="block text-sm font-bold text-green-900">{title}</span>
            <span className="mt-0.5 block text-[13px] text-neutral-500">{description}</span>
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-neutral-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-neutral-200 bg-cream-50 p-4">{children}</div>}
    </section>
  );
}

function ProposalCard({
  proposal,
  file,
  setProposalFile,
  approveProposal,
  discardProposal,
}: {
  proposal: Proposal;
  file?: File;
  setProposalFile: (id: string, file: File | undefined) => void;
  approveProposal: (proposal: Proposal) => void;
  discardProposal: (id: string) => void;
}) {
  return (
    <div className="mb-3 rounded-xl border border-orange-100 bg-cream-50 p-3.5 shadow-sm" data-testid={`del-draft-${proposal.id}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-md bg-orange-100 px-2 py-1 text-[13px] font-bold uppercase tracking-wider text-neutral-900">Pending draft</span>
        <span className="text-[13px] font-semibold capitalize text-neutral-500">{proposal.type}</span>
      </div>
      {proposal.type === "fact" && (
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wider text-neutral-500">{proposal.label}</p>
          <p className="mt-1 text-sm font-semibold text-green-900">{proposal.value}</p>
        </div>
      )}
      {proposal.type === "faq" && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-green-900">{proposal.question}</p>
          <p className="text-[13px] leading-5 text-neutral-500">{proposal.answer}</p>
        </div>
      )}
      {proposal.type === "media" && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-green-900">{proposal.label}</p>
          <label className="block">
            <span className="mb-1 block text-[13px] font-bold uppercase tracking-wider text-neutral-500">Choose file before approval</span>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(event) => setProposalFile(proposal.id, event.target.files?.[0])}
              className="w-full text-[13px] text-neutral-500 file:mr-2 file:rounded-md file:border-0 file:bg-neutral-100 file:px-2.5 file:py-1.5 file:text-[13px] file:font-bold file:text-green-700"
              data-testid={`input-del-draft-file-${proposal.id}`}
            />
          </label>
        </div>
      )}
      {proposal.triggers?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {proposal.triggers.map((trigger) => <span key={trigger} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[13px] text-neutral-500">{trigger}</span>)}
        </div>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => discardProposal(proposal.id)} disabled={proposal.status !== "pending"} className="flex-1 rounded-lg bg-neutral-200 py-2 text-[13px] font-semibold text-neutral-500 disabled:opacity-50">Discard</button>
        <button
          type="button"
          onClick={() => approveProposal(proposal)}
          disabled={proposal.status !== "pending" || (proposal.type === "media" && !file)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-700 py-2 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
          data-testid={`btn-approve-del-draft-${proposal.id}`}
        >
          {proposal.status === "saving" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {proposal.status === "saving" ? "Approving…" : "Approve"}
        </button>
      </div>
      {proposal.status === "error" && <p className="mt-2 flex items-center gap-1 text-[13px] text-danger"><AlertCircle size={11} /> Approval failed. Check the details and try again.</p>}
    </div>
  );
}

function DelKnowledgePanel({
  setSavedNotice,
  approvedAnswers,
  approvedMedia,
  proposals,
  proposalFiles,
  setProposalFile,
  approveProposal,
  discardProposal,
}: DraftKnowledgeProps & {
  setSavedNotice: (message: string) => void;
  approvedAnswers: typeof initialApprovedAnswers;
  approvedMedia: ApprovedMedia[];
}) {
  const pending = proposals.filter((proposal) => proposal.status !== "saved");
  const draftsFor = (type: Proposal["type"]) => pending.filter((proposal) => proposal.type === type);
  const renderDrafts = (type: Proposal["type"]) => draftsFor(type).map((proposal) => (
    <ProposalCard
      key={proposal.id}
      proposal={proposal}
      file={proposalFiles[proposal.id]}
      setProposalFile={setProposalFile}
      approveProposal={approveProposal}
      discardProposal={discardProposal}
    />
  ));

  return (
    <section className="rounded-card border border-neutral-200 bg-neutral-100 p-4 shadow-card" data-testid="panel-del-knowledge">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div>
          <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-green-900">What Del knows</h2>
          <p className="mt-1 text-[13px] text-neutral-500">Drafts stay pending until you approve them.</p>
        </div>
        {pending.length > 0 && <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[13px] font-bold text-neutral-900">{pending.length} pending</span>}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <KnowledgeSection title="Facts" description="Hours, delivery areas, payment and location" icon={Info} testId="panel-knowledge">
          {renderDrafts("fact")}
          <KnowledgePanel setSavedNotice={setSavedNotice} embedded />
        </KnowledgeSection>
        <KnowledgeSection title="Approved answers" description={`${approvedAnswers.length} customer-ready FAQs`} icon={BookOpen} testId="panel-approved-answers">
          {renderDrafts("faq")}
          <div className="space-y-2">
            {approvedAnswers.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-neutral-200 bg-white p-3" data-testid={`faq-row-${faq.id}`}>
                <p className="text-[13px] font-bold text-green-900">{faq.question}</p>
                <p className="mt-1 text-[13px] leading-5 text-neutral-500">{faq.answer}</p>
                <div className="mt-2 flex flex-wrap gap-1">{faq.triggers.map((trigger) => <span key={trigger} className="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] text-neutral-500">{trigger}</span>)}</div>
              </div>
            ))}
          </div>
        </KnowledgeSection>
        <KnowledgeSection title="Files" description="PDF, PNG or JPG · maximum 10MB" icon={FileText} testId="panel-media">
          {renderDrafts("media")}
          <MediaPanel setSavedNotice={setSavedNotice} approvedMedia={approvedMedia} embedded />
        </KnowledgeSection>
      </div>
    </section>
  );
}

function ActivityPanel() {
  return (
    <div className="flex flex-col h-full bg-cream-50 rounded-card border border-neutral-200 shadow-card overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-neutral-200">
         <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-green-900">Activity Log</h2>
         <p className="text-[13px] text-neutral-500 mt-1">Recent events and system actions.</p>
       </div>
       <div className="p-8 text-center flex-1 wa-scroll overflow-y-auto grid place-items-center text-neutral-500">
         <div>
           <ActivityIcon className="mx-auto mb-3 text-neutral-200" />
           <p className="text-[13px] font-semibold">No recent activity</p>
         </div>
       </div>
    </div>
  )
}
const ActivityIcon = ({className}: {className?: string}) => <Clock3 size={24} className={className} />;

export default function Home() {
  const [activeNav, setActiveNav] = useState("Inbox");
  const [activeInboxChannel, setActiveInboxChannel] = useState<Conversation["channel"]>("whatsapp");
  const [activeId, setActiveId] = useState("danielle");
  const [search, setSearch] = useState("");
  const [autoReply, setAutoReply] = useState(true);
  const [showContext, setShowContext] = useState(true);
  const [showKnowledge, setShowKnowledge] = useState(true);
  const [savedNotice, setSavedNotice] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [approvedAnswers, setApprovedAnswers] = useState(initialApprovedAnswers);
  const [approvedMedia, setApprovedMedia] = useState<ApprovedMedia[]>([]);
  
  // Local demo state for conversation threads
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sentThreads, setSentThreads] = useState<Record<string, string[]>>({});

  const { data: health, isError } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 10000,
      retry: false,
    },
  });
  const isConnected = !isError && health?.status === 'ok';

  const methods = useForm({
    defaultValues: {
      facts: initialFacts,
      mediaUpload: { label: '', triggers: '', file: undefined }
    }
  });

  const handleDelApproved = (proposal: Proposal, file?: File) => {
    if (proposal.type === "fact") {
      const facts = methods.getValues("facts");
      const index = facts.findIndex((fact) => fact.key === proposal.key);
      if (index >= 0) {
        methods.setValue(`facts.${index}.value`, proposal.value || "");
      } else {
        methods.setValue("facts", [
          ...facts,
          {
            key: proposal.key || proposal.id,
            label: proposal.label || "Business fact",
            value: proposal.value || "",
            note: "Approved from Del",
            icon: Info,
          },
        ]);
      }
    } else if (proposal.type === "faq") {
      setApprovedAnswers((current) => [
        ...current,
        {
          id: proposal.id,
          question: proposal.question || "",
          answer: proposal.answer || "",
          triggers: proposal.triggers || [],
        },
      ]);
    } else if (file) {
      setApprovedMedia((current) => [
        ...current,
        {
          name: proposal.label || file.name,
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
          detail: `${(file.size / 1024 / 1024).toFixed(1)} MB · approved just now`,
          trigger: (proposal.triggers || []).join(", "),
        },
      ]);
    }
  };

  const delDraft = useDelDraft({ setSavedNotice, onApproved: handleDelApproved });

  const activeConversation = conversations.find((c) => c.id === activeId) ?? conversations[0];
  const visibleConversations = useMemo(
    () => conversations.filter((c) => `${c.name} ${c.preview} ${c.tag}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );
  const whatsappConversations = visibleConversations.filter((conversation) => conversation.channel === "whatsapp");
  const instagramConversations = visibleConversations.filter((conversation) => conversation.channel === "instagram");

  const selectConversation = (id: string) => {
    setActiveId(id);
    setSavedNotice("");
  };
  const selectInboxChannel = (channel: Conversation["channel"]) => {
    setActiveInboxChannel(channel);
    const firstConversation = conversations.find((conversation) => conversation.channel === channel);
    if (firstConversation) selectConversation(firstConversation.id);
  };

  const draft = drafts[activeConversation.id] || "";
  const setDraft = (val: string) => setDrafts(prev => ({ ...prev, [activeConversation.id]: val }));
  const activeSentMessages = sentThreads[activeConversation.id] || [];

  const sendMessage = () => {
    const value = draft.trim();
    if (!value) return;
    setSentThreads((prev) => ({ ...prev, [activeConversation.id]: [...(prev[activeConversation.id] || []), value] }));
    setDraft("");
    setSavedNotice("Reply queued for WhatsApp");
    setTimeout(() => setSavedNotice(""), 2400);
  };

  const applySuggestion = (value: string) => {
    setDraft(value);
    setSavedNotice("Suggested reply loaded");
  };

  return (
    <FormProvider {...methods}>
      <div className="min-h-[100dvh] bg-background font-['DM_Sans',ui-sans-serif,system-ui,sans-serif] text-foreground">
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-cream-50/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
            <Logo />
            <nav className="order-last flex w-full items-center gap-1 overflow-x-auto rounded-xl bg-neutral-100 p-1 md:order-none md:w-auto" aria-label="Primary">
              {["Inbox", "Del", "Activity"].map((item) => (
                <button key={item} data-testid={`nav-tab-${item}`} onClick={() => setActiveNav(item)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${activeNav === item ? "bg-cream-50 text-green-700 shadow-sm" : "text-neutral-500 hover:text-green-700"}`}>
                  {item}
                  {item === "Inbox" ? <span className="ml-2 rounded-full bg-green-700 px-1.5 py-0.5 text-[13px] text-white">3</span> : null}
                </button>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={() => setSavedNotice("No new messages")} className="relative rounded-xl p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" aria-label="Notifications">
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-600" />
              </button>
              <button onClick={() => setSavedNotice("Settings coming next")} className="hidden rounded-xl p-2.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 sm:block" aria-label="Settings">
                <Settings2 size={17} />
              </button>
              <div className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-neutral-200 text-[13px] font-bold text-neutral-900">KS</div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {/* Digest hero: the one dark green-900 card on this screen. Folds the
              greeting, connection status, and today's stats into a single
              compact module instead of three stacked full-width blocks. */}
          <section className="wa-rise mb-5 rounded-card bg-green-900 p-4 sm:p-6 shadow-card" data-testid="panel-digest">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <DelAvatar size={30} light />
                <div>
                  <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-green-100">Del's morning digest</p>
                  <h1 className="mt-1 font-['Space_Grotesk',ui-sans-serif,sans-serif] text-[clamp(28px,3.5vw,40px)] font-bold tracking-[-0.03em] text-white">Good morning, Kendra.</h1>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2" data-testid="status-connections">
                <StatusPill tone="success" icon={MessageCircle} dark testId="status-whatsapp">
                  WhatsApp {isConnected ? "connected" : "reconnecting"}
                </StatusPill>
                <StatusPill tone="instagram" icon={Instagram} dark testId="status-instagram">
                  Instagram connected
                </StatusPill>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3">
              <StatTile dark value="18" label="conversations" testId="stat-conversations" />
              <StatTile dark value="11" label="replied" delta="92% in 5 min" testId="stat-replied" />
              <StatTile dark value="3" label="need you" delta="oldest 12 min" testId="stat-need-you" />
            </div>
          </section>

          <section className="wa-rise mb-5 flex flex-wrap items-center justify-between gap-4 rounded-card border border-neutral-200 bg-cream-50 px-5 py-4 shadow-card" style={{ animationDelay: "40ms" }} data-testid="panel-referral">
            <div>
              <p className="text-sm font-bold text-green-900">Know a business drowning in the same messages?</p>
              <p className="mt-1 text-[13px] text-neutral-500">Tell them about Del — you both get a free month.</p>
            </div>
            <a
              href={`https://wa.me/?text=${encodeURIComponent("Hi! I've been using an AI assistant called Del to handle my WhatsApp messages — it answers my price list and hours automatically and only bothers me with what actually needs me. Might be worth a look for you too: [YOUR LANDING PAGE URL]")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-green-700 px-4 text-[13px] font-bold text-white transition hover:brightness-90"
              data-testid="btn-share-referral"
            >
              <Share2 size={14} /> Share on WhatsApp
            </a>
          </section>

          <section className="wa-rise grid gap-4 lg:grid-cols-[minmax(210px,0.85fr)_minmax(410px,1.65fr)_minmax(260px,0.92fr)]" style={{ animationDelay: "70ms" }}>
            
            {/* LEFT COLUMN - INBOX */}
            <aside className={`${activeNav === "Inbox" ? "flex" : "hidden lg:flex"} min-h-[700px] flex-col overflow-hidden rounded-card border border-neutral-200 bg-cream-50 shadow-card`}>
              <div className="border-b border-neutral-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-['Space_Grotesk',ui-sans-serif,sans-serif] text-lg font-bold tracking-[-0.04em] text-green-900">Inbox</h2>
                    <p className="mt-0.5 text-[13px] text-neutral-500">12 conversations today</p>
                  </div>
                  <button onClick={() => setFilterOpen((open) => !open)} className={`rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${filterOpen ? "bg-green-100 text-green-700" : "text-neutral-500 hover:bg-neutral-100"}`} aria-label="Filter conversations">
                    <ListFilter size={16} />
                  </button>
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-neutral-500 focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-green-100">
                  <Search size={14} />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[13px] text-green-700 outline-none placeholder:text-neutral-500" placeholder="Search conversations" aria-label="Search conversations" />
                  {search ? <button onClick={() => setSearch("")} className="rounded p-0.5 hover:bg-neutral-200" aria-label="Clear search"><X size={12} /></button> : null}
                </label>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1" aria-label="Inbox channel">
                  <button
                    type="button"
                    onClick={() => selectInboxChannel("whatsapp")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-bold transition ${activeInboxChannel === "whatsapp" ? "bg-cream-50 text-green-700 shadow-sm" : "text-neutral-500 hover:text-green-700"}`}
                    aria-pressed={activeInboxChannel === "whatsapp"}
                    data-testid="inbox-channel-whatsapp"
                  >
                    <MessageCircle size={12} fill="currentColor" />
                    WhatsApp
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[13px]">{whatsappConversations.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectInboxChannel("instagram")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[13px] font-bold transition ${activeInboxChannel === "instagram" ? "bg-cream-50 text-instagram-600 shadow-sm" : "text-neutral-500 hover:text-instagram-600"}`}
                    aria-pressed={activeInboxChannel === "instagram"}
                    data-testid="inbox-channel-instagram"
                  >
                    <Instagram size={12} />
                    Instagram
                    <span className="rounded-full bg-instagram-100 px-1.5 py-0.5 text-[13px]">{instagramConversations.length}</span>
                  </button>
                </div>
                {filterOpen ? <div className="mt-2 flex items-center gap-2 rounded-xl bg-neutral-100 px-3 py-2 text-[13px] text-neutral-500"><Filter size={12} className="text-green-700" /> Showing all open conversations <ChevronDown size={12} className="ml-auto" /></div> : null}
              </div>
              <div className="wa-scroll flex-1 overflow-y-auto">
                {activeInboxChannel === "whatsapp" ? (
                  whatsappConversations.length
                    ? whatsappConversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id === activeId} onSelect={() => selectConversation(conversation.id)} />)
                    : <p className="px-4 py-8 text-center text-[13px] text-neutral-500">No matching WhatsApp conversations</p>
                ) : (
                  instagramConversations.length
                    ? instagramConversations.map((conversation) => <ConversationRow key={conversation.id} conversation={conversation} selected={conversation.id === activeId} onSelect={() => selectConversation(conversation.id)} />)
                    : <p className="px-4 py-8 text-center text-[13px] text-neutral-500">No matching Instagram conversations</p>
                )}
              </div>
              <div className="border-t border-neutral-200 p-3">
                <button onClick={() => setSavedNotice("New conversation flow opened")} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-100 py-2.5 text-[13px] font-bold text-green-700 transition hover:border-neutral-500 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" data-testid="btn-start-conversation"><Plus size={14} /> Start a conversation</button>
              </div>
            </aside>

            {/* CENTER COLUMN */}
            {activeNav === "Inbox" && (
              <section className="flex min-h-[700px] flex-col overflow-hidden rounded-card border border-neutral-200 bg-cream-50 shadow-card">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar initials={activeConversation.initials} tone={activeConversation.tone} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold text-green-900">{activeConversation.name}</h2><span className="hidden rounded-full bg-neutral-100 px-2 py-0.5 text-[13px] font-bold uppercase tracking-[0.1em] text-neutral-500 sm:inline">{activeConversation.tag}</span></div>
                      <p className="mt-0.5 truncate text-[13px] text-neutral-500">{activeConversation.context} <span className="mx-1 text-neutral-200">·</span> WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSavedNotice("Conversation marked resolved")} className="hidden rounded-lg px-2.5 py-2 text-[13px] font-bold text-green-700 transition hover:bg-neutral-100 sm:block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" data-testid="btn-resolve">Resolve</button>
                    <button onClick={() => setSavedNotice("More conversation actions")} className="rounded-lg p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"><MoreHorizontal size={17} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-200 bg-cream-50 px-5 py-2.5 text-[13px]">
                  <span className="flex items-center gap-1.5 text-neutral-500"><ShieldCheck size={13} className="text-green-700" /> AI can only use approved business facts</span>
                  <button onClick={() => setShowContext((open) => !open)} className="font-bold text-green-700 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 md:hidden">{showContext ? "Hide details" : "Show details"}</button>
                </div>
                <div className="wa-scroll flex-1 space-y-4 overflow-y-auto bg-cream-50 px-4 py-5 sm:px-8">
                  <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-[13px] font-semibold text-neutral-500"><Clock3 size={11} /> Today</div>
                  <div className="mx-auto max-w-[540px] rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-center text-[13px] leading-5 text-neutral-500"><Info size={12} className="mr-1 inline text-warning" /> This customer is asking about an order. Keep the reply warm and specific.</div>
                  {activeConversation.messages.map((message, index) => (
                    <div key={`${activeConversation.id}-${index}`} className={`flex ${message.from === "customer" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[68%] ${message.from === "customer" ? "rounded-tl-md border border-neutral-200 bg-cream-50" : "rounded-tr-md border border-neutral-200 bg-green-100"}`}>
                        <p className="text-[13px] leading-5 text-green-900">{message.text}</p>
                        <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[13px] ${message.from === "customer" ? "text-neutral-500" : "text-neutral-500"}`}><span>{message.time}</span>{message.from === "business" ? <Check size={12} className={message.read ? "text-green-700" : ""} /> : null}</div>
                      </div>
                    </div>
                  ))}
                  {activeSentMessages.map((message, index) => <div key={`sent-${index}`} className="flex justify-end wa-rise"><div className="max-w-[68%] rounded-2xl rounded-tr-md border border-neutral-200 bg-green-100 px-4 py-3 shadow-sm"><p className="text-[13px] leading-5 text-green-900">{message}</p><div className="mt-1.5 flex items-center justify-end gap-1.5 text-[13px] text-neutral-500"><span>Just now</span><Check size={12} className="text-green-700" /></div></div></div>)}
                </div>
                <div className="border-t border-neutral-200 bg-cream-50 p-3 sm:p-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button onClick={() => applySuggestion("Hi Danielle, we can reach Mona between 12:30 and 1:30 pm today. Does that work for you?")} className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[13px] font-semibold text-green-700 transition hover:border-neutral-500 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"><Sparkles size={11} className="mr-1 inline" /> Suggest delivery reply</button>
                    <button onClick={() => applySuggestion("I can confirm that for you. One moment while I check today's availability.")} className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[13px] font-semibold text-neutral-500 transition hover:border-green-500 hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700">Buy a moment</button>
                  </div>
                  <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-cream-50 p-2 transition focus-within:border-neutral-500 focus-within:ring-2 focus-within:ring-green-100">
                    <button onClick={() => setSavedNotice("Attachment picker opened")} className="rounded-xl p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"><Paperclip size={16} /></button>
                    <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} className="max-h-20 min-h-[38px] flex-1 resize-none bg-transparent px-1 py-2 text-[13px] leading-5 text-green-900 outline-none placeholder:text-neutral-500" placeholder="Write a reply in your voice…" aria-label="Write a reply" data-testid="input-reply" />
                    <button onClick={sendMessage} disabled={!draft.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-green-700 text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700" data-testid="btn-send-message"><Send size={15} /></button>
                  </div>
                  <div className="mt-2 flex items-center justify-between px-1 text-[13px] text-neutral-500"><span>Press Enter to send</span>{savedNotice ? <span className="font-semibold text-green-700">{savedNotice}</span> : <span className="flex items-center gap-1"><ShieldCheck size={11} /> Human approval on</span>}</div>
                </div>
              </section>
            )}

            {activeNav === "Activity" && <ActivityPanel />}
            {activeNav === "Del" && (
              <div className="lg:col-span-2">
                <DelChat
                  token={delDraft.token}
                  messages={delDraft.messages}
                  input={delDraft.input}
                  setInput={delDraft.setInput}
                  onSend={delDraft.handleSend}
                  isPending={delDraft.isPending}
                  pulse={delDraft.pulse}
                />
              </div>
            )}

            {/* RIGHT COLUMN */}
            {activeNav === "Inbox" && (
              <aside className="min-h-[700px] space-y-4">
                <div className="rounded-card border border-neutral-200 bg-cream-50 shadow-card">
                  <button onClick={() => setShowContext((open) => !open)} className="flex w-full items-center justify-between border-b border-neutral-200 px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-700">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-green-900"><LayoutPanelTop size={15} className="text-green-700" /> Conversation context</span><ChevronDown size={15} className={`text-neutral-500 transition ${showContext ? "rotate-180" : ""}`} />
                  </button>
                  {showContext ? <div className="space-y-3 p-4">
                    <div className="rounded-xl bg-neutral-100 p-3"><p className="text-[13px] font-bold uppercase tracking-[0.12em] text-neutral-500">Customer note</p><p className="mt-1.5 text-[13px] leading-5 text-neutral-500">Prefers delivery updates before dispatch. Address saved in order notes.</p></div>
                    <div className="flex items-center gap-2 text-[13px] text-neutral-500"><Tag size={13} className="text-warning" /> Repeat customer · 4 orders</div>
                    <div className="flex items-center gap-2 text-[13px] text-neutral-500"><MapPin size={13} className="text-neutral-500" /> Mona, Kingston 6</div>
                  </div> : null}
                </div>

                <div className="rounded-card border border-neutral-200 bg-cream-50 shadow-card">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5">
                    <button onClick={() => setShowKnowledge((open) => !open)} className="flex items-center gap-2 text-[13px] font-bold text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"><BookOpen size={15} className="text-green-700" /> Approved knowledge</button>
                    <button onClick={() => setActiveNav("Del")} className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700"><Plus size={15} /></button>
                  </div>
                  {showKnowledge ? <div className="p-4">
                    <div className="mb-3 flex items-center justify-between"><p className="text-[13px] text-neutral-500">{methods.watch("facts").length} facts active</p><span className="flex items-center gap-1 text-[13px] font-semibold text-green-500"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Synced</span></div>
                    <div className="space-y-2.5">{methods.watch("facts").map((fact: any, index: number) => <FactCardSmall key={fact.key} index={index} fact={fact} onNotice={setSavedNotice} />)}</div>
                    <button onClick={() => setActiveNav("Del")} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-green-700 transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700">View all facts <ChevronRight size={13} /></button>
                  </div> : null}
                </div>
              </aside>
            )}

            {activeNav === "Del" && (
              <div className="lg:col-span-3">
                <DelKnowledgePanel
                  proposals={delDraft.proposals}
                  proposalFiles={delDraft.proposalFiles}
                  setProposalFile={delDraft.setProposalFile}
                  approveProposal={delDraft.approveProposal}
                  discardProposal={delDraft.discardProposal}
                  setSavedNotice={setSavedNotice}
                  approvedAnswers={approvedAnswers}
                  approvedMedia={approvedMedia}
                />
              </div>
            )}

          </section>

          <section className="wa-rise mt-5" style={{ animationDelay: "140ms" }}>
            <div className="rounded-card border border-neutral-200 bg-cream-50 px-4 py-3.5 shadow-card sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  <p className="text-sm font-bold text-green-900">Keep the human in the loop:</p>
                  {[
                    { icon: Bot, title: "Drafts from facts" },
                    { icon: ShieldCheck, title: "Approval required" },
                    { icon: CircleHelp, title: "Escalates kindly" },
                  ].map(({ icon: Icon, title }) => (
                    <span key={title} className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-500">
                      <Icon size={14} className="text-green-500" /> {title}
                    </span>
                  ))}
                </div>
                <button onClick={() => setAutoReply((enabled) => !enabled)} className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700 ${autoReply ? "bg-green-700" : "bg-neutral-200"}`} aria-label={autoReply ? "Turn Del off" : "Turn Del on"} data-testid="switch-auto-reply"><span className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${autoReply ? "translate-x-5" : "translate-x-0"}`} /></button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </FormProvider>
  );
}