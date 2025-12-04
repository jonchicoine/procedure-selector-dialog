/**
 * GitHub API utilities for saving procedure config directly to the repository.
 * This allows demo users to persist configuration changes that will be
 * deployed via Netlify for all users to see.
 */

const REPO_OWNER = 'jonchicoine';
const REPO_NAME = 'procedure-selector-dialog';
const FILE_PATH = 'procedures.json';
const BRANCH = 'main';

interface GitHubFileResponse {
  sha: string;
  content: string;
}

interface GitHubUpdateResponse {
  commit: {
    sha: string;
    html_url: string;
  };
}

/**
 * Get the current file SHA (needed for updates)
 */
async function getFileSha(token: string): Promise<string> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}?ref=${BRANCH}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get file info: ${response.statusText}`);
  }

  const data: GitHubFileResponse = await response.json();
  return data.sha;
}

/**
 * Publish the procedures config to GitHub.
 * This will trigger a Netlify deploy.
 */
export async function publishToGitHub(
  config: object,
  token: string,
  commitMessage?: string
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  try {
    // Get current file SHA
    const sha = await getFileSha(token);

    // Encode content as base64
    const content = JSON.stringify(config, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    // Update the file
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage || `Update procedures config - ${new Date().toLocaleString()}`,
          content: base64Content,
          sha: sha,
          branch: BRANCH,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || response.statusText);
    }

    const data: GitHubUpdateResponse = await response.json();
    return {
      success: true,
      commitUrl: data.commit.html_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Validate a GitHub token by attempting to get repo info
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// Local storage key for the GitHub token
const GITHUB_TOKEN_KEY = 'github-token';

/**
 * Get stored GitHub token
 */
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store GitHub token
 */
export function storeToken(token: string): void {
  try {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
  } catch {
    console.warn('Failed to store token');
  }
}

/**
 * Clear stored GitHub token
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(GITHUB_TOKEN_KEY);
  } catch {
    console.warn('Failed to clear token');
  }
}
