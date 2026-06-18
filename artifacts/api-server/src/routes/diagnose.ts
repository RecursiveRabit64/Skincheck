import { Router } from "express";
import OpenAI from "openai";
import { DiagnoseBody } from "@workspace/api-zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/diagnose", async (req, res) => {
  const parsed = DiagnoseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { affectedAreas, age, additionalNotes } = parsed.data;

  const areasDescription = affectedAreas
    .map(
      (a) =>
        `- Region: ${a.region}, Condition: ${a.condition}, Severity: ${a.severity}/10`,
    )
    .join("\n");

  const systemPrompt = `You are a friendly dermatology assistant helping teenagers understand their skin health.
You provide helpful, educational information about skin conditions in a warm and non-alarming tone.
Always include a medical disclaimer and encourage consulting a real dermatologist for proper diagnosis.
Be reassuring and empathetic — many teens feel self-conscious about skin issues.
When medications are listed, comment on whether they are appropriate for the conditions and suggest any adjustments.
Return ONLY valid JSON matching the exact schema provided.`;

  const medicationSection = additionalNotes
    ? `\nMedications currently being applied:\n${additionalNotes}\n`
    : "\nNo medications currently being applied.\n";

  const userPrompt = `A user has marked the following affected body areas on an interactive body map:

${areasDescription}
${age ? `\nUser age: ${age}` : ""}
${medicationSection}
Based on these symptoms and any current treatments, provide a skin assessment in the following JSON format:
{
  "summary": "A friendly 2-3 sentence overview of what you observe and whether current medications look helpful",
  "conditions": [
    {
      "name": "Condition name",
      "likelihood": "possible" | "likely" | "very_likely",
      "description": "Brief description of this condition and why it might match"
    }
  ],
  "recommendations": [
    {
      "type": "medication" | "lifestyle" | "skincare" | "see_doctor",
      "title": "Short title",
      "description": "Detailed actionable advice — if they are already using a medication, mention whether to continue, adjust, or add something",
      "urgency": "low" | "medium" | "high"
    }
  ],
  "disclaimer": "Standard medical disclaimer",
  "seekDoctorUrgently": true | false
}

List 1-3 most likely conditions. Give 3-5 practical recommendations. Keep language teen-friendly.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    const result = JSON.parse(content);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Diagnosis failed");
    res.status(500).json({ error: "Failed to generate diagnosis" });
  }
});

export default router;
