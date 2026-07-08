
// src/ai/flows/generate-questions.ts
'use server';

/**
 * @fileOverview Implements AI-powered question generation for new campaigns.
 *
 * - generateQuestions - Generates survey questions based on a campaign goal.
 * - GenerateQuestionsInput - Input type for the generateQuestions function.
 * - GenerateQuestionsOutput - Output type for the generateQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionsInputSchema = z.object({
  campaignGoal: z.string().describe('The goal of the marketing campaign.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionSchema = z.object({
    text: z.string().describe("The text of the question."),
    type: z.enum(['multiple-choice', 'open-text']).describe("The type of the question."),
    options: z.array(z.string()).describe("An array of options for multiple-choice questions. Empty for open-text questions.")
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema).describe('An array of generated questions.'),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `You are an expert in brand research and survey design. Your task is to generate a set of insightful survey questions for a marketing campaign based on a given goal.

You must generate between 3 and 5 questions. The questions should follow best practices for survey design, avoiding leading questions, double-barreled questions, and ambiguity.

The question types should be a mix of 'multiple-choice' and 'open-text'. For 'multiple-choice' questions, provide 3 to 5 relevant options.

Campaign Goal:
"{{{campaignGoal}}}"

Based on this goal, generate a set of questions. Output your response in the specified JSON format.
`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuestionsPrompt(input);
    return output!;
  }
);
