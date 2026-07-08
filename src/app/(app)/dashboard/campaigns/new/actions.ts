
"use server";

import { generateQuestions, type GenerateQuestionsOutput } from "@/ai/flows/generate-questions";

export async function generateQuestionsAction(
  prevState: { result: GenerateQuestionsOutput | null; error: string | null },
  formData: FormData
): Promise<{ result: GenerateQuestionsOutput | null; error: string | null }> {
  
  const campaignGoal = formData.get("campaignGoal") as string;
  if (!campaignGoal || campaignGoal.trim() === "") {
    return { result: null, error: "Please enter a campaign goal." };
  }

  try {
    const result = await generateQuestions({ campaignGoal });
    return { result, error: null };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    return { result: null, error: `Failed to generate questions: ${errorMessage}` };
  }
}
