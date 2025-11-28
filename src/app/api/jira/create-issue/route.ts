import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Create JIRA Issue
 * POST /api/jira/create-issue
 *
 * Creates a JIRA story with test case data
 * This proxies the request server-side to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, apiToken, payload } = body;

    // Validate input
    if (!url || !username || !apiToken || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: url, username, apiToken, payload' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authString = `${username}:${apiToken}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // Clean up URL (remove double slashes if any)
    const cleanUrl = url.replace(/\/+$/, '');

    // Call JIRA API to create issue
    const response = await fetch(`${cleanUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('JIRA API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        sentPayload: payload,
      });
      return NextResponse.json(
        {
          error: errorData.errorMessages?.[0] || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
          sentPayload: payload,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      key: data.key,
      id: data.id,
      self: data.self,
    });
  } catch (error) {
    console.error('JIRA create issue error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create JIRA issue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
