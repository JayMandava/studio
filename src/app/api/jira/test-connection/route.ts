import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Test JIRA Connection
 * POST /api/jira/test-connection
 *
 * Tests JIRA credentials by calling the /rest/api/3/myself endpoint
 * This proxies the request server-side to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, apiToken } = body;

    // Validate input
    if (!url || !username || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required fields: url, username, apiToken' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authString = `${username}:${apiToken}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // Clean up URL (remove double slashes if any)
    const cleanUrl = url.replace(/\/+$/, '');

    // Call JIRA API
    const response = await fetch(`${cleanUrl}/rest/api/3/myself`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          error: 'JIRA authentication failed',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      user: {
        displayName: userData.displayName,
        emailAddress: userData.emailAddress,
        accountId: userData.accountId,
      },
    });
  } catch (error) {
    console.error('JIRA test connection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
