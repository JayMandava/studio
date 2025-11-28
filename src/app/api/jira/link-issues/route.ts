import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Link JIRA Issues
 * POST /api/jira/link-issues
 *
 * Creates a link between two JIRA issues (e.g., "relates to")
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, apiToken, linkType, inwardIssue, outwardIssue } = body;

    // Validate input
    if (!url || !username || !apiToken || !linkType || !inwardIssue || !outwardIssue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authString = `${username}:${apiToken}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // Clean up URL
    const cleanUrl = url.replace(/\/+$/, '');

    // Create the link payload
    const payload = {
      type: {
        name: linkType, // e.g., "Relates"
      },
      inwardIssue: {
        key: inwardIssue,
      },
      outwardIssue: {
        key: outwardIssue,
      },
    };

    // Call JIRA API to create link
    const response = await fetch(`${cleanUrl}/rest/api/3/issueLink`, {
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
      console.error('JIRA Link Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
        payload: payload,
      });
      return NextResponse.json(
        {
          error: errorData.errorMessages?.[0] || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    // Link creation returns 201 with no body
    return NextResponse.json({
      success: true,
      message: `Linked ${inwardIssue} to ${outwardIssue} with type "${linkType}"`,
    });
  } catch (error) {
    console.error('JIRA link issues error:', error);
    return NextResponse.json(
      {
        error: 'Failed to link JIRA issues',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
