import { describe, it, expect } from 'vitest';
import { z } from 'genkit';

// Replicate the schemas from generate-questions.ts to test independently
const QuestionSchema = z.object({
  text: z.string(),
  type: z.enum(['multiple-choice', 'open-text']),
  options: z.array(z.string()),
});

const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});

const GenerateQuestionsInputSchema = z.object({
  campaignGoal: z.string(),
});

describe('GenerateQuestions schemas', () => {
  describe('QuestionSchema', () => {
    it('validates a multiple-choice question', () => {
      const result = QuestionSchema.parse({
        text: 'What is your favorite color?',
        type: 'multiple-choice',
        options: ['Red', 'Blue', 'Green'],
      });
      expect(result.text).toBe('What is your favorite color?');
      expect(result.options).toHaveLength(3);
    });

    it('validates an open-text question with empty options', () => {
      const result = QuestionSchema.parse({
        text: 'Tell us why you chose this?',
        type: 'open-text',
        options: [],
      });
      expect(result.type).toBe('open-text');
    });

    it('rejects invalid question type', () => {
      expect(() => QuestionSchema.parse({
        text: 'Bad question',
        type: 'slider',
        options: [],
      })).toThrow();
    });

    it('rejects missing text', () => {
      expect(() => QuestionSchema.parse({
        type: 'multiple-choice',
        options: ['A', 'B'],
      })).toThrow();
    });
  });

  describe('GenerateQuestionsOutputSchema', () => {
    it('validates a full output with questions', () => {
      const result = GenerateQuestionsOutputSchema.parse({
        questions: [
          { text: 'Q1', type: 'multiple-choice', options: ['A', 'B'] },
          { text: 'Q2', type: 'open-text', options: [] },
        ],
      });
      expect(result.questions).toHaveLength(2);
    });

    it('accepts empty questions array (valid schema)', () => {
      const result = GenerateQuestionsOutputSchema.parse({
        questions: [],
      });
      expect(result.questions).toHaveLength(0);
    });
  });

  describe('GenerateQuestionsInputSchema', () => {
    it('validates campaign goal input', () => {
      const result = GenerateQuestionsInputSchema.parse({
        campaignGoal: 'Test campaign goal',
      });
      expect(result.campaignGoal).toBe('Test campaign goal');
    });

    it('rejects missing campaign goal', () => {
      expect(() => GenerateQuestionsInputSchema.parse({})).toThrow();
    });
  });
});
