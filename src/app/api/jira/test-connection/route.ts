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

    // Debug logging (remove in production)
    console.log('JIRA Test Connection Debug:');
    console.log('- URL:', url);
    console.log('- Username:', username);
    console.log('- API Token length:', apiToken.length);
    console.log('- API Token starts with:', apiToken.substring(0, 10) + '...');

    // Create Basic Auth header
    const authString = `${username}:${apiToken}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // Clean up URL (remove double slashes if any)
    const cleanUrl = url.replace(/\/+$/, '');
    const testUrl = `${cleanUrl}/rest/api/3/myself`;

    console.log('- Calling:', testUrl);

    // Call JIRA API
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    console.log('- Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('JIRA API Error Response:', errorText);

      return NextResponse.json(
        {
          error: 'JIRA authentication failed',
          details: errorText,
          status: response.status,
          hint: response.status === 401
            ? 'Check that you are using your EMAIL address (not username) and the API KEY from line 7 of jira.md'
            : 'Check JIRA URL and credentials'
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
