/**
 * AI verification for bounty submissions
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export interface VerificationResult {
  approved: boolean;
  confidence: number;
  reason: string;
  feedback: string;
}

export async function verifySubmission(
  bountyTitle: string,
  bountyDescription: string,
  requirements: string,
  submission: string
): Promise<VerificationResult> {
  const prompt = `You are an AI judge verifying if work submission meets bounty requirements.

BOUNTY: ${bountyTitle}
DESCRIPTION: ${bountyDescription}
REQUIREMENTS: ${requirements}

SUBMISSION:
${submission}

Evaluate if this submission satisfies the bounty requirements. Be fair but strict.

Respond in JSON format:
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation of decision",
  "feedback": "constructive feedback for the submitter"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      approved: false,
      confidence: 0,
      reason: 'Could not parse AI response',
      feedback: 'Please try submitting again.',
    };
  } catch (error) {
    console.error('AI verification error:', error);
    return {
      approved: false,
      confidence: 0,
      reason: 'AI verification failed',
      feedback: 'System error. Please try again later.',
    };
  }
}
