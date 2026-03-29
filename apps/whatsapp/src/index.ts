import "dotenv/config";
import { setDefaultResultOrder } from "node:dns";
setDefaultResultOrder("ipv4first");
import express from "express";
import { handleWebhookVerify, handleWebhookPost } from "./webhook/handler";
import { upsertAppleHealthSnapshot } from "./lib/storage";

const app = express();
app.use(express.json());

// ============================================
// Health check
// ============================================

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "p360-whatsapp" });
});

// ============================================
// Meta WhatsApp webhook
// ============================================

app.get("/webhook", handleWebhookVerify);
app.post("/webhook", handleWebhookPost);

// ============================================
// Apple Health ingest (iOS Shortcut → Supabase)
// ============================================

app.post("/health/apple", async (req, res) => {
  const secret = req.headers["x-p360-secret"];
  if (!secret || secret !== process.env.INGEST_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as {
    user_id?: string;
    date?: string;
    hrv_sdnn_ms?: number;
    resting_hr?: number;
    sleep_minutes?: number;
    deep_sleep_minutes?: number;
    sleep_efficiency?: number;
    bedtime_hour?: number;
  };

  if (!body.user_id || !body.date) {
    res.status(400).json({ error: "user_id and date required" });
    return;
  }

  try {
    await upsertAppleHealthSnapshot({
      user_id: body.user_id,
      date: body.date,
      hrv_sdnn_ms: body.hrv_sdnn_ms ?? null,
      resting_hr: body.resting_hr ?? null,
      sleep_minutes: body.sleep_minutes ?? null,
      deep_sleep_minutes: body.deep_sleep_minutes ?? null,
      sleep_efficiency: body.sleep_efficiency ?? null,
      bedtime_hour: body.bedtime_hour ?? null,
    });
    res.json({ status: "ok", user_id: body.user_id, date: body.date });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ingest] error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ============================================
// Start server
// ============================================

const PORT = parseInt(process.env.PORT ?? "3001", 10);
app.listen(PORT, () => {
  console.log(`p360-whatsapp listening on port ${PORT}`);
});
