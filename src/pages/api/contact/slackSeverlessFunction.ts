// /api/slack.ts
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

    const SLACK_TOKEN = process.env.SLACK_TOKEN;
    const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

    if (!SLACK_TOKEN || !SLACK_CHANNEL_ID) {
      return res.status(500).json({ error: "Missing Slack credentials" });
    }

    const slackMessage = {
      channel: SLACK_CHANNEL_ID,
      text: `📩 *Liên hệ mới từ website*\n👤 *Tên*: ${name}\n✉️ *Email*: ${email}\n📝 *Nội dung*: ${message}`,
      mrkdwn: true
    };

    const slackResponse = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SLACK_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(slackMessage)
    });

    const data = await slackResponse.json();

    if (!data.ok) {
      return res.status(500).json({ error: "Slack API error", details: data });
    }

    return res.status(200).json({ success: true, message: "Notification sent to Slack" });
  } catch (error) {
    console.error("Error sending to Slack:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
