import express, { type Request, type Response } from "express";
import crypto from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { createWorker } from "tesseract.js";

const app = express();
const port = Number(process.env.PORT ?? 5000);
const maxUploadBytes = 10 * 1024 * 1024;
const connectors = new ReplitConnectors();
const processedMessageIds = new Set<string>();
const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

type Row = Record<string, unknown>;
type RawRequest = Request & { rawBody?: Buffer };

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function arrayStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function timestamp(): string {
  return new Date().toISOString();
}

// Logs contain operational identifiers only. Never pass credentials or payloads here.
function log(label: string, details: Record<string, unknown> = {}): void {
  process.stdout.write(`${JSON.stringify({ time: timestamp(), level: "info", message: label, ...details })}\n`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected server error";
}

function supabasePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

async function supabase<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body !== undefined && !(init.body instanceof Buffer)) headers.set("Content-Type", "application/json");
  if (!headers.has("Prefer")) headers.set("Prefer", "return=representation");
  const projectUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let response: globalThis.Response;
  if (projectUrl && serviceRoleKey) {
    headers.set("apikey", serviceRoleKey);
    headers.set("Authorization", `Bearer ${serviceRoleKey}`);
    response = await fetch(`${projectUrl}${supabasePath(path)}`, {
      ...init,
      headers,
    });
  } else {
    response = await connectors.proxy("supabase", supabasePath(path), {
      ...init,
      headers: Object.fromEntries(headers.entries()),
    });
  }
  const text = await response.text();
  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text) as Row;
      detail = stringValue(parsed.message) ?? stringValue(parsed.error) ?? stringValue(parsed.hint) ?? text;
    } catch {
      // PostgREST occasionally returns plain text; the status is enough context.
    }
    throw new Error(`Supabase request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

function publicBusiness(row: Row): Row {
  return {
    id: row.id,
    name: row.name,
    phone_number_id: row.phone_number_id ?? null,
    owner_whatsapp_number: row.owner_whatsapp_number ?? null,
    instagram_user_id: row.instagram_user_id ?? null,
    timezone: row.timezone,
    digest_hour: row.digest_hour,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function requireAdmin(request: Request, response: Response): boolean {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    response.status(503).json({ error: "Admin protection is not configured" });
    return false;
  }
  const header = request.header("authorization");
  const bearer = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken = typeof request.query.token === "string" ? request.query.token : undefined;
  const supplied = bearer ?? queryToken;
  const suppliedBuffer = supplied ? Buffer.from(supplied) : Buffer.alloc(0);
  const expectedBuffer = Buffer.from(expected);
  if (!supplied || suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    response.status(401).json({ error: "Admin authorization required" });
    return false;
  }
  return true;
}

function getQueryString(request: Request, key: string): string | undefined {
  const value = request.query[key];
  return typeof value === "string" ? value : undefined;
}

function allowedBusinessFields(input: Row, includeSecrets: boolean): Row {
  const output: Row = {};
  for (const key of ["name", "phone_number_id", "owner_whatsapp_number", "instagram_user_id", "timezone", "digest_hour"]) {
    if (input[key] !== undefined) output[key] = input[key];
  }
  if (includeSecrets) {
    if (stringValue(input.whatsapp_access_token)) output.whatsapp_access_token = stringValue(input.whatsapp_access_token);
    if (stringValue(input.instagram_page_token)) output.instagram_page_token = stringValue(input.instagram_page_token);
  }
  return output;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function matches(text: string, triggers: string[]): boolean {
  const normalized = normalize(text);
  return triggers.some((trigger) => {
    const phrase = normalize(trigger);
    return phrase.length > 0 && (normalized === phrase || normalized.includes(phrase));
  });
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

async function insertEvent(path: string, row: Row): Promise<Row | undefined> {
  try {
    const result = await supabase<Row[]>(path, { method: "POST", body: JSON.stringify(row) });
    return result?.[0];
  } catch (error) {
    log("event persistence failed", { table: path.split("?")[0], error: errorMessage(error) });
    return undefined;
  }
}

async function graphMessage(channel: "whatsapp" | "instagram", token: string, endpointId: string, body: Row): Promise<Row> {
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(endpointId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: Row = {};
  try { parsed = JSON.parse(text) as Row; } catch { /* handled by status below */ }
  if (!response.ok) throw new Error(`${channel} Graph API returned ${response.status}: ${stringValue(parsed.error && isRecord(parsed.error) ? parsed.error.message : undefined) ?? "request rejected"}`);
  return parsed;
}

async function sendText(business: Row, channel: "whatsapp" | "instagram", recipient: string, text: string): Promise<void> {
  const token = channel === "whatsapp" ? stringValue(business.whatsapp_access_token) : stringValue(business.instagram_page_token);
  const endpoint = channel === "whatsapp" ? stringValue(business.phone_number_id) : stringValue(business.instagram_user_id);
  if (!token || !endpoint) throw new Error(`No ${channel} credentials configured for this business`);
  const body = channel === "whatsapp"
    ? { messaging_product: "whatsapp", to: recipient, type: "text", text: { body: text } }
    : { recipient: { id: recipient }, messaging_type: "RESPONSE", message: { text } };
  try {
    const result = await graphMessage(channel, token, endpoint, body);
    await insertEvent("/rest/v1/outbound_message_events", {
      business_id: business.id, channel, recipient_id: recipient, message_type: "text", message_text: text,
      external_message_id: stringValue(result.message_id) ?? stringValue(result.id), status: "sent", metadata: {},
    });
  } catch (error) {
    await insertEvent("/rest/v1/outbound_message_events", {
      business_id: business.id, channel, recipient_id: recipient, message_type: "text", message_text: text,
      status: "failed", error_message: errorMessage(error), metadata: {},
    });
    throw error;
  }
}

async function sendMedia(business: Row, recipient: string, media: Row): Promise<void> {
  const token = stringValue(business.whatsapp_access_token);
  const endpoint = stringValue(business.phone_number_id);
  const path = stringValue(media.storage_path);
  if (!token || !endpoint || !path) throw new Error("Media is not available for this business");
  const signed = await supabase<{ signedURL?: string }>("/storage/v1/object/sign/business-media/" + path.replace(/^\/+/, ""), {
    method: "POST", body: JSON.stringify({ expiresIn: 3600 }),
  });
  const signedUrl = signed.signedURL;
  if (!signedUrl) throw new Error("Supabase did not return a media link");
  const body = { messaging_product: "whatsapp", to: recipient, type: "document", document: { link: signedUrl, filename: media.filename } };
  const result = await graphMessage("whatsapp", token, endpoint, body);
  const messages = Array.isArray(result.messages) ? result.messages : [];
  await insertEvent("/rest/v1/outbound_message_events", {
    business_id: business.id, channel: "whatsapp", recipient_id: recipient, message_type: "document",
    external_message_id: stringValue(isRecord(messages[0]) ? messages[0].id : undefined),
    status: "sent", metadata: { media_id: media.id },
  });
}

async function extractWhatsAppImageText(business: Row, imageId: string): Promise<string> {
  const token = stringValue(business.whatsapp_access_token);
  if (!token) throw new Error("No WhatsApp access token configured for image OCR");
  const metadataResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(imageId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metadata = await metadataResponse.json() as Row;
  const mediaUrl = stringValue(metadata.url);
  if (!metadataResponse.ok || !mediaUrl) throw new Error(`WhatsApp media lookup returned ${metadataResponse.status}`);
  const mediaResponse = await fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!mediaResponse.ok) throw new Error(`WhatsApp media download returned ${mediaResponse.status}`);
  const image = Buffer.from(await mediaResponse.arrayBuffer());
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(image);
    return result.data.text.replace(/\s+/g, " ").trim();
  } finally {
    await worker.terminate();
  }
}

async function escalateToOwner(
  business: Row,
  channel: "whatsapp" | "instagram",
  sender: string,
  description: string,
): Promise<"owner_escalation" | "owner_unavailable"> {
  const owner = stringValue(business.owner_whatsapp_number);
  if (!owner || (channel === "whatsapp" && phoneDigits(owner) === phoneDigits(sender))) return "owner_unavailable";
  await sendText(business, "whatsapp", phoneDigits(owner), `New ${channel} message needs a reply from ${sender}: ${description}`);
  return "owner_escalation";
}

async function processIncoming(event: {
  channel: "whatsapp" | "instagram";
  messageId: string;
  sender: string;
  recipient: string;
  text?: string;
  messageType: string;
  imageId?: string;
  payload: Row;
}): Promise<void> {
  const { channel, messageId, sender, recipient, messageType, imageId, payload } = event;
  let text = event.text ?? "";
  if (processedMessageIds.has(`${channel}:${messageId}`)) return;
  processedMessageIds.add(`${channel}:${messageId}`);
  const filter = channel === "whatsapp" ? `phone_number_id=eq.${encodeURIComponent(recipient)}` : `instagram_user_id=eq.${encodeURIComponent(recipient)}`;
  const businesses = await supabase<Row[]>(`/rest/v1/businesses?${filter}&select=*`);
  const business = businesses[0];
  if (!business) {
    await insertEvent("/rest/v1/inbound_message_events", {
      business_id: null,
      channel,
      external_message_id: messageId,
      sender_id: sender,
      recipient_id: recipient,
      message_type: messageType,
      message_text: text || null,
      payload,
      outcome: "business_not_found",
    });
    log("webhook business not found", { channel, messageId });
    return;
  }
  const existing = await supabase<Row[]>(`/rest/v1/inbound_message_events?channel=eq.${channel}&external_message_id=eq.${encodeURIComponent(messageId)}&select=id`);
  if (existing.length) return;
  await insertEvent("/rest/v1/inbound_message_events", {
    business_id: business.id, channel, external_message_id: messageId, sender_id: sender, recipient_id: recipient,
    message_type: messageType, message_text: text || null, payload, outcome: "received",
  });

  let outcome = "escalated";
  let matchedFaqId: string | undefined;
  try {
    if (channel === "whatsapp" && messageType === "image") {
      if (imageId) {
        try {
          text = await extractWhatsAppImageText(business, imageId);
        } catch (error) {
          log("whatsapp image OCR failed", { messageId, businessId: business.id, error: errorMessage(error) });
        }
      }
      const ocrSummary = text
        ? `Image received. OCR text: ${text}`
        : "Image received. No readable text was found.";
      outcome = await escalateToOwner(business, channel, sender, ocrSummary);
    } else if (!text) {
      outcome = await escalateToOwner(business, channel, sender, `${messageType} message received with no text.`);
    } else {
      const mediaRows = await supabase<Row[]>(`/rest/v1/media_items?business_id=eq.${business.id}&select=*`);
      const media = mediaRows.find((item) => matches(text, arrayStrings(item.triggers)));
      if (media && channel === "whatsapp") {
        await sendMedia(business, sender, media);
        outcome = "media_reply";
      } else {
        const faqs = await supabase<Row[]>(`/rest/v1/faqs?business_id=eq.${business.id}&active=eq.true&select=*`);
        const faq = faqs.find((item) => matches(text, [...arrayStrings(item.triggers), stringValue(item.question) ?? ""]));
        if (faq) {
          await sendText(business, channel, sender, stringValue(faq.answer) ?? "Thanks for your message.");
          matchedFaqId = stringValue(faq.id);
          outcome = "faq_reply";
        } else {
          outcome = await escalateToOwner(business, channel, sender, text);
        }
      }
    }
  } catch (error) {
    outcome = "processing_error";
    log("incoming message processing failed", { channel, messageId, businessId: business.id, error: errorMessage(error) });
  }
  await supabase(`/rest/v1/inbound_message_events?channel=eq.${channel}&external_message_id=eq.${encodeURIComponent(messageId)}`, {
    method: "PATCH", body: JSON.stringify({
      outcome,
      message_text: text || null,
      ...(matchedFaqId ? { matched_faq_id: matchedFaqId } : {}),
    }),
  }).catch((error) => log("event outcome update failed", { channel, messageId, error: errorMessage(error) }));
}

function readMultipart(request: Request): Promise<{ fields: Record<string, string>; file?: { filename: string; contentType: string; content: Buffer } }> {
  return new Promise((resolve, reject) => {
    const contentType = request.header("content-type") ?? "";
    const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
    if (!match) return reject(new Error("Multipart boundary is missing"));
    const chunks: Buffer[] = [];
    let total = 0;
    request.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buffer.length;
      if (total > maxUploadBytes) { reject(new Error("Upload exceeds the 10 MB limit")); request.destroy(); return; }
      chunks.push(buffer);
    });
    request.on("end", () => {
      const body = Buffer.concat(chunks);
      const boundary = Buffer.from(`--${match[1] ?? match[2]}`);
      const fields: Record<string, string> = {};
      let file: { filename: string; contentType: string; content: Buffer } | undefined;
      let cursor = body.indexOf(boundary);
      while (cursor !== -1) {
        cursor += boundary.length;
        if (body.subarray(cursor, cursor + 2).toString() === "--") break;
        if (body.subarray(cursor, cursor + 2).toString() === "\r\n") cursor += 2;
        const next = body.indexOf(Buffer.from(`\r\n${boundary.toString()}`), cursor);
        if (next === -1) break;
        const part = body.subarray(cursor, next);
        const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
        if (headerEnd !== -1) {
          const headers = part.subarray(0, headerEnd).toString();
          const content = part.subarray(headerEnd + 4);
          const name = /name="([^"]+)"/i.exec(headers)?.[1];
          if (name) {
            const filename = /filename="([^"]*)"/i.exec(headers)?.[1];
            if (filename !== undefined) file = { filename, contentType: /content-type:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim() ?? "application/octet-stream", content };
            else fields[name] = content.toString();
          }
        }
        cursor = next + 2;
      }
      resolve({ fields, file });
    });
    request.on("error", reject);
  });
}

function rawSignatureValid(request: RawRequest): boolean {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return true;
  const signature = request.header("x-hub-signature-256");
  if (!signature || !request.rawBody) return false;
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(request.rawBody).digest("hex")}`;
  return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

async function handleWebhook(body: unknown): Promise<void> {
  if (!isRecord(body) || !Array.isArray(body.entry)) return;
  for (const rawEntry of body.entry) {
    if (!isRecord(rawEntry)) continue;
    const entry = rawEntry;
    const isInstagram = entry.object === "instagram" || Array.isArray(entry.messaging);
    if (isInstagram && Array.isArray(entry.messaging)) {
      for (const raw of entry.messaging) {
        if (!isRecord(raw) || !isRecord(raw.message)) continue;
        const sender = isRecord(raw.sender) ? stringValue(raw.sender.id) : undefined;
        const recipient = isRecord(raw.recipient) ? stringValue(raw.recipient.id) : stringValue(entry.id);
        const message = raw.message;
        const text = stringValue(message.text);
        const id = stringValue(message.mid);
        const messageType = text ? "text" : Array.isArray(message.attachments) ? "attachment" : "unknown";
        if (sender && recipient && id) void processIncoming({ channel: "instagram", messageId: id, sender, recipient, text, messageType, payload: raw }).catch((error) => log("instagram message processing failed", { messageId: id, error: errorMessage(error) }));
      }
      continue;
    }
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    for (const rawChange of changes) {
      if (!isRecord(rawChange) || !isRecord(rawChange.value)) continue;
      const value = rawChange.value;
      const recipient = isRecord(value.metadata) ? stringValue(value.metadata.phone_number_id) : undefined;
      if (!recipient || !Array.isArray(value.messages)) continue;
      for (const rawMessage of value.messages) {
        if (!isRecord(rawMessage)) continue;
        const text = isRecord(rawMessage.text) ? stringValue(rawMessage.text.body) : undefined;
        const messageType = stringValue(rawMessage.type) ?? (text ? "text" : "unknown");
        const imageId = isRecord(rawMessage.image) ? stringValue(rawMessage.image.id) : undefined;
        const sender = stringValue(rawMessage.from);
        const id = stringValue(rawMessage.id);
        if (sender && id) void processIncoming({ channel: "whatsapp", messageId: id, sender, recipient, text, messageType, imageId, payload: rawMessage }).catch((error) => log("whatsapp message processing failed", { messageId: id, error: errorMessage(error) }));
      }
    }
  }
}

app.use(express.json({
  verify: (request, _response, buffer) => { (request as RawRequest).rawBody = Buffer.from(buffer); },
}));

app.get("/", (_request, response) => response.type("text/plain").send("ok"));
app.get("/api", (_request, response) => response.type("text/plain").send("ok"));
app.get("/api/", (_request, response) => response.type("text/plain").send("ok"));
app.get(["/admin", "/api/admin"], (request, response) => {
  const token = getQueryString(request, "token");
  // The web app removes this one-time query value from the address bar immediately.
  response.redirect(token ? `/?admin=1&token=${encodeURIComponent(token)}` : "/?admin=1");
});

app.get(["/health", "/api/health", "/api/healthz"], async (_request, response) => {
  const result: Row = { ok: true, status: "ok", database: "unknown" };
  if (!process.env.META_APP_SECRET) result.warning = "META_APP_SECRET is not configured; webhook signature verification is disabled";
  try {
    await supabase("/rest/v1/businesses?select=id&limit=1");
    result.database = "connected";
  } catch (error) {
    result.database = "unavailable";
    result.warning = `${stringValue(result.warning) ? `${result.warning}; ` : ""}Supabase is unavailable: ${errorMessage(error)}`;
  }
  response.status(200).json(result);
});

app.get("/api/businesses", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void supabase<Row[]>("/rest/v1/businesses?select=id,name,phone_number_id,owner_whatsapp_number,instagram_user_id,timezone,digest_hour,created_at,updated_at&order=created_at.desc")
    .then((rows) => response.json(rows.map(publicBusiness))).catch((error) => response.status(502).json({ error: errorMessage(error) }));
});

app.post("/api/businesses", (request, response) => {
  if (!requireAdmin(request, response)) return;
  const input = isRecord(request.body) ? request.body : {};
  const fields = allowedBusinessFields(input, true);
  if (!stringValue(fields.name)) { response.status(400).json({ error: "Business name is required" }); return; }
  void supabase<Row[]>("/rest/v1/businesses", { method: "POST", body: JSON.stringify(fields) })
    .then((rows) => response.status(201).json(publicBusiness(rows[0]))).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.patch("/api/businesses/:businessId", (request, response) => {
  if (!requireAdmin(request, response)) return;
  const fields = allowedBusinessFields(isRecord(request.body) ? request.body : {}, true);
  void supabase<Row[]>(`/rest/v1/businesses?id=eq.${encodeURIComponent(request.params.businessId)}`, { method: "PATCH", body: JSON.stringify(fields) })
    .then((rows) => rows[0] ? response.json(publicBusiness(rows[0])) : response.status(404).json({ error: "Business not found" }))
    .catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.get("/api/businesses/:businessId/faqs", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void supabase<Row[]>(`/rest/v1/faqs?business_id=eq.${encodeURIComponent(request.params.businessId)}&select=id,business_id,question,answer,triggers,active,created_at&order=created_at.desc`)
    .then((rows) => response.json(rows)).catch((error) => response.status(502).json({ error: errorMessage(error) }));
});

app.post("/api/businesses/:businessId/faqs", (request, response) => {
  if (!requireAdmin(request, response)) return;
  const input = isRecord(request.body) ? request.body : {};
  const question = stringValue(input.question), answer = stringValue(input.answer);
  if (!question || !answer) { response.status(400).json({ error: "Question and answer are required" }); return; }
  void supabase<Row[]>("/rest/v1/faqs", { method: "POST", body: JSON.stringify({ business_id: request.params.businessId, question, answer, triggers: arrayStrings(input.triggers) }) })
    .then((rows) => response.status(201).json(rows[0])).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.delete("/api/businesses/:businessId/faqs/:faqId", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void supabase(`/rest/v1/faqs?id=eq.${encodeURIComponent(request.params.faqId)}&business_id=eq.${encodeURIComponent(request.params.businessId)}`, { method: "DELETE" })
    .then(() => response.sendStatus(204)).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.post("/api/businesses/:businessId/faqs/:faqId/disable", (request, response) => {
  if (!requireAdmin(request, response)) return;
  const businessId = encodeURIComponent(request.params.businessId);
  const faqId = encodeURIComponent(request.params.faqId);
  void supabase<Row[]>(`/rest/v1/faqs?id=eq.${faqId}&business_id=eq.${businessId}`, {
    method: "PATCH",
    body: JSON.stringify({ active: false }),
  }).then((rows) => {
    if (!rows[0]) {
      response.status(404).json({ error: "FAQ not found" });
      return;
    }
    if (request.accepts(["html", "json"]) === "html") {
      const token = getQueryString(request, "token");
      response.redirect(`/corrections/${encodeURIComponent(request.params.businessId)}${token ? `?token=${encodeURIComponent(token)}` : ""}`);
      return;
    }
    response.json(rows[0]);
  }).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.get("/corrections/:businessId", async (request, response) => {
  if (!requireAdmin(request, response)) return;
  const businessId = request.params.businessId;
  const token = getQueryString(request, "token") ?? "";
  try {
    const events = await supabase<Row[]>(
      `/rest/v1/inbound_message_events?business_id=eq.${encodeURIComponent(businessId)}&outcome=eq.faq_reply&matched_faq_id=not.is.null&select=id,message_text,matched_faq_id,created_at&order=created_at.desc&limit=20`,
    );
    const faqIds = [...new Set(events.map((event) => stringValue(event.matched_faq_id)).filter((id): id is string => Boolean(id)))];
    const faqs = faqIds.length
      ? await supabase<Row[]>(`/rest/v1/faqs?business_id=eq.${encodeURIComponent(businessId)}&id=in.(${faqIds.map(encodeURIComponent).join(",")})&select=id,answer,active`)
      : [];
    const faqById = new Map(faqs.map((faq) => [stringValue(faq.id), faq]));
    const rows = events.map((event) => {
      const faqId = stringValue(event.matched_faq_id) ?? "";
      const faq = faqById.get(faqId);
      const disabled = faq?.active === false;
      return `<article>
        <p><strong>Question asked</strong><br>${escapeHtml(event.message_text || "(no text recorded)")}</p>
        <p><strong>Answer sent</strong><br>${escapeHtml(faq?.answer || "(FAQ no longer available)")}</p>
        <form method="post" action="/api/businesses/${encodeURIComponent(businessId)}/faqs/${encodeURIComponent(faqId)}/disable?token=${encodeURIComponent(token)}">
          <button type="submit"${disabled || !faq ? " disabled" : ""}>${disabled ? "Marked wrong" : "Mark wrong"}</button>
        </form>
      </article>`;
    }).join("");
    response.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FAQ corrections</title><style>
      body{font:16px/1.5 system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 20px;color:#18352d;background:#f7f4ee}
      article{background:#fff;border:1px solid #ddd6ca;border-radius:12px;padding:18px;margin:16px 0}button{background:#218363;color:#fff;border:0;border-radius:8px;padding:10px 16px;font-weight:700}button:disabled{background:#999}
    </style></head><body><h1>FAQ corrections</h1><p>Last 20 FAQ auto-replies.</p>${rows || "<p>No FAQ auto-replies recorded yet.</p>"}</body></html>`);
  } catch (error) {
    response.status(502).type("html").send(`<h1>Could not load corrections</h1><p>${escapeHtml(errorMessage(error))}</p>`);
  }
});

app.get("/api/businesses/:businessId/media", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void supabase<Row[]>(`/rest/v1/media_items?business_id=eq.${encodeURIComponent(request.params.businessId)}&select=id,business_id,label,filename,content_type,size_bytes,triggers,created_at&order=created_at.desc`)
    .then((rows) => response.json(rows)).catch((error) => response.status(502).json({ error: errorMessage(error) }));
});

async function uploadMedia(request: Request, response: Response, businessId: string): Promise<void> {
  if (!requireAdmin(request, response)) return;
  try {
    if ((request.header("content-type") ?? "").toLowerCase().startsWith("application/json")) {
      const input = isRecord(request.body) ? request.body : {};
      const label = stringValue(input.label);
      const filename = stringValue(input.filename);
      const contentType = stringValue(input.content_type) ?? "application/octet-stream";
      if (!label || !filename) { response.status(400).json({ error: "Label and filename are required" }); return; }
      const rows = await supabase<Row[]>("/rest/v1/media_items", { method: "POST", body: JSON.stringify({
        business_id: businessId, label, filename, content_type: contentType,
        size_bytes: typeof input.size_bytes === "number" ? input.size_bytes : 0, triggers: arrayStrings(input.triggers),
      }) });
      response.status(201).json(rows[0]);
      return;
    }
    const { fields, file } = await readMultipart(request);
    const label = fields.label?.trim();
    const triggers = arrayStrings(fields.triggers);
    if (!label || !file?.filename) { response.status(400).json({ error: "Label, trigger phrases, and a file are required" }); return; }
    const extension = file.filename.toLowerCase().split(".").pop();
    const allowed = file.contentType === "application/pdf" || file.contentType.startsWith("image/") || ["pdf", "gif", "jpg", "jpeg", "png", "webp"].includes(extension ?? "");
    if (!allowed) { response.status(400).json({ error: "Only PDF and image files are allowed" }); return; }
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${businessId}/${crypto.randomUUID()}-${safeName}`;
    await supabase(`/storage/v1/object/business-media/${storagePath}`, {
      method: "POST", headers: { "Content-Type": file.contentType, "x-upsert": "false" }, body: file.content as unknown as string,
    });
    const rows = await supabase<Row[]>("/rest/v1/media_items", { method: "POST", body: JSON.stringify({
      business_id: businessId, label, filename: file.filename, content_type: file.contentType, size_bytes: file.content.length, triggers, storage_path: storagePath,
    }) });
    response.status(201).json(rows[0]);
  } catch (error) {
    response.status(400).json({ error: errorMessage(error) });
  }
}

app.post("/api/businesses/:businessId/media", (request, response) => void uploadMedia(request, response, request.params.businessId));
app.delete("/api/businesses/:businessId/media/:mediaId", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void supabase<Row[]>(`/rest/v1/media_items?id=eq.${encodeURIComponent(request.params.mediaId)}&business_id=eq.${encodeURIComponent(request.params.businessId)}&select=storage_path`)
    .then(async (rows) => {
      if (!rows[0]) { response.status(404).json({ error: "Media not found" }); return; }
      if (rows[0].storage_path) await supabase(`/storage/v1/object/business-media/${String(rows[0].storage_path)}`, { method: "DELETE" });
      await supabase(`/rest/v1/media_items?id=eq.${encodeURIComponent(request.params.mediaId)}&business_id=eq.${encodeURIComponent(request.params.businessId)}`, { method: "DELETE" });
      response.sendStatus(204);
    }).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

app.get("/api/dashboard", (request, response) => {
  if (!requireAdmin(request, response)) return;
  void Promise.all([
    supabase<Row[]>("/rest/v1/businesses?select=id"),
    supabase<Row[]>("/rest/v1/inbound_message_events?select=id&limit=1000"),
    supabase<Row[]>("/rest/v1/outbound_message_events?select=id&limit=1000"),
    supabase<Row[]>("/rest/v1/inbound_message_events?select=id,channel,message_text,outcome,created_at&order=created_at.desc&limit=20"),
  ]).then(([businesses, inbound, outbound, recent_events]) => response.json({ businesses: businesses.length, inbound_count: inbound.length, outbound_count: outbound.length, recent_events }))
    .catch((error) => response.status(502).json({ error: errorMessage(error) }));
});

// Existing demo endpoints remain available, while persistent management uses the protected routes above.
app.post("/api/facts", (request, response) => {
  const key = stringValue(request.body?.key), value = stringValue(request.body?.value);
  if (!key || !value) { response.status(400).json({ error: "A fact key and value are required" }); return; }
  response.json({ ok: true });
});
app.post("/api/media", (request, response) => {
  if (!String(request.header("content-type")).toLowerCase().startsWith("multipart/form-data")) { response.status(400).json({ error: "Expected a multipart form upload" }); return; }
  void readMultipart(request).then(({ fields, file }) => {
    if (!fields.label || !file) {
      response.status(400).json({ error: "Label, trigger phrases, and a file are required" });
      return;
    }
    response.json({ ok: true, media: { label: fields.label, triggers: arrayStrings(fields.triggers), filename: file.filename, contentType: file.contentType, size: file.content.length } });
  }).catch((error) => response.status(400).json({ error: errorMessage(error) }));
});

function verifyWebhook(request: RawRequest, response: Response): boolean {
  if (!rawSignatureValid(request)) { response.sendStatus(403); return false; }
  return true;
}
app.get(["/webhook", "/api/webhook"], (request, response) => {
  const mode = getQueryString(request, "hub.mode");
  const token = getQueryString(request, "hub.verify_token");
  const challenge = getQueryString(request, "hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN ?? process.env.VERIFY_TOKEN;
  if (mode === "subscribe" && token === expected && challenge !== undefined) { response.type("text/plain").send(challenge); return; }
  response.sendStatus(403);
});
app.post(["/webhook", "/api/webhook"], (request, response) => {
  if (!verifyWebhook(request as RawRequest, response)) return;
  response.sendStatus(200);
  setImmediate(() => void handleWebhook(request.body).catch((error) => log("webhook processing error", { error: errorMessage(error) })));
});

app.listen(port, () => log("API server listening", { port }));