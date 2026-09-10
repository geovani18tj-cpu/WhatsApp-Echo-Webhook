import express, { type Request } from "express";

const app = express();
const processedMessageIds = new Set<string>();
const port = Number(process.env.PORT ?? 5000);
const maxUploadBytes = 10 * 1024 * 1024;

const adminPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>WhatsApp Admin</title>
    <style>
      :root {
        color-scheme: light;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #fff;
        color: #000;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        padding: 48px 20px 72px;
        background: #fff;
        color: #000;
      }

      main {
        max-width: 600px;
        margin: 0 auto;
      }

      h1 {
        margin: 0 0 48px;
        font-size: 24px;
        font-weight: 600;
      }

      section + section {
        margin-top: 56px;
      }

      h2 {
        margin: 0 0 28px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
      }

      .field,
      .upload-field {
        margin-bottom: 28px;
      }

      label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
      }

      textarea,
      input,
      select {
        display: block;
        width: 100%;
        border: 1px solid #999;
        border-radius: 0;
        padding: 11px 12px;
        background: #fff;
        color: #000;
        font: inherit;
        font-size: 14px;
      }

      textarea {
        min-height: 92px;
        resize: vertical;
      }

      textarea:focus,
      input:focus,
      select:focus {
        outline: 2px solid #000;
        outline-offset: 1px;
      }

      .open-today {
        display: grid;
        grid-template-columns: 132px 1fr;
        gap: 12px;
      }

      .field-meta {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        min-height: 29px;
        padding-top: 5px;
        color: #666;
        font-size: 12px;
      }

      button {
        border: 1px solid #000;
        border-radius: 0;
        padding: 9px 16px;
        background: #000;
        color: #fff;
        font: inherit;
        font-size: 13px;
        cursor: pointer;
      }

      button:hover { background: #444; }
      button:focus-visible { outline: 2px solid #000; outline-offset: 2px; }
      button:disabled { cursor: wait; opacity: 0.55; }

      .status {
        color: #666;
        font-size: 12px;
      }

      .upload-form {
        display: grid;
        gap: 18px;
      }

      .upload-form button {
        justify-self: start;
      }

      .file-help {
        margin: 7px 0 0;
        color: #666;
        font-size: 12px;
      }

      .file-list {
        margin: 36px 0 0;
        padding: 0;
        border-top: 1px solid #999;
        list-style: none;
      }

      .file-item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 20px;
        align-items: start;
        padding: 16px 0;
        border-bottom: 1px solid #999;
      }

      .file-name {
        margin: 0 0 5px;
        font-size: 14px;
        font-weight: 600;
        overflow-wrap: anywhere;
      }

      .file-details {
        margin: 0;
        color: #666;
        font-size: 12px;
        line-height: 1.5;
      }

      .file-item button {
        background: #fff;
        color: #000;
      }

      .file-item button:hover { background: #f1f1f1; }

      .empty-files {
        padding: 16px 0;
        color: #666;
        font-size: 13px;
      }

      @media (max-width: 480px) {
        body { padding-top: 32px; }
        h1 { margin-bottom: 36px; }
        .open-today { grid-template-columns: 1fr; }
        .file-item { grid-template-columns: 1fr; gap: 12px; }
        .file-item button { justify-self: start; }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>WhatsApp Admin</h1>

      <section aria-labelledby="business-info-heading">
        <h2 id="business-info-heading">BUSINESS INFO</h2>
        <form id="facts-form">
          <div class="field">
            <label for="opening-hours">Opening hours</label>
            <textarea id="opening-hours" data-fact-key="openingHours" placeholder="Mon–Fri, 9am–5pm"></textarea>
            <div class="field-meta">
              <span class="status" aria-live="polite"></span>
              <span><span data-count-for="opening-hours">0</span> characters</span>
            </div>
            <button type="button" data-save-for="opening-hours">Save</button>
          </div>

          <div class="field">
            <label for="location">Location</label>
            <textarea id="location" data-fact-key="location" placeholder="Kingston, Jamaica"></textarea>
            <div class="field-meta">
              <span class="status" aria-live="polite"></span>
              <span><span data-count-for="location">0</span> characters</span>
            </div>
            <button type="button" data-save-for="location">Save</button>
          </div>

          <div class="field">
            <label for="delivery-areas">Delivery areas</label>
            <textarea id="delivery-areas" data-fact-key="deliveryAreas" placeholder="Kingston and St. Andrew"></textarea>
            <div class="field-meta">
              <span class="status" aria-live="polite"></span>
              <span><span data-count-for="delivery-areas">0</span> characters</span>
            </div>
            <button type="button" data-save-for="delivery-areas">Save</button>
          </div>

          <div class="field">
            <label for="payment-methods">Payment methods</label>
            <textarea id="payment-methods" data-fact-key="paymentMethods" placeholder="Cash, bank transfer, and card"></textarea>
            <div class="field-meta">
              <span class="status" aria-live="polite"></span>
              <span><span data-count-for="payment-methods">0</span> characters</span>
            </div>
            <button type="button" data-save-for="payment-methods">Save</button>
          </div>

          <div class="field">
            <label for="open-today-status">Are you open today</label>
            <div class="open-today">
              <select id="open-today-status" aria-label="Are you open today">
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
              <input id="open-today-note" type="text" placeholder="Optional note">
            </div>
            <div class="field-meta">
              <span class="status" aria-live="polite"></span>
              <span><span data-count-for="open-today-status">3</span> characters</span>
            </div>
            <button type="button" data-save-for="open-today-status">Save</button>
          </div>
        </form>
      </section>

      <section aria-labelledby="files-heading">
        <h2 id="files-heading">FILES</h2>
        <form id="upload-form" class="upload-form">
          <div class="upload-field">
            <label for="file-label">Label</label>
            <input id="file-label" name="label" type="text" placeholder="Price list" required>
          </div>
          <div class="upload-field">
            <label for="file-triggers">Trigger phrases</label>
            <input id="file-triggers" name="triggers" type="text" placeholder="price list, send price, wah di price" required>
          </div>
          <div class="upload-field">
            <label for="file-upload">File</label>
            <input id="file-upload" name="file" type="file" accept=".pdf,image/*" required>
            <p class="file-help">PDF or image files only.</p>
          </div>
          <div>
            <button type="submit">Upload file</button>
            <span class="status" id="upload-status" aria-live="polite"></span>
          </div>
        </form>
        <ul class="file-list" id="file-list">
          <li class="empty-files" id="empty-files">No files uploaded in this session.</li>
        </ul>
      </section>
    </main>

    <script>
      const statusFor = (element) => element.closest(".field").querySelector(".status");
      const valueFor = (id) => {
        if (id === "open-today-status") {
          const status = document.getElementById("open-today-status").value;
          const note = document.getElementById("open-today-note").value.trim();
          return note ? status + " — " + note : status;
        }
        return document.getElementById(id).value;
      };

      const updateCount = (id) => {
        const count = valueFor(id).length;
        document.querySelector("[data-count-for='" + id + "']").textContent = count;
      };

      document.querySelectorAll("textarea, input, select").forEach((element) => {
        const id = element.id;
        if (id === "file-label" || id === "file-triggers" || id === "file-upload") return;
        element.addEventListener("input", () => updateCount(id === "open-today-note" ? "open-today-status" : id));
        element.addEventListener("change", () => updateCount(id === "open-today-note" ? "open-today-status" : id));
      });

      document.querySelectorAll("[data-save-for]").forEach((button) => {
        button.addEventListener("click", async () => {
          const id = button.dataset.saveFor;
          const field = document.getElementById(id);
          const status = statusFor(field);
          const key = field.dataset.factKey || "openToday";
          const value = valueFor(id);
          button.disabled = true;
          status.textContent = "Saving…";
          try {
            const response = await fetch("/api/facts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key, value })
            });
            if (!response.ok) throw new Error("Request failed");
            status.textContent = "Saved";
          } catch (error) {
            status.textContent = "Could not save";
          } finally {
            button.disabled = false;
          }
        });
      });

      const uploadForm = document.getElementById("upload-form");
      const uploadStatus = document.getElementById("upload-status");
      const fileList = document.getElementById("file-list");
      const emptyFiles = document.getElementById("empty-files");

      const addFile = (media) => {
        emptyFiles.remove();
        const item = document.createElement("li");
        item.className = "file-item";
        const details = document.createElement("div");
        const name = document.createElement("p");
        name.className = "file-name";
        name.textContent = media.label;
        const info = document.createElement("p");
        info.className = "file-details";
        info.textContent = media.filename + " · " + media.triggers.join(", ");
        details.append(name, info);
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Delete";
        remove.addEventListener("click", () => item.remove());
        item.append(details, remove);
        fileList.append(item);
      };

      uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = uploadForm.querySelector("button[type='submit']");
        button.disabled = true;
        uploadStatus.textContent = "Uploading…";
        try {
          const response = await fetch("/api/media", {
            method: "POST",
            body: new FormData(uploadForm)
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Upload failed");
          addFile(result.media);
          uploadForm.reset();
          uploadStatus.textContent = "Uploaded";
        } catch (error) {
          uploadStatus.textContent = error.message || "Could not upload";
        } finally {
          button.disabled = false;
        }
      });
    </script>
  </body>
</html>`;

app.use(express.json());

function timestamp(): string {
  return new Date().toISOString();
}

function log(label: string, details: unknown): void {
  console.log(`[${timestamp()}] ${label} ${JSON.stringify(details)}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined;
}

function getQueryString(
  request: Request,
  key: string,
): string | undefined {
  const value = request.query[key];
  return typeof value === "string" ? value : undefined;
}

function readRequestBody(request: Request): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    request.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += buffer.length;
      if (totalBytes > maxUploadBytes) {
        reject(new Error("Upload exceeds the 10 MB limit"));
        request.destroy();
        return;
      }
      chunks.push(buffer);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseMultipart(
  body: Buffer,
  contentType: string,
): {
  fields: Record<string, string>;
  files: Record<string, { filename: string; contentType: string; size: number }>;
} {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) throw new Error("Multipart boundary is missing");

  const boundary = Buffer.from(`--${match[1] ?? match[2]}`);
  const fields: Record<string, string> = {};
  const files: Record<
    string,
    { filename: string; contentType: string; size: number }
  > = {};
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    cursor += boundary.length;
    if (body.subarray(cursor, cursor + 2).toString() === "--") break;
    if (body.subarray(cursor, cursor + 2).toString() === "\r\n") cursor += 2;

    const nextBoundary = body.indexOf(
      Buffer.from(`\r\n${boundary.toString()}`),
      cursor,
    );
    if (nextBoundary === -1) break;

    const part = body.subarray(cursor, nextBoundary);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) {
      cursor = nextBoundary + 2;
      continue;
    }

    const headers = part.subarray(0, headerEnd).toString("utf8");
    const content = part.subarray(headerEnd + 4);
    const nameMatch = /name="([^"]+)"/i.exec(headers);
    if (!nameMatch) {
      cursor = nextBoundary + 2;
      continue;
    }

    const name = nameMatch[1];
    const filenameMatch = /filename="([^"]*)"/i.exec(headers);
    if (filenameMatch) {
      const contentTypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headers);
      files[name] = {
        filename: filenameMatch[1],
        contentType: contentTypeMatch?.[1]?.trim() ?? "application/octet-stream",
        size: content.length,
      };
    } else {
      fields[name] = content.toString("utf8");
    }

    cursor = nextBoundary + 2;
  }

  return { fields, files };
}

function normalizeTriggers(value: string): string[] {
  return value
    .split(",")
    .map((trigger) => trigger.trim())
    .filter(Boolean);
}

async function sendWhatsAppReply(
  sender: string,
  messageId: string,
  receivedText: string,
): Promise<void> {
  const token = process.env.META_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    log("outgoing message skipped: missing Meta configuration", {
      messageId,
      sender,
    });
    return;
  }

  const body = {
    messaging_product: "whatsapp",
    to: sender,
    type: "text",
    text: { body: `You said: ${receivedText}` },
  };

  log("outgoing message", { messageId, to: sender, body });

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(phoneNumberId)}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const responseText = await response.text();
    log("outgoing message result", {
      messageId,
      status: response.status,
      ok: response.ok,
      response: responseText,
    });
  } catch (error) {
    log("outgoing message error", {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function processWebhook(body: unknown): Promise<void> {
  if (!isRecord(body) || !Array.isArray(body.entry)) {
    return;
  }

  const entry = body.entry[0];
  if (!isRecord(entry) || !Array.isArray(entry.changes)) {
    return;
  }

  const change = entry.changes[0];
  if (!isRecord(change) || !isRecord(change.value)) {
    return;
  }

  const messages = change.value.messages;
  if (!Array.isArray(messages) || !isRecord(messages[0])) {
    return;
  }

  const message = messages[0];
  const messageId = getString(message, "id");
  const sender = getString(message, "from");
  const type = getString(message, "type");
  const textValue = message.text;
  const receivedText =
    isRecord(textValue) ? getString(textValue, "body") : undefined;

  if (!messageId || !sender || !type || !receivedText) {
    log("incoming message ignored: missing fields", {
      messageId,
      sender,
      type,
    });
    return;
  }

  if (processedMessageIds.has(messageId)) {
    log("incoming message skipped: duplicate", { messageId, sender });
    return;
  }

  processedMessageIds.add(messageId);
  log("incoming message", {
    messageId,
    sender,
    type,
    text: receivedText,
  });

  await sendWhatsAppReply(sender, messageId, receivedText);
}

app.get(["/admin", "/api/admin"], (_request, response) => {
  response.type("html").send(adminPage);
});

app.get("/", (_request, response) => {
  response.type("text/plain").send("ok");
});

app.get("/api", (_request, response) => {
  response.type("text/plain").send("ok");
});

app.get("/api/", (_request, response) => {
  response.type("text/plain").send("ok");
});

app.get("/api/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

app.post("/api/facts", (request, response) => {
  const { key, value } = request.body ?? {};
  if (
    typeof key !== "string" ||
    typeof value !== "string" ||
    !key.trim() ||
    !value.trim()
  ) {
    response.status(400).json({ error: "A fact key and value are required" });
    return;
  }

  log("business fact received", { key, value });
  response.status(200).json({ ok: true });
});

app.post("/api/media", async (request, response) => {
  const contentType = request.header("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    response
      .status(400)
      .json({ error: "Expected a multipart form upload" });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const { fields, files } = parseMultipart(body, contentType);
    const label = fields.label?.trim();
    const triggers = fields.triggers ? normalizeTriggers(fields.triggers) : [];
    const file = files.file;

    if (!label || triggers.length === 0 || !file?.filename) {
      response
        .status(400)
        .json({ error: "Label, trigger phrases, and a file are required" });
      return;
    }

    const fileExtension = file.filename.toLowerCase().split(".").pop();
    const isPdf = file.contentType === "application/pdf" || fileExtension === "pdf";
    const isImage =
      file.contentType.startsWith("image/") ||
      ["gif", "jpg", "jpeg", "png", "webp"].includes(fileExtension ?? "");

    if (!isPdf && !isImage) {
      response.status(400).json({ error: "Only PDF and image files are allowed" });
      return;
    }

    const media = {
      label,
      triggers,
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
    };
    log("media upload received", media);
    response.status(200).json({ ok: true, media });
  } catch (error) {
    log("media upload error", {
      error: error instanceof Error ? error.message : String(error),
    });
    response.status(400).json({ error: "Could not read the upload" });
  }
});

app.get("/api/webhook", (request, response) => {
  const mode = getQueryString(request, "hub.mode");
  const verifyToken = getQueryString(request, "hub.verify_token");
  const challenge = getQueryString(request, "hub.challenge");

  if (
    mode === "subscribe" &&
    verifyToken === process.env.VERIFY_TOKEN &&
    challenge !== undefined
  ) {
    response.type("text/plain").status(200).send(challenge);
    return;
  }

  response.sendStatus(403);
});

app.post("/api/webhook", (request, response) => {
  response.sendStatus(200);
  setImmediate(() => {
    void processWebhook(request.body).catch((error: unknown) => {
      log("webhook processing error", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });
});

app.listen(port, () => {
  console.log(`[${timestamp()}] WhatsApp echo server listening on port ${port}`);
});
