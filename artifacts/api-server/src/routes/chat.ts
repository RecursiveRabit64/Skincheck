import { Router } from "express";
import OpenAI from "openai";
import { ChatBody } from "@workspace/api-zod";

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/chat", async (req, res) => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { messages, diagnosisContext, affectedAreas } = parsed.data;

  const areasText = affectedAreas && affectedAreas.length > 0
    ? affectedAreas
        .map((a) => {
          const med = a.medication ? ` (using: ${a.medication})` : "";
          return `- ${a.region}: ${a.condition}, severity ${a.severity}/10${med}`;
        })
        .join("\n")
    : "Not provided";

  const systemPrompt = `You are a friendly, knowledgeable dermatology assistant helping a teenager understand their skin health.
You have access to their self-reported skin map and AI diagnosis below. Answer their questions clearly, empathetically, and in plain language.
Keep answers concise (2-5 sentences). If they ask something outside your expertise, recommend seeing a real dermatologist.
Never diagnose definitively — always frame as "this could be" or "it sounds like".

--- Skin Map ---
${areasText}

--- AI Assessment ---
${diagnosisContext ?? "Not available"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      max_tokens: 512,
    });

    const reply = completion.choices[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    res.json({ reply });
  } catch (err) {
    req.log.error({ err }, "Chat failed");
    res.status(500).json({ error: "Failed to get chat response" });
  }
});

export default router;
