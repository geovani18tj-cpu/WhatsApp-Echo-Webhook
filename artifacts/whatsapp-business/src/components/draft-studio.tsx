import { useState, useRef, useEffect } from "react";
import {
  useDraftBusinessAssistantProposals,
  useCreateFaq,
  useSaveBusinessFact,
} from "@workspace/api-client-react";
import { Send, Info } from "lucide-react";
import { DelAvatar } from "@/components/del-avatar";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Proposal = {
  id: string;
  type: "fact" | "faq" | "media";
  key?: string;
  value?: string;
  question?: string;
  answer?: string;
  label?: string;
  triggers?: string[];
  status: "pending" | "saving" | "saved" | "error";
};

export type DraftKnowledgeProps = {
  proposals: Proposal[];
  proposalFiles: Record<string, File | undefined>;
  setProposalFile: (id: string, file: File | undefined) => void;
  approveProposal: (proposal: Proposal) => void;
  discardProposal: (id: string) => void;
};

type UseDelDraftArgs = {
  setSavedNotice: (message: string) => void;
  onApproved: (proposal: Proposal, file?: File) => void;
};

export function useDelDraft({ setSavedNotice, onApproved }: UseDelDraftArgs) {
  const token = new URLSearchParams(window.location.search).get("token");
  const businessId = "00000000-0000-4000-8000-000000000001";

  const [messages, setMessages] = useState<Message[]>(
    !token ? [
      { role: "assistant", content: "Hi! I'm Del, your business's AI assistant. I can help you translate plain-language business updates into structured FAQs and media items for your Delegate inbox." },
      { role: "user", content: "We're open on Sundays now from 10am to 2pm." },
      { role: "assistant", content: "I've drafted a new FAQ for your Sunday hours. Review it on the right, then click Save if it is correct." }
    ] : [
      { role: "assistant", content: "Hi! I'm Del, your business's AI assistant. Tell me what you would like to update about your business today." }
    ]
  );

  const [proposals, setProposals] = useState<Proposal[]>(
    !token ? [
      {
        id: "mock-1",
        type: "faq",
        question: "Are you open on Sundays?",
        answer: "Yes, we are open on Sundays from 10:00 am to 2:00 pm.",
        triggers: ["sunday", "weekend hours", "open"],
        status: "pending"
      }
    ] : []
  );

  const [input, setInput] = useState("");
  const [proposalFiles, setProposalFiles] = useState<Record<string, File | undefined>>({});
  // Increment whenever Del sends something, to trigger the avatar's arrow nudge.
  const [pulse, setPulse] = useState(0);

  const draftMutation = useDraftBusinessAssistantProposals({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  });

  const createFaqMutation = useCreateFaq({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  });
  const saveFactMutation = useSaveBusinessFact({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");

    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);

    if (!token) {
      setTimeout(() => {
        setMessages(m => [...m, {
          role: "assistant",
          content: "You are in preview mode. Provide a `?token=` query parameter to connect to the real API."
        }]);
        setPulse((p) => p + 1);
      }, 600);
      return;
    }

    const history = messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
      role: m.role,
      content: m.content
    }));

    draftMutation.mutate({
      businessId,
      data: {
        message: userMsg,
        history: history.length > 0 ? history : undefined
      }
    }, {
      onSuccess: (data) => {
        setMessages(m => [...m, { role: "assistant", content: data.reply }]);
        setPulse((p) => p + 1);
        if (data.proposals && data.proposals.length > 0) {
          const newProposals = data.proposals.map(p => ({
            ...p,
            status: "pending" as const
          }));
          setProposals(prev => [...prev, ...newProposals]);
        }
      },
      onError: () => {
        setMessages(m => [...m, { role: "assistant", content: "Sorry, I encountered an error trying to process your request." }]);
      }
    });
  };

  const handleApprove = (p: Proposal) => {
    setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "saving" } : x));

    if (!token) {
      setTimeout(() => {
        setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "saved" } : x));
        onApproved(p, proposalFiles[p.id]);
        setSavedNotice("Preview only — Del didn't actually learn this");
        setTimeout(() => setSavedNotice(""), 3000);
      }, 800);
      return;
    }

    if (p.type === "fact") {
      saveFactMutation.mutate({
        data: { key: p.key || "", value: p.value || "" },
      }, {
        onSuccess: () => {
          setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "saved" } : x));
          onApproved(p);
          setSavedNotice("Got it — Del will use this from now on");
          setTimeout(() => setSavedNotice(""), 3000);
        },
        onError: () => {
          setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "error" } : x));
        },
      });
    } else if (p.type === 'faq') {
      createFaqMutation.mutate({
        businessId,
        data: {
          question: p.question || "",
          answer: p.answer || "",
          triggers: p.triggers || []
        }
      }, {
        onSuccess: () => {
          setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "saved" } : x));
          onApproved(p);
          setSavedNotice("Got it — Del can answer this from now on");
          setTimeout(() => setSavedNotice(""), 3000);
        },
        onError: () => {
          setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "error" } : x));
        }
      });
    } else {
      const file = proposalFiles[p.id];
      if (!file) {
        setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "error" } : x));
        return;
      }
      const formData = new FormData();
      formData.append("label", p.label || "");
      formData.append("triggers", (p.triggers || []).join(","));
      formData.append("file", file);
      fetch(`/api/businesses/${businessId}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then((response) => {
        if (!response.ok) throw new Error("Media upload failed");
        setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "saved" } : x));
        onApproved(p, file);
        setSavedNotice("Got it — Del can share this from now on");
        setTimeout(() => setSavedNotice(""), 3000);
      }).catch(() => {
        setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "error" } : x));
      });
    }
  };

  const handleDiscard = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const setProposalFile = (id: string, file: File | undefined) => {
    setProposalFiles((current) => ({ ...current, [id]: file }));
    if (file) {
      setProposals((current) => current.map((item) => item.id === id && item.status === "error" ? { ...item, status: "pending" } : item));
    }
  };

  return {
    token,
    messages,
    input,
    setInput,
    handleSend,
    isPending: draftMutation.isPending,
    pulse,
    proposals,
    proposalFiles,
    setProposalFile,
    approveProposal: handleApprove,
    discardProposal: handleDiscard,
  };
}

export type DelChatProps = {
  token: string | null;
  messages: Message[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
  pulse: number;
};

export function DelChat({ token, messages, input, setInput, onSend, isPending, pulse }: DelChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full min-h-[700px] flex-col wa-rise bg-cream-50 rounded-card border border-neutral-200 shadow-card overflow-hidden">
      <div className="p-5 border-b border-neutral-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <DelAvatar size={40} pulse={pulse} />
          <div>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-green-900">Del</h2>
            <p className="text-[13px] text-neutral-500 mt-0.5">Your business's AI assistant</p>
          </div>
        </div>
        {!token && (
          <div className="flex items-center gap-1.5 bg-neutral-100 text-warning px-3 py-1.5 rounded-lg text-[13px] font-semibold">
            <Info size={14} /> Preview Mode
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto wa-scroll space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            {m.role === 'user' ? (
              <div className="shrink-0 h-8 w-8 rounded-full grid place-items-center text-[13px] font-bold bg-neutral-200 text-neutral-900">KS</div>
            ) : (
              <DelAvatar size={32} className="shrink-0" />
            )}
            <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-green-700 text-white rounded-tr-sm' : 'bg-white border border-neutral-200 text-green-900 rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex items-center gap-3 max-w-[85%]">
            <DelAvatar size={32} className="shrink-0" />
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 rounded-tl-sm flex items-center gap-2">
              <span className="text-[13px] font-semibold text-neutral-500">Del is typing</span>
              <span className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 del-typing-dot" style={{animationDelay: '0ms'}} />
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 del-typing-dot" style={{animationDelay: '150ms'}} />
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 del-typing-dot" style={{animationDelay: '300ms'}} />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-200 bg-neutral-100">
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="relative flex items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a new rule, menu item, or question..."
            className="w-full bg-white border border-neutral-200 rounded-xl pl-4 pr-12 py-3.5 text-sm text-green-900 placeholder:text-neutral-500 outline-none focus:border-neutral-500 focus:ring-2 focus:ring-green-100 transition shadow-sm"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="absolute right-2 p-2 rounded-lg text-green-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent transition focus-visible:outline-none"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
