import { Octokit } from '@octokit/rest';
import { Type } from '@google/genai';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiAgent } from '../gemini-agent-sdk';


// Load environment variables injected by GitHub Actions
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY; // "owner/repo"
const GITHUB_WORKSPACE = process.env.GITHUB_WORKSPACE || process.cwd();

if (!GITHUB_TOKEN || !GITHUB_EVENT_PATH || !GITHUB_REPOSITORY) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const [owner, repo] = GITHUB_REPOSITORY.split('/');
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Initialize our Custom Gemini Agent SDK
const agent = new GeminiAgent({
  model: 'gemini-2.5-pro',
  systemInstruction: `You are GeminiPilot, an elite autonomous software engineer agent. 
You are integrated directly into a GitHub repository. 
Your goal is to complete requested tasks, fix issues, and review code.
Use the provided tools to read the file system, execute bash commands, and make changes.
Always explain your reasoning and what you found before executing fixes.`,
  tools: [
    {
      declaration: {
        name: 'execute_bash',
        description: 'Execute a bash command in the repository workspace. Use this to run git commands, tests, or build scripts.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            command: { type: Type.STRING, description: 'The bash command to run' }
          },
          required: ['command']
        }
      },
      handler: async ({ command }) => {
        try {
          console.log(`$ ${command}`);
          const output = execSync(command, { cwd: GITHUB_WORKSPACE, encoding: 'utf-8' });
          return output || 'Command executed successfully with no output.';
        } catch (error: any) {
          return `Error executing command: ${error.message}\nOutput: ${error.stdout?.toString()}`;
        }
      }
    },
    {
      declaration: {
        name: 'read_file',
        description: 'Read the contents of a file in the repository.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filepath: { type: Type.STRING, description: 'Relative path to the file' }
          },
          required: ['filepath']
        }
      },
      handler: async ({ filepath }) => {
        const fullPath = path.join(GITHUB_WORKSPACE, filepath);
        return fs.readFileSync(fullPath, 'utf-8');
      }
    },
    {
      declaration: {
        name: 'write_file',
        description: 'Write content to a file in the repository (overwrites entirely).',
        parameters: {
          type: Type.OBJECT,
          properties: {
            filepath: { type: Type.STRING, description: 'Relative path to the file' },
            content: { type: Type.STRING, description: 'The new content to write' }
          },
          required: ['filepath', 'content']
        }
      },
      handler: async ({ filepath, content }) => {
        const fullPath = path.join(GITHUB_WORKSPACE, filepath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content, 'utf-8');
        return `Successfully wrote to ${filepath}`;
      }
    }
  ]
});

async function run() {
  const eventPayload = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH!, 'utf8'));

  // Handle Issues
  if (eventPayload.issue && !eventPayload.pull_request) {
    if (eventPayload.action === 'opened' || (eventPayload.action === 'created' && eventPayload.comment)) {
      await handleIssueOrComment(eventPayload);
    }
  }

  // Handle PRs (Code Review)
  if (eventPayload.pull_request && eventPayload.action === 'opened') {
    await handlePullRequest(eventPayload);
  }
}

async function handleIssueOrComment(payload: any) {
  const issueNumber = payload.issue.number;
  const body = payload.comment ? payload.comment.body : payload.issue.body;
  const author = payload.comment ? payload.comment.user.login : payload.issue.user.login;
  
  console.log(`Reacting to issue #${issueNumber}`);
  const reactionId = payload.comment ? payload.comment.id : payload.issue.id;

  console.log(`Setting status to 'in progress'`);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: ['in-progress']
  });

  const prompt = `A user named @${author} created an issue or comment: "${body}".
Please analyze the repository, use your tools to make the necessary code changes, and then execute git commands to create a new branch, commit the changes, and push them to origin.
The branch name should be: gemini-fix-issue-${issueNumber}
After pushing, explain what you did.`;

  console.log(`Executing Agent Loop...`);
  
  // Configure git identity before agent runs
  execSync(`git config user.name "GeminiPilot Agent"`, { cwd: GITHUB_WORKSPACE });
  execSync(`git config user.email "agent@geminipilot.ai"`, { cwd: GITHUB_WORKSPACE });

  const result = await agent.runTask(prompt);
  console.log("Agent Task Completed. Result:", result);

  // Check if branch was pushed (agent might have done it via bash, if so, we create the PR)
  try {
    const branchName = `gemini-fix-issue-${issueNumber}`;
    
    // Create PR
    const pr = await octokit.pulls.create({
      owner,
      repo,
      title: `Fix issue #${issueNumber}`,
      head: branchName,
      base: 'main',
      body: `This PR resolves #${issueNumber}.\n\n### Agent Summary\n${result}`
    });

    // Update Issue
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `@${author} The changes have been implemented in #${pr.data.number}.`
    });
  } catch (e) {
    console.log("No PR created, or branch doesn't exist on origin. Agent might have failed or found no changes to commit.");
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: `@${author} I attempted to resolve the issue, but no PR was created. Here is my analysis:\n\n${result}`
    });
  }

  await octokit.issues.removeLabel({
    owner,
    repo,
    issue_number: issueNumber,
    name: 'in-progress'
  }).catch(() => {});

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: issueNumber,
    labels: ['completed']
  });
}

async function handlePullRequest(payload: any) {
  const prNumber = payload.pull_request.number;
  console.log(`Starting Code Review for PR #${prNumber}`);

  const { data: diff } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: 'diff' }
  });

  const prompt = `Perform a code review on the following Pull Request diff.
If you find issues, explain them clearly. If the code looks good, praise the author.
Diff:
${diff}`;
  
  const result = await agent.runTask(prompt);

  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `**Gemini AI Code Review:**\n\n${result}`
  });
}

run().catch(console.error);
