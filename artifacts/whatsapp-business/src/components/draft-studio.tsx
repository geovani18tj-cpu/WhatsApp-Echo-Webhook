import { useState, useRef, useEffect } from "react";
import { 
  useDraftBusinessAssistantProposals, 
  useCreateFaq, 
} from "@workspace/api-client-react";
import { Bot, Send, Check, AlertCircle, FileText, Sparkles, Loader2, Info } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Proposal = {
  id: string;
  type: "faq" | "media";
  question?: string;
  answer?: string;
  label?: string;
  triggers?: string[];
  status: "pending" | "saving" | "saved" | "error";
};

export function DraftStudio({ setSavedNotice }: { setSavedNotice: (s: string) => void }) {
  const token = new URLSearchParams(window.location.search).get("token");
  const businessId = "00000000-0000-4000-8000-000000000001";
  
  const [messages, setMessages] = useState<Message[]>(
    !token ? [
      { role: "assistant", content: "Hi! I'm your Draft Studio assistant. I can help you translate plain-language business updates into structured FAQs and media items for your WhatsApp command centre." },
      { role: "user", content: "We're open on Sundays now from 10am to 2pm." },
      { role: "assistant", content: "I've drafted a new FAQ for your Sunday hours. Review it on the right, then click Save if it is correct." }
    ] : [
      { role: "assistant", content: "Hi! I'm your Draft Studio assistant. I can help you translate plain-language business updates into structured FAQs and media items. What would you like to update today?" }
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

  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, proposals]);

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
        setSavedNotice("Preview only — no data was saved");
        setTimeout(() => setSavedNotice(""), 3000);
      }, 800);
      return;
    }

    if (p.type === 'faq') {
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
          setSavedNotice("FAQ saved successfully");
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
        setSavedNotice("Media saved successfully");
        setTimeout(() => setSavedNotice(""), 3000);
      }).catch(() => {
        setProposals(prev => prev.map(x => x.id === p.id ? { ...x, status: "error" } : x));
      });
    }
  };

  const handleDiscard = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[700px] gap-4 w-full wa-rise">
      {/* Left: Chat */}
      <div className="flex flex-col flex-1 bg-[#fffdfa] rounded-2xl border border-[#e5dbd1] shadow-[0_10px_32px_rgba(73,60,46,0.05)] overflow-hidden">
        <div className="p-5 border-b border-[#eee7df] flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4e6fb] text-[#5c3e73]">
              <Sparkles size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="font-['Space_Grotesk'] text-lg font-bold tracking-[-0.04em] text-[#293d33]">Draft Studio</h2>
              <p className="text-xs text-[#85847d] mt-0.5">Chat to generate new rules and facts</p>
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
          {draftMutation.isPending && (
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
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a new rule, menu item, or question..."
              className="w-full bg-white border border-[#dcd5cc] rounded-xl pl-4 pr-12 py-3.5 text-sm text-[#2b3430] placeholder:text-[#a09990] outline-none focus:border-[#77b79b] focus:ring-2 focus:ring-[#e9f5ed] transition shadow-sm"
              disabled={draftMutation.isPending}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || draftMutation.isPending}
              className="absolute right-2 p-2 rounded-lg text-[#1c775b] hover:bg-[#eef7f0] disabled:opacity-40 disabled:hover:bg-transparent transition focus-visible:outline-none"
            >
              <Send size={18} strokeWidth={2} />
            </button>
          </form>
        </div>
      </div>

      {/* Right: Proposals */}
      <div className="flex flex-col w-full lg:w-[360px] xl:w-[400px] shrink-0 bg-[#fffdfa] rounded-2xl border border-[#e5dbd1] shadow-[0_10px_32px_rgba(73,60,46,0.05)] overflow-hidden">
        <div className="p-5 border-b border-[#eee7df] bg-white flex justify-between items-center">
          <div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold tracking-[-0.03em] text-[#293d33]">Pending Proposals</h3>
            <p className="text-xs text-[#85847d] mt-1">Review each AI draft before saving</p>
          </div>
          {proposals.length > 0 && (
            <span className="bg-[#f0e9e1] text-[#746b5d] text-[10px] font-bold px-2 py-1 rounded-md">
              {proposals.filter(p => p.status === 'pending').length} pending
            </span>
          )}
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto wa-scroll space-y-4 bg-[#fbf8f4]">
          {proposals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 text-[#a39e96]">
              <FileText size={32} className="mb-3 text-[#d6d0c9]" />
              <p className="text-sm font-semibold text-[#68635c]">No pending drafts</p>
              <p className="text-[11px] mt-1.5 leading-relaxed">When the assistant creates a new FAQ or media keyword, it will appear here for your approval.</p>
            </div>
          ) : (
            proposals.map(p => (
              <div key={p.id} className={`bg-white border ${p.status === 'saved' ? 'border-[#74b395]' : 'border-[#e5dbd1]'} rounded-xl p-4 shadow-sm relative overflow-hidden transition-all hover:border-[#cbd9d1]`}>
                {p.status === 'saved' && (
                  <div className="absolute inset-0 bg-[#eef7f0]/95 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-[#1c775b] animate-in fade-in zoom-in duration-300">
                    <div className="h-10 w-10 bg-white rounded-full grid place-items-center shadow-sm mb-2">
                      <Check size={20} strokeWidth={2.5} />
                    </div>
                    <p className="text-sm font-bold">{token ? "Saved to knowledge" : "Preview only"}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#eef7f0] text-[#1c775b] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                    {p.type === 'faq' ? 'FAQ Draft' : 'Media Draft'}
                  </span>
                </div>

                {p.type === 'faq' ? (
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#a09990] mb-1">Question</p>
                      <p className="text-sm font-semibold text-[#2b3430]">{p.question}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#a09990] mb-1">Answer</p>
                      <p className="text-sm text-[#46554d] leading-relaxed">{p.answer}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#a09990] mb-1">Label</p>
                      <p className="text-sm font-semibold text-[#2b3430]">{p.label}</p>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-[10px] font-bold uppercase text-[#a09990]">Choose the PDF or image to save</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          setProposalFiles((current) => ({ ...current, [p.id]: file }));
                          if (file && p.status === "error") {
                            setProposals((current) => current.map((item) => item.id === p.id ? { ...item, status: "pending" } : item));
                          }
                        }}
                        className="w-full text-[11px] text-[#85847d] file:mr-2 file:rounded-md file:border-0 file:bg-[#eef7f0] file:px-2.5 file:py-1.5 file:text-[10px] file:font-bold file:text-[#1c775b]"
                      />
                    </label>
                  </div>
                )}

                {p.triggers && p.triggers.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {p.triggers.map(t => (
                      <span key={t} className="bg-[#f4eee8] text-[#746b5d] text-[10px] px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 relative z-0">
                  <button 
                    onClick={() => handleDiscard(p.id)}
                    disabled={p.status !== 'pending'}
                    className="flex-1 py-2 text-xs font-semibold text-[#85847d] bg-[#f4eee8] rounded-lg transition hover:bg-[#e7ddd2] focus-visible:outline-none"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={() => handleApprove(p)}
                    disabled={p.status !== 'pending'}
                    className="flex-1 py-2 text-xs font-bold bg-[#1c775b] text-white rounded-lg transition hover:bg-[#145d46] focus-visible:outline-none flex items-center justify-center gap-1.5"
                  >
                    {p.status === 'saving' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} strokeWidth={2.5} />
                    )}
                    {p.status === 'saving' ? 'Saving...' : token ? 'Save' : 'Preview save'}
                  </button>
                </div>
                
                {p.status === 'error' && (
                  <p className="text-[10px] text-[#c25c38] mt-2 flex items-center justify-center gap-1">
                    <AlertCircle size={10} /> {p.type === "media" && !proposalFiles[p.id] ? "Choose a file before saving" : "Failed to save"}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
