import { NextRequest, NextResponse } from 'next/server';
import { enhanceJiraCopy } from '@/ai/flows/enhance-jira-copy';

/**
 * API Route: Enhance JIRA Copy
 * POST /api/jira/enhance-copy
 *
 * Calls the LLM to generate a concise tagline and richer BDD phrasing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requirement, testCaseDescription, target } = body;

    if (!requirement || typeof requirement !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Requirement text is required.' },
        { status: 400 }
      );
    }

    const result = await enhanceJiraCopy({
      requirement,
      testCaseDescription: typeof testCaseDescription === 'string' ? testCaseDescription : undefined,
      target: target === 'requirement' ? 'requirement' : 'testcase',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('JIRA enhance copy error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enhance JIRA copy',
      },
      { status: 500 }
    );
  }
}
