"use server";

type ParsedJob = {
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  keyRequirements: string[];
};

async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Add GEMINI_API_KEY to your environment to use AI tools.");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
    },
  );
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${message.slice(0, 240)}`);
  }
  const result: { candidates?: { content?: { parts?: { text?: string }[] } }[] } = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned an empty response. Please try again.");
  return text;
}

export async function parseJobDescription(description: string): Promise<ParsedJob> {
  if (description.trim().length < 30) throw new Error("Paste a job description with at least 30 characters.");
  const text = await askGemini(
    `Extract job details from the text below. Return only valid JSON with exactly these string/array fields: jobTitle, companyName, location, salary, keyRequirements (array of up to 6 concise strings). Use an empty string when information is not present. Do not guess.\n\n${description.slice(0, 12000)}`,
  );
  try {
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as ParsedJob;
    if (
      typeof parsed.jobTitle !== "string" ||
      typeof parsed.companyName !== "string" ||
      typeof parsed.location !== "string" ||
      typeof parsed.salary !== "string" ||
      !Array.isArray(parsed.keyRequirements) ||
      !parsed.keyRequirements.every((item) => typeof item === "string")
    ) throw new Error("Invalid shape");
    return parsed;
  } catch {
    throw new Error("Could not read the AI response. Please try again or enter the job details manually.");
  }
}

export async function generateJobMessage(
  job: { jobTitle: string; companyName: string; jobDescription: string; keyRequirements: string[] },
  kind: "cover-letter" | "follow-up",
): Promise<string> {
  const intent = kind === "cover-letter"
    ? "Write a concise, warm, specific cover letter of 3 short paragraphs. Do not invent the applicant's experience or personal details; use [your relevant experience] where needed."
    : "Write a concise, friendly follow-up email after applying. Include a subject line. Do not invent the applicant's experience or personal details.";
  return askGemini(`${intent}\nRole: ${job.jobTitle} at ${job.companyName}.\nRequirements: ${job.keyRequirements.join(", ") || "Not provided"}.\nDescription: ${job.jobDescription.slice(0, 5000)}`);
}
