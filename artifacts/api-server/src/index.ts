import express, { type Request } from "express";

const app = express();
const processedMessageIds = new Set<string>();
const port = Number(process.env.PORT ?? 5000);

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
