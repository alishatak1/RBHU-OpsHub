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

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

  if (!endpoint || !apiKey || !deployment) {
    return res.status(503).json({
      error: "AI assistant is not configured yet",
      message: "Add your Azure OpenAI endpoint, API key and deployment name to the backend environment."
    });
  }

  try {
    const url =
      `${endpoint.replace(/\/$/, "")}/openai/deployments/` +
      `${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You are RBHU OpsHub Assistant, a professional logistics operations assistant. " +
              "Help users understand customers, shipments, delivery statuses and operational analytics. " +
              "The latest user message may include current dashboard context such as customer and shipment counts. " +
              "Use that context when answering questions about the dashboard. " +
              "Be clear, concise and practical. Provide step-by-step suggestions when useful. " +
              "Never invent shipment records, customer details, statistics or live database access. " +
              "If information is not provided, explain that you do not have access to it."
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
      console.error("Azure OpenAI request failed:", response.status);
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
