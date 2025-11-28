import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: Attach File to JIRA Issue
 * POST /api/jira/attach-file
 *
 * Attaches a file to an existing JIRA issue
 */
export async function POST(request: NextRequest) {
  try {
    // Get credentials from headers
    const url = request.headers.get('X-Jira-Url');
    const username = request.headers.get('X-Jira-Username');
    const apiToken = request.headers.get('X-Jira-Token');
    const issueKey = request.headers.get('X-Issue-Key');

    if (!url || !username || !apiToken || !issueKey) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Create Basic Auth header
    const authString = `${username}:${apiToken}`;
    const encodedAuth = Buffer.from(authString).toString('base64');

    // Clean up URL
    const cleanUrl = url.replace(/\/+$/, '');

    // Prepare file for upload
    const fileBuffer = await file.arrayBuffer();
    const blob = new Blob([fileBuffer]);

    // Create form data for JIRA API
    const jiraFormData = new FormData();
    jiraFormData.append('file', blob, file.name);

    // Upload to JIRA
    const response = await fetch(`${cleanUrl}/rest/api/3/issue/${issueKey}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'X-Atlassian-Token': 'no-check', // Required by JIRA API
      },
      body: jiraFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('JIRA Attachment Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData,
      });
      return NextResponse.json(
        {
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      attachments: data,
    });
  } catch (error) {
    console.error('JIRA attach file error:', error);
    return NextResponse.json(
      {
        error: 'Failed to attach file to JIRA issue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
