const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const categorizeReport = async (title, description) => {
  const prompt = `Classify the following bug report into exactly one of these categories: bug, feature_request, question, other.
Respond with ONLY the category word, nothing else.

Title: ${title}
Description: ${description || "N/A"}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const category = response.text.trim().toLowerCase();
  const validCategories = ["bug", "feature_request", "question", "other"];

  return validCategories.includes(category) ? category : "other";
};


const findDuplicateReport = async (title, description, existingReports) => {
  if (existingReports.length === 0) return null;

  const reportsList = existingReports
    .map(
      (r) =>
        `id: ${r.id}, title: ${r.title}, description: ${r.description || "N/A"}`,
    )
    .join("\n");

  const prompt = `You are comparing a new report against a list of existing reports to detect duplicates.

New report:
Title: ${title}
Description: ${description || "N/A"}

Existing reports:
${reportsList}

If the new report describes the same underlying issue as one of the existing reports, respond with ONLY that report's id number, nothing else.
If there is no clear duplicate, respond with ONLY the word "none".`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const answer = response.text.trim().toLowerCase();
  if (answer === "none" || isNaN(parseInt(answer))) {
    return null;
  }

  return parseInt(answer);
};


module.exports = { categorizeReport, findDuplicateReport };
