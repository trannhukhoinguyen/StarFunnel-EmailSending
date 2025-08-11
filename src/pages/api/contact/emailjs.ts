// /api/emailjs.ts
// Serverless endpoint: Send email via EmailJS + trigger Telegram notification via /api/telegram
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message, subject } = req.body ?? {};

    if (!name || !email || (!message && !subject)) {
      return res.status(400).json({
        error: "Missing required fields (name, email, message/subject)",
      });
    }

    // EmailJS ENV
    const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_USER_ID, SITE_URL } = process.env;
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_USER_ID) {
      return res.status(500).json({ error: "Missing EmailJS environment variables" });
    }
    if (!SITE_URL) {
      return res.status(500).json({ error: "Missing SITE_URL environment variable" });
    }

    // Gửi email qua EmailJS
    const template_params = {
      from_name: name,
      from_email: email,
      subject: subject || "Contact form",
      message: message || "",
    };

    const payload = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_USER_ID,
      template_params,
    };

    const emailjsUrl = "https://api.emailjs.com/api/v1.0/email/send";

    const emailResponse = await fetch(emailjsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const emailText = await emailResponse.text();
    if (!emailResponse.ok) {
      console.error("EmailJS error:", emailResponse.status, emailText);
      return res.status(502).json({
        error: "Failed to send email via EmailJS",
        details: emailText,
      });
    }

    // Gọi API /api/telegram để gửi thông báo
    const telegramRes = await fetch(`${SITE_URL}/api/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `
📩 *Liên hệ mới từ website*
👤 *Tên*: ${name}
✉️ *Email*: ${email}
📝 *Nội dung*: ${message || "(Không có)"} 
        `,
      }),
    });

    const telegramData = await telegramRes.json();
    if (!telegramRes.ok || !telegramData.success) {
      console.error("Telegram API error:", telegramData);
      return res.status(500).json({
        error: "Email sent, but Telegram notification failed",
        details: telegramData,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email sent via EmailJS & Telegram notification sent",
      email_details: emailText,
      telegram_details: telegramData,
    });
  } catch (err) {
    console.error("Internal error in /api/emailjs:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
