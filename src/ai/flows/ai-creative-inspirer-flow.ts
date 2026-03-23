'use server';
/**
 * @fileOverview A Genkit flow that generates creative inspiration (character traits or scene ideas) based on user-provided keywords.
 *
 * - aiCreativeInspirer - A function that handles the inspiration generation process.
 * - AiCreativeInspirerInput - The input type for the aiCreativeInspirer function.
 * - AiCreativeInspirerOutput - The return type for the aiCreativeInspirer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCreativeInspirerInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords to inspire creative ideas, e.g., "brave knight", "haunted forest", "futuristic city".'),
});
export type AiCreativeInspirerInput = z.infer<typeof AiCreativeInspirerInputSchema>;

const AiCreativeInspirerOutputSchema = z.object({
  inspirationType: z
    .enum(['character', 'scene'])
    .describe('The type of inspiration generated, either "character" or "scene".'),
  title: z.string().describe('A brief, catchy title for the generated idea.'),
  description: z
    .string()
    .describe('A detailed description of the character traits or scene idea.'),
});
export type AiCreativeInspirerOutput = z.infer<typeof AiCreativeInspirerOutputSchema>;

export async function aiCreativeInspirer(input: AiCreativeInspirerInput): Promise<AiCreativeInspirerOutput> {
  return aiCreativeInspirerFlow(input);
}

const aiCreativeInspirerPrompt = ai.definePrompt({
  name: 'aiCreativeInspirerPrompt',
  input: {schema: AiCreativeInspirerInputSchema},
  output: {schema: AiCreativeInspirerOutputSchema},
  prompt: `You are a creative assistant specialized in generating ideas for animators.
Based on the provided keywords, generate either a character concept or a scene idea.
Make sure the output is concise, inspiring, and fits the given type.

Keywords: {{{keywords}}}

When generating, think about:
- If it's a character: What are their key traits, appearance, and a hint of their personality or backstory?
- If it's a scene: What is the setting, mood, main elements, and potential action?

Choose between "character" and "scene" randomly, unless the keywords strongly suggest one over the other.
Provide a catchy title for the idea.`,
});

const aiCreativeInspirerFlow = ai.defineFlow(
  {
    name: 'aiCreativeInspirerFlow',
    inputSchema: AiCreativeInspirerInputSchema,
    outputSchema: AiCreativeInspirerOutputSchema,
  },
  async (input) => {
    const {output} = await aiCreativeInspirerPrompt(input);
    return output!;
  }
);
