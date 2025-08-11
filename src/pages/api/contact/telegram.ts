// /api/telegram.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return res.status(500).json({ error: "Missing Telegram credentials" });
    }

    const telegramMessage = `
📩 *Liên hệ mới từ website*
👤 *Tên*: ${name}
✉️ *Email*: ${email}
📝 *Nội dung*: ${message}
    `;

    const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const telegramResponse = await fetch(telegramApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: "Markdown"
      })
    });

    const data = await telegramResponse.json();

    if (!data.ok) {
      return res.status(500).json({ error: "Telegram API error", details: data });
    }

    return res.status(200).json({ success: true, message: "Notification sent to Telegram" });
  } catch (error) {
    console.error("Error sending to Telegram:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
