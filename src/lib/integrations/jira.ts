/**
 * JIRA Integration Service
 * Handles creating and managing JIRA stories from test cases
 */

export interface JiraConfig {
  url: string;
  username: string;
  apiToken: string;
  projectKey?: string;
}

export interface TestCase {
  description: string;
  compliance: string[];
}

export interface RequirementTestCase {
  requirement: string;
  testCases: TestCase[];
}

export interface JiraSubtaskResponse {
  success: boolean;
  key?: string;
  error?: string;
}

export interface JiraStoryResponse {
  success: boolean;
  key?: string;
  error?: string;
}

/**
 * Creates a JIRA task with test cases as subtasks
 */
export async function createJiraStory(
  config: JiraConfig,
  requirement: RequirementTestCase,
  fileName: string,
  requirementIndex: number,
  file?: File
): Promise<JiraStoryResponse> {
  try {
    // Get project key from config or try to extract from URL
    const projectKey = config.projectKey || extractProjectKey(config.url);

    if (!projectKey) {
      return {
        success: false,
        error: 'Project key is required. Please configure it in the Integrations page.',
      };
    }

    // Extract requirement ID (e.g., REQ-INT-001) from the requirement text
    const reqIdMatch = requirement.requirement.match(/REQ-[A-Z]+-\d+/);
    const requirementId = reqIdMatch ? reqIdMatch[0] : `REQ-${requirementIndex + 1}`;

    // Extract brief summary from requirement text
    // Remove REQ-ID, priority labels like (Critical), and clean up
    let requirementText = requirement.requirement;
    requirementText = requirementText.replace(/REQ-[A-Z]+-\d+/g, ''); // Remove REQ IDs
    requirementText = requirementText.replace(/\([^)]*\)/g, ''); // Remove (Critical), (High), etc.
    requirementText = requirementText.replace(/^[:\s]+/, ''); // Remove leading colons and spaces
    const briefSummary = extractBriefSummary(requirementText);
    const summary = `${requirementId}: ${briefSummary}`;

    // Format the parent task description with requirement details
    const description = formatParentTaskDescription(requirement);

    // Create the parent task payload
    const payload = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: summary,
        description: description,
        issuetype: {
          name: 'Task',
        },
        labels: ['healthtestai', 'automated-requirement'],
      },
    };

    // Create parent task
    const response = await fetch('/api/jira/create-issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.url,
        username: config.username,
        apiToken: config.apiToken,
        payload: payload,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('JIRA API Error:', JSON.stringify(data, null, 2));
      console.error('Error details:', data.details);
      console.error('Sent payload:', data.sentPayload);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const parentKey = data.key;
    console.log(`Created parent task: ${parentKey}`);

    // Create subtasks for each test case
    const subtaskResults = await createSubtasksForTestCases(
      config,
      requirement.testCases,
      parentKey,
      projectKey
    );

    // Check if any subtasks failed
    const failedSubtasks = subtaskResults.filter(r => !r.success);
    if (failedSubtasks.length > 0) {
      console.warn(`${failedSubtasks.length} subtasks failed to create`);
    }

    // Attach file if provided (disabled - causing 500 errors)
    // if (file) {
    //   await attachFileToIssue(config, parentKey, file);
    // }

    return {
      success: true,
      key: parentKey,
    };
  } catch (error) {
    console.error('Error creating JIRA story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extracts a brief summary from requirement text (first sentence or up to 80 chars)
 */
function extractBriefSummary(text: string): string {
  // Remove any leading/trailing whitespace
  text = text.trim();

  // Try to get first sentence
  const firstSentence = text.split(/[.!?]\s/)[0];

  // If first sentence is reasonable length, use it
  if (firstSentence.length <= 80) {
    return firstSentence;
  }

  // Otherwise, truncate to 80 chars and add ellipsis
  return text.substring(0, 77) + '...';
}

/**
 * Formats the parent task description (requirement only, no test cases)
 */
function formatParentTaskDescription(requirement: RequirementTestCase): any {
  const content: any[] = [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Requirement' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: requirement.requirement }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: `Total Test Cases: ${requirement.testCases.length}`, marks: [{ type: 'strong' }] },
      ],
    },
    {
      type: 'rule',
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Generated by HealthTestAI', marks: [{ type: 'em' }] }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'For any queries reach to the quality assurance team.', marks: [{ type: 'em' }] }],
    },
  ];

  return {
    version: 1,
    type: 'doc',
    content: content,
  };
}

/**
 * Converts a test case description to BDD (Given-When-Then) format
 */
function convertToBDDFormat(description: string): { given: string; when: string; then: string } {
  // Try to intelligently split the description into Given-When-Then
  // This is a simple heuristic - the description might already have some structure

  const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Look for existing Given/When/Then keywords
  const givenMatch = lines.find(l => l.toLowerCase().startsWith('given'));
  const whenMatch = lines.find(l => l.toLowerCase().startsWith('when'));
  const thenMatch = lines.find(l => l.toLowerCase().startsWith('then'));

  if (givenMatch && whenMatch && thenMatch) {
    // Already in BDD format
    return {
      given: givenMatch.replace(/^given:?\s*/i, ''),
      when: whenMatch.replace(/^when:?\s*/i, ''),
      then: thenMatch.replace(/^then:?\s*/i, ''),
    };
  }

  // Try to infer from description structure
  // Look for action verbs to split into when/then
  const actionWords = ['verify', 'check', 'ensure', 'validate', 'test', 'confirm'];
  const whenIndex = lines.findIndex(l =>
    actionWords.some(word => l.toLowerCase().includes(word))
  );

  if (whenIndex > 0) {
    return {
      given: lines.slice(0, whenIndex).join(' '),
      when: lines[whenIndex],
      then: lines.slice(whenIndex + 1).join(' ') || 'The expected outcome is verified',
    };
  }

  // Fallback: use first line as given, rest as when/then
  return {
    given: lines[0] || 'The system is in a ready state',
    when: lines.slice(1).join(' ') || 'The test action is performed',
    then: 'The expected outcome matches the requirement',
  };
}

/**
 * Formats a test case in BDD format using ADF
 */
function formatBDDTestCase(testCase: TestCase, index: number): any {
  const bdd = convertToBDDFormat(testCase.description);

  const content: any[] = [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Given: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: bdd.given },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'When: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: bdd.when },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Then: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: bdd.then },
      ],
    },
  ];

  // Add compliance standards if present
  if (testCase.compliance && testCase.compliance.length > 0) {
    content.push({
      type: 'rule',
    });
    content.push({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Compliance Standards: ', marks: [{ type: 'strong' }] },
        { type: 'text', text: testCase.compliance.join(', ') },
      ],
    });
  }

  content.push({
    type: 'rule',
  });
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: 'Generated by HealthTestAI', marks: [{ type: 'em' }] }],
  });
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: 'For any queries reach to the quality assurance team.', marks: [{ type: 'em' }] }],
  });

  return {
    version: 1,
    type: 'doc',
    content: content,
  };
}

/**
 * Creates a "relates to" link between two JIRA issues
 */
async function createIssueLink(
  config: JiraConfig,
  subtaskKey: string,
  parentKey: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/jira/link-issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.url,
        username: config.username,
        apiToken: config.apiToken,
        linkType: 'Relates',
        inwardIssue: subtaskKey,
        outwardIssue: parentKey,
      }),
    });

    if (!response.ok) {
      console.error(`Failed to link ${subtaskKey} to ${parentKey}`);
      return false;
    }

    console.log(`Linked ${subtaskKey} -> ${parentKey} (relates to)`);
    return true;
  } catch (error) {
    console.error('Error linking issues:', error);
    return false;
  }
}

/**
 * Creates subtasks for each test case
 */
async function createSubtasksForTestCases(
  config: JiraConfig,
  testCases: TestCase[],
  parentKey: string,
  projectKey: string
): Promise<JiraSubtaskResponse[]> {
  const results: JiraSubtaskResponse[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const summary = `TC-${i + 1}: ${extractBriefSummary(testCase.description)}`;
    const description = formatBDDTestCase(testCase, i);

    const payload = {
      fields: {
        project: {
          key: projectKey,
        },
        parent: {
          key: parentKey,
        },
        summary: summary,
        description: description,
        issuetype: {
          name: 'Sub-task',
        },
        labels: ['healthtestai', 'test-case'],
      },
    };

    try {
      const response = await fetch('/api/jira/create-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: config.url,
          username: config.username,
          apiToken: config.apiToken,
          payload: payload,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error(`Failed to create subtask ${i + 1}:`, data.error);
        results.push({
          success: false,
          error: data.error || `HTTP ${response.status}`,
        });
      } else {
        console.log(`Created subtask: ${data.key}`);

        // Create "relates to" link for traceability
        await createIssueLink(config, data.key, parentKey);

        results.push({
          success: true,
          key: data.key,
        });
      }

      // Small delay to avoid rate limiting
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`Error creating subtask ${i + 1}:`, error);
      results.push({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Attaches a file to a JIRA issue
 */
async function attachFileToIssue(
  config: JiraConfig,
  issueKey: string,
  file: File
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/jira/attach-file', {
      method: 'POST',
      headers: {
        'X-Jira-Url': config.url,
        'X-Jira-Username': config.username,
        'X-Jira-Token': config.apiToken,
        'X-Issue-Key': issueKey,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to attach file:', await response.text());
      return false;
    }

    console.log(`Attached file to ${issueKey}`);
    return true;
  } catch (error) {
    console.error('Error attaching file:', error);
    return false;
  }
}

/**
 * Formats the test cases into JIRA ADF (Atlassian Document Format)
 * @deprecated Use formatParentTaskDescription and formatBDDTestCase instead
 */
function formatJiraDescription(requirement: RequirementTestCase): any {
  const content: any[] = [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Requirement' }],
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: requirement.requirement }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: `Test Cases (${requirement.testCases.length})` }],
    },
  ];

  requirement.testCases.forEach((tc, index) => {
    // Test case heading
    content.push({
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: `Test Case ${index + 1}` }],
    });

    // Test case description
    content.push({
      type: 'paragraph',
      content: [{ type: 'text', text: tc.description }],
    });

    // Compliance standards
    if (tc.compliance && tc.compliance.length > 0) {
      content.push({
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Compliance Standards: ', marks: [{ type: 'strong' }] },
          { type: 'text', text: tc.compliance.join(', ') },
        ],
      });
    }

    // Separator
    content.push({
      type: 'rule',
    });
  });

  // Footer
  content.push({
    type: 'paragraph',
    content: [{ type: 'text', text: 'Generated by HealthTestAI', marks: [{ type: 'em' }] }],
  });

  return {
    version: 1,
    type: 'doc',
    content: content,
  };
}

/**
 * Attempts to extract project key from JIRA URL or project name
 */
function extractProjectKey(url: string): string | null {
  try {
    // Try to extract from URL path like /browse/PROJ-123
    const match = url.match(/\/browse\/([A-Z]+)-/);
    if (match) {
      return match[1];
    }

    // Default to null, will need to be configured
    return null;
  } catch {
    return null;
  }
}

/**
 * Validates JIRA configuration
 */
export function validateJiraConfig(config: JiraConfig): boolean {
  return !!(
    config.url &&
    config.username &&
    config.apiToken &&
    config.url.includes('atlassian.net') &&
    (config.projectKey || extractProjectKey(config.url))
  );
}

/**
 * Exports all test cases to JIRA as separate stories with subtasks
 */
export async function exportAllToJira(
  config: JiraConfig,
  requirements: RequirementTestCase[],
  fileName: string,
  onProgress?: (current: number, total: number, key?: string) => void,
  file?: File
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < requirements.length; i++) {
    const requirement = requirements[i];
    // Only attach file to the first requirement to avoid duplicates
    const result = await createJiraStory(config, requirement, fileName, i, i === 0 ? file : undefined);

    if (result.success) {
      results.success++;
      onProgress?.(i + 1, requirements.length, result.key);
    } else {
      results.failed++;
      results.errors.push(`Requirement #${i + 1}: ${result.error}`);
      onProgress?.(i + 1, requirements.length);
    }

    // Add a small delay to avoid rate limiting
    if (i < requirements.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
