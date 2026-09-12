import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListBusinessesQueryKey,
  getListFaqsQueryKey,
  getListMediaQueryKey,
  useCreateBusiness,
  useCreateFaq,
  useDeleteFaq,
  useDeleteMedia,
  useGetDashboard,
  useListBusinesses,
  useListFaqs,
  useListMedia,
  useUpdateBusiness,
  setAuthTokenGetter,
  type Business,
} from "@workspace/api-client-react";

type Notice = { kind: "error" | "success"; text: string } | null;

export default function Admin() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [tokenDraft, setTokenDraft] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [businessForm, setBusinessForm] = useState({ name: "", phone_number_id: "", whatsapp_access_token: "", owner_whatsapp_number: "", instagram_user_id: "", instagram_page_token: "", timezone: "America/Jamaica", digest_hour: "9" });
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", triggers: "" });
  const [mediaForm, setMediaForm] = useState({ label: "", triggers: "", file: undefined as File | undefined });

  useEffect(() => {
    const queryToken = new URLSearchParams(window.location.search).get("token");
    if (queryToken) {
      setToken(queryToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  useEffect(() => {
    setAuthTokenGetter(() => token || null);
    return () => setAuthTokenGetter(null);
  }, [token]);

  const ready = Boolean(token);
  const businesses = useListBusinesses({ query: { queryKey: getListBusinessesQueryKey(), enabled: ready, retry: false } });
  const selected = useMemo(() => businesses.data?.find((business) => business.id === selectedId) ?? businesses.data?.[0], [businesses.data, selectedId]);
  const faqs = useListFaqs(selected?.id ?? "", { query: { queryKey: getListFaqsQueryKey(selected?.id ?? ""), enabled: ready && Boolean(selected?.id) } });
  const media = useListMedia(selected?.id ?? "", { query: { queryKey: getListMediaQueryKey(selected?.id ?? ""), enabled: ready && Boolean(selected?.id) } });
  const dashboard = useGetDashboard({ query: { queryKey: ["/api/dashboard"], enabled: ready, retry: false } });
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const createFaq = useCreateFaq();
  const deleteFaq = useDeleteFaq();
  const deleteMedia = useDeleteMedia();

  useEffect(() => {
    if (selected) {
      setBusinessForm((current) => ({
        ...current,
        name: selected.name,
        phone_number_id: selected.phone_number_id ?? "",
        owner_whatsapp_number: selected.owner_whatsapp_number ?? "",
        instagram_user_id: selected.instagram_user_id ?? "",
        timezone: selected.timezone,
        digest_hour: String(selected.digest_hour),
      }));
    }
  }, [selected]);

  const refreshBusinesses = () => queryClient.invalidateQueries({ queryKey: getListBusinessesQueryKey() });
  const showError = (error: unknown) => setNotice({ kind: "error", text: error instanceof Error ? error.message : "Request failed" });

  const saveBusiness = (event: React.FormEvent) => {
    event.preventDefault();
    const data = { ...businessForm, digest_hour: Number(businessForm.digest_hour) || 9 };
    const done = () => { setNotice({ kind: "success", text: "Business saved. Channel secrets are never shown again." }); refreshBusinesses(); };
    if (selected?.id) updateBusiness.mutate({ businessId: selected.id, data }, { onSuccess: done, onError: showError });
    else createBusiness.mutate({ data }, { onSuccess: (created) => { setSelectedId(created.id); done(); }, onError: showError });
  };

  const addFaq = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    createFaq.mutate({ businessId: selected.id, data: { question: faqForm.question, answer: faqForm.answer, triggers: faqForm.triggers.split(",").map((item) => item.trim()).filter(Boolean) } }, {
      onSuccess: () => { setFaqForm({ question: "", answer: "", triggers: "" }); setNotice({ kind: "success", text: "FAQ added" }); queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey(selected.id) }); },
      onError: showError,
    });
  };

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !mediaForm.file) return;
    const body = new FormData();
    body.append("label", mediaForm.label);
    body.append("triggers", mediaForm.triggers);
    body.append("file", mediaForm.file);
    try {
      const result = await fetch(`/api/businesses/${selected.id}/media`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || "Upload failed");
      setMediaForm({ label: "", triggers: "", file: undefined });
      setNotice({ kind: "success", text: "Media uploaded" });
      queryClient.invalidateQueries({ queryKey: getListMediaQueryKey(selected.id) });
    } catch (error) { showError(error); }
  };

  const selectBusiness = (business: Business) => {
    setSelectedId(business.id);
    setBusinessForm({ name: business.name, phone_number_id: business.phone_number_id ?? "", whatsapp_access_token: "", owner_whatsapp_number: business.owner_whatsapp_number ?? "", instagram_user_id: business.instagram_user_id ?? "", instagram_page_token: "", timezone: business.timezone, digest_hour: String(business.digest_hour) });
  };

  if (!ready) return (
    <main className="min-h-[100dvh] bg-[#f7f2ec] px-5 py-12 text-[#263c31]">
      <div className="mx-auto max-w-md rounded-3xl border border-[#e5dbd1] bg-[#fffdfa] p-8 shadow-[0_16px_42px_rgba(73,60,46,0.08)]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2a7a5d]">Likkle Table · Admin</p>
        <h1 className="mt-3 font-['Space_Grotesk'] text-3xl font-bold tracking-[-0.06em]">Connect your business</h1>
        <p className="mt-3 text-sm leading-6 text-[#777b75]">Enter the admin token for this session. It is held in memory only and channel tokens are never saved in this browser.</p>
        <form className="mt-7 space-y-3" onSubmit={(event) => { event.preventDefault(); setToken(tokenDraft.trim()); }}>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#938b82]">Admin token<input data-testid="input-admin-token" className="mt-2 w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-3 text-sm outline-none focus:border-[#67a98b]" type="password" value={tokenDraft} onChange={(event) => setTokenDraft(event.target.value)} /></label>
          <button data-testid="btn-admin-connect" className="w-full rounded-xl bg-[#1c775b] py-3 text-sm font-bold text-white hover:bg-[#145d46]" type="submit">Open admin</button>
        </form>
      </div>
    </main>
  );

  return (
    <main className="min-h-[100dvh] bg-[#f7f2ec] px-4 py-6 text-[#263c31] sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2a7a5d]">Likkle Table · Protected admin</p><h1 className="mt-2 font-['Space_Grotesk'] text-4xl font-bold tracking-[-0.07em]">Business setup</h1><p className="mt-2 text-sm text-[#777b75]">Configure WhatsApp and Instagram without exposing credentials in list views.</p></div>
          <button data-testid="btn-admin-lock" className="rounded-xl border border-[#d8cec3] bg-[#fffdfa] px-4 py-2 text-xs font-bold text-[#53665b]" onClick={() => setToken("")}>Lock session</button>
        </header>
        {notice && <div data-testid="admin-notice" className={`mb-5 rounded-xl px-4 py-3 text-sm ${notice.kind === "error" ? "bg-[#fff0eb] text-[#a64a2b]" : "bg-[#eaf6ee] text-[#2b775c]"}`}>{notice.text}</div>}
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-4">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Businesses</h2><span className="text-xs text-[#938b82]">{businesses.data?.length ?? 0}</span></div>
            {businesses.isLoading ? <p data-testid="businesses-loading" className="text-sm text-[#938b82]">Loading…</p> : businesses.isError ? <p data-testid="businesses-error" className="text-sm text-[#a64a2b]">Could not load businesses.</p> : businesses.data?.length ? businesses.data.map((business) => <button data-testid={`business-row-${business.id}`} key={business.id} onClick={() => selectBusiness(business)} className={`mb-2 w-full rounded-xl px-3 py-3 text-left text-sm ${selected?.id === business.id ? "bg-[#eaf6ee] font-bold text-[#176b52]" : "bg-[#faf7f3] hover:bg-[#f1ebe4]"}`}>{business.name}<span className="mt-1 block text-[11px] font-normal text-[#938b82]">{business.instagram_user_id ? "Instagram ready" : "WhatsApp setup"}</span></button>) : <p data-testid="businesses-empty" className="text-sm text-[#938b82]">No businesses yet. Add the first one.</p>}
            <button data-testid="btn-new-business" onClick={() => { setSelectedId(""); setBusinessForm({ name: "", phone_number_id: "", whatsapp_access_token: "", owner_whatsapp_number: "", instagram_user_id: "", instagram_page_token: "", timezone: "America/Jamaica", digest_hour: "9" }); }} className="mt-3 w-full rounded-xl border border-dashed border-[#9cc8b0] py-2.5 text-xs font-bold text-[#2a7a5d]">+ New business</button>
          </aside>
          <section className="space-y-5">
            <form onSubmit={saveBusiness} className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5">
              <h2 className="font-['Space_Grotesk'] text-xl font-bold">{selected ? "Business & channels" : "Add a business"}</h2>
              <p className="mt-1 text-xs text-[#938b82]">Blank secret fields leave existing credentials unchanged.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {([["name", "Business name"], ["phone_number_id", "WhatsApp phone number ID"], ["whatsapp_access_token", "WhatsApp access token (replacement only)"], ["owner_whatsapp_number", "Owner WhatsApp number"], ["instagram_user_id", "Instagram user ID"], ["instagram_page_token", "Instagram Page token (replacement only)"], ["timezone", "Timezone"], ["digest_hour", "Digest hour (0–23)"]] as const).map(([key, label]) => <label key={key} className="text-xs font-bold text-[#777b75]">{label}<input data-testid={`input-business-${key}`} type={key.includes("token") ? "password" : key === "digest_hour" ? "number" : "text"} value={businessForm[key]} onChange={(event) => setBusinessForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm font-normal outline-none focus:border-[#67a98b]" /></label>)}
              </div>
              <button data-testid="btn-save-business" disabled={createBusiness.isPending || updateBusiness.isPending} className="mt-4 rounded-xl bg-[#1c775b] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50" type="submit">{selected ? "Save changes" : "Create business"}</button>
            </form>
            {selected && <div className="grid gap-5 xl:grid-cols-2">
              <section className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5"><h2 className="font-['Space_Grotesk'] text-xl font-bold">FAQs</h2><form onSubmit={addFaq} className="mt-4 space-y-2"><input data-testid="input-faq-question" required placeholder="Question or intent" value={faqForm.question} onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })} className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm" /><textarea data-testid="input-faq-answer" required placeholder="Answer customers should receive" value={faqForm.answer} onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })} className="min-h-20 w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm" /><input data-testid="input-faq-triggers" placeholder="Triggers, comma separated" value={faqForm.triggers} onChange={(event) => setFaqForm({ ...faqForm, triggers: event.target.value })} className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm" /><button data-testid="btn-add-faq" className="rounded-xl bg-[#eaf6ee] px-4 py-2 text-xs font-bold text-[#2b775c]">Add FAQ</button></form><div className="mt-4 space-y-2">{faqs.isLoading ? <p data-testid="faqs-loading" className="text-xs text-[#938b82]">Loading FAQs…</p> : faqs.data?.length ? faqs.data.map((faq) => <div data-testid={`faq-row-${faq.id}`} key={faq.id} className="rounded-xl bg-[#faf7f3] p-3"><div className="flex justify-between gap-3 text-sm font-bold">{faq.question}<button data-testid={`btn-delete-faq-${faq.id}`} onClick={() => deleteFaq.mutate({ businessId: selected.id, faqId: faq.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFaqsQueryKey(selected.id) }), onError: showError })} className="text-xs text-[#a64a2b]">Delete</button></div><p className="mt-1 text-xs text-[#777b75]">{faq.answer}</p></div>) : <p data-testid="faqs-empty" className="text-xs text-[#938b82]">No FAQs yet.</p>}</div></section>
              <section className="rounded-2xl border border-[#e5dbd1] bg-[#fffdfa] p-5"><h2 className="font-['Space_Grotesk'] text-xl font-bold">Media library</h2><form onSubmit={upload} className="mt-4 space-y-2"><input data-testid="input-media-label-admin" required placeholder="Label" value={mediaForm.label} onChange={(event) => setMediaForm({ ...mediaForm, label: event.target.value })} className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm" /><input data-testid="input-media-triggers-admin" placeholder="Triggers, comma separated" value={mediaForm.triggers} onChange={(event) => setMediaForm({ ...mediaForm, triggers: event.target.value })} className="w-full rounded-xl border border-[#dcd5cc] bg-[#fbf8f4] px-3 py-2.5 text-sm" /><input data-testid="input-media-file-admin" required type="file" accept=".pdf,image/*" onChange={(event) => setMediaForm({ ...mediaForm, file: event.target.files?.[0] })} className="w-full text-xs" /><button data-testid="btn-upload-media-admin" className="rounded-xl bg-[#1c775b] px-4 py-2 text-xs font-bold text-white">Upload media</button></form><div className="mt-4 space-y-2">{media.isLoading ? <p data-testid="media-loading" className="text-xs text-[#938b82]">Loading media…</p> : media.data?.length ? media.data.map((item) => <div data-testid={`media-row-admin-${item.id}`} key={item.id} className="flex items-center justify-between rounded-xl bg-[#faf7f3] p-3"><div><p className="text-sm font-bold">{item.label}</p><p className="text-xs text-[#938b82]">{item.filename} · {item.triggers.join(", ")}</p></div><button data-testid={`btn-delete-media-${item.id}`} onClick={() => deleteMedia.mutate({ businessId: selected.id, mediaId: item.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMediaQueryKey(selected.id) }), onError: showError })} className="text-xs text-[#a64a2b]">Delete</button></div>) : <p data-testid="media-empty" className="text-xs text-[#938b82]">No media yet.</p>}</div></section>
            </div>}
            <section data-testid="dashboard-summary" className="rounded-2xl border border-[#d8e4dc] bg-[#eef7f0] p-5"><h2 className="font-['Space_Grotesk'] text-xl font-bold">Dashboard</h2>{dashboard.isLoading ? <p className="mt-2 text-xs text-[#777b75]">Loading dashboard…</p> : dashboard.isError ? <p className="mt-2 text-xs text-[#a64a2b]">Dashboard is unavailable until the database schema is run.</p> : <div className="mt-3 flex flex-wrap gap-5 text-sm"><span><strong>{dashboard.data?.businesses ?? 0}</strong> businesses</span><span><strong>{dashboard.data?.inbound_count ?? 0}</strong> inbound events</span><span><strong>{dashboard.data?.outbound_count ?? 0}</strong> outbound events</span></div>}</section>
          </section>
        </div>
      </div>
    </main>
  );
}