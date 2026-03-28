import { Request, Response } from "express";
import { AppleHealthProvider } from "@p360/core";
import { getUserIdByPhone } from "../lib/storage";
import { getAskText } from "../lib/ask";
import { sendWhatsAppMessage } from "../lib/meta-client";

const appleHealthProvider = new AppleHealthProvider();

/**
 * GET /webhook — Meta verification handshake
 */
export function handleWebhookVerify(req: Request, res: Response): void {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send("Forbidden");
  }
}

/**
 * POST /webhook — Receive WhatsApp messages
 * Returns 200 immediately; processes asynchronously.
 */
export function handleWebhookPost(req: Request, res: Response): void {
  res.sendStatus(200);

  const body = req.body as WhatsAppWebhookBody;
  processIncoming(body).catch((err) => {
    console.error("[webhook] processing error:", err);
  });
}

async function processIncoming(body: WhatsAppWebhookBody): Promise<void> {
  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;

  if (!value?.messages?.length) return;

  for (const message of value.messages) {
    if (message.type !== "text") continue;

    const phone = message.from;
    const text = message.text?.body?.trim();
    if (!text) continue;

    const userId = await getUserIdByPhone(phone);
    if (!userId) {
      await sendWhatsAppMessage(
        phone,
        "Your number isn't registered with p360. Contact support to get set up."
      ).catch(() => {});
      continue;
    }

    let replyText: string;
    try {
      const data = await appleHealthProvider.fetchBiometricData(userId);
      replyText = await getAskText(text, data, userId);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      replyText = `p360 couldn't load your data: ${errMsg}\n\nMake sure your iOS Shortcut has run today.`;
    }

    await sendWhatsAppMessage(phone, replyText).catch((err) => {
      console.error("[webhook] failed to send message:", err);
    });
  }
}

// ============================================
// Webhook payload types (subset we need)
// ============================================

interface WhatsAppWebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from: string;
          type: string;
          text?: { body: string };
        }>;
      };
    }>;
  }>;
}
