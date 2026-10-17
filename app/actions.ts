"use server";

type ParsedJob = {
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  keyRequirements: string[];
};

const GEMINI_MAX_ATTEMPTS = 3;

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("Retry-After");
  const retryAfterSeconds = retryAfter ? Number(retryAfter) : Number.NaN;
  const retryAfterDate = retryAfter ? Date.parse(retryAfter) : Number.NaN;
  const requestedDelay = Number.isFinite(retryAfterSeconds)
    ? retryAfterSeconds * 1000
    : Number.isFinite(retryAfterDate)
      ? retryAfterDate - Date.now()
      : 500 * 2 ** attempt;
  return Math.min(Math.max(requestedDelay, 0), 5000);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Add GEMINI_API_KEY to your environment to use AI tools.");

  let response: Response | undefined;
  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt += 1) {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }),
      },
    );
    if (response.ok) break;

    const retryable = response.status === 429 || response.status >= 500;
    if (retryable && attempt < GEMINI_MAX_ATTEMPTS - 1) {
      await wait(retryDelay(response, attempt));
      continue;
    }
    if (retryable) {
      throw new Error(`Gemini is temporarily unavailable (${response.status}). Please try again in a moment or enter the job details manually.`);
    }

    const message = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${message.slice(0, 240)}`);
  }
  if (!response?.ok) throw new Error("Gemini is temporarily unavailable. Please try again in a moment.");

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
