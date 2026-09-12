import { useState, useRef, useEffect } from "react";
import {
  useDraftBusinessAssistantProposals,
  useCreateFaq,
  useSaveBusinessFact,
} from "@workspace/api-client-react";
import { Bot, Send, Sparkles, Info } from "lucide-react";

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
        setSavedNotice("Preview only — no data was saved");
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
          setSavedNotice("Fact approved");
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
          setSavedNotice("Approved answer saved");
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
        setSavedNotice("File approved and saved");
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
};

export function DelChat({ token, messages, input, setInput, onSend, isPending }: DelChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-full min-h-[700px] flex-col wa-rise bg-[#fffdfa] rounded-2xl border border-[#e5dbd1] shadow-[0_10px_32px_rgba(73,60,46,0.05)] overflow-hidden">
      <div className="p-5 border-b border-[#eee7df] flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e6fb] text-[#5c3e73]">
            <Sparkles size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-[#293d33]">Del</h2>
            <p className="text-xs text-[#85847d] mt-0.5">Your business's AI assistant</p>
          </div>
        </div>
        {!token && (
          <div className="flex items-center gap-1.5 bg-[#fdf3e1] text-[#a67c3b] px-3 py-1.5 rounded-lg text-xs font-semibold">
            <Info size={14} /> Preview Mode
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto wa-scroll space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`shrink-0 h-8 w-8 rounded-full grid place-items-center text-xs font-bold ${m.role === 'user' ? 'bg-[#d8c7ad] text-[#684f32]' : 'bg-[#1c775b] text-white'}`}>
              {m.role === 'user' ? 'KS' : <Bot size={16} />}
            </div>
            <div className={`p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-[#1c775b] text-white rounded-tr-sm' : 'bg-white border border-[#eee7df] text-[#3a4841] rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isPending && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="shrink-0 h-8 w-8 rounded-full grid place-items-center bg-[#1c775b] text-white">
              <Bot size={16} />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#eee7df] rounded-tl-sm flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-[#cbd9d1] animate-bounce" style={{animationDelay: '0ms'}} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#cbd9d1] animate-bounce" style={{animationDelay: '150ms'}} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#cbd9d1] animate-bounce" style={{animationDelay: '300ms'}} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#eee7df] bg-[#faf5ef]">
        <form onSubmit={(e) => { e.preventDefault(); onSend(); }} className="relative flex items-center">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a new rule, menu item, or question..."
            className="w-full bg-white border border-[#dcd5cc] rounded-xl pl-4 pr-12 py-3.5 text-sm text-[#2b3430] placeholder:text-[#a09990] outline-none focus:border-[#77b79b] focus:ring-2 focus:ring-[#e9f5ed] transition shadow-sm"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="absolute right-2 p-2 rounded-lg text-[#1c775b] hover:bg-[#eef7f0] disabled:opacity-40 disabled:hover:bg-transparent transition focus-visible:outline-none"
          >
            <Send size={18} strokeWidth={2} />
          </button>
        </form>
      </div>
    </div>
  );
}
