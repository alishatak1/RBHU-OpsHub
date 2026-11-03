import { Router } from "express";
import { z } from "zod";

const router = Router();

const chatSchema = z.object({
  message: z.string().trim().min(1).max(6000),
  history: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(4000)
    })
  ).max(20).default([])
});

router.post("/", async (req, res) => {
  const validation = chatSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid chat request",
      details: validation.error.issues
    });
  }

  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "gemini-2.5-flash";
  const baseUrl = (process.env.AI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/$/, "");

  if (!apiKey) {
    return res.status(503).json({
      error: "AI assistant is not configured",
      message: "Add AI_API_KEY to the backend environment."
    });
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
  "You are RBHU OpsHub Assistant, a professional logistics operations assistant. " +
  "Help users understand customers, shipments, delivery statuses and operational analytics. " +
  "The latest user message may include dashboard summary counts calculated from the application's loaded data. " +
  "You may use those supplied counts to answer questions about dashboard totals and shipment statuses. " +
  "However, you do not have direct database access and must not claim to retrieve individual customer or shipment records unless those records are explicitly provided. " +
  "Never invent shipment records, customer details, statistics or database results. " +
  "If information is not provided, clearly explain the limitation. " +
  "Be clear, concise and practical. Provide step-by-step suggestions when useful."
          },
          ...validation.data.history,
          {
            role: "user",
            content: validation.data.message
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      console.error("AI provider request failed:", response.status);
      return res.status(502).json({
        error: "The AI service could not process your request",
        status: response.status
      });
    }

    const data = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(502).json({
        error: "The AI service returned an empty response"
      });
    }

    return res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while processing your message"
    });
  }
});

export default router;
