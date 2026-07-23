import * as core from '@actions/core';
import * as github from '@actions/github';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

async function run(): Promise<void> {
  try {
    const token = core.getInput('GITHUB_TOKEN', { required: true });
    const geminiApiKey = core.getInput('GEMINI_API_KEY', { required: true });
    const firebaseApiKey = core.getInput('FIREBASE_API_KEY', { required: false });
    
    let preferredModel = 'gemini-2.5-flash';

    const octokit = github.getOctokit(token);
    const { context } = github;

    if (!context.payload.issue && !context.payload.pull_request) {
      core.info('No issue or PR found in the event payload. Exiting.');
      return;
    }

    const issueNumber = context.payload.issue?.number || context.payload.pull_request?.number;

    if (!issueNumber) {
      core.info('Could not determine issue or PR number.');
      return;
    }

    core.info(`Processing issue/PR #${issueNumber}`);

    // If Firebase API Key is provided, try to fetch repo configuration
    if (firebaseApiKey) {
      try {
        const app = initializeApp({
          apiKey: firebaseApiKey,
          projectId: 'ai-studio-57e69f5d-ffc5-4ae9-b2af-1be394c0ad7e', // Should probably be dynamic but hardcoding for now based on context
          // Include other config if necessary
        });
        const db = getFirestore(app);
        const repoFullName = `${context.repo.owner}/${context.repo.repo}`;
        const repoDoc = await getDoc(doc(db, 'repositories', repoFullName));
        
        if (repoDoc.exists()) {
          const data = repoDoc.data();
          if (data.model) {
            preferredModel = data.model;
            core.info(`Loaded preferred model ${preferredModel} from Firebase.`);
          }
        }
      } catch (e) {
        core.info('Could not fetch configuration from Firebase, using defaults.');
      }
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const chat = ai.chats.create({
      model: preferredModel,
      config: {
        systemInstruction: 'You are an autonomous GitHub Copilot. Review code, answer questions, and solve issues politely and concisely.',
      }
    });

    let prompt = `Review the following event on ${context.repo.owner}/${context.repo.repo} issue #${issueNumber}.\n`;
    if (context.payload.issue) {
      prompt += `Title: ${context.payload.issue.title}\nBody: ${context.payload.issue.body || 'No body provided.'}`;
    } else if (context.payload.pull_request) {
      prompt += `Title: ${context.payload.pull_request.title}\nBody: ${context.payload.pull_request.body || 'No body provided.'}`;
    }

    if (context.payload.comment) {
      prompt += `\nNew Comment: ${context.payload.comment.body}`;
    }

    core.info('Generating response with Gemini...');
    const response = await chat.sendMessage({ message: prompt });

    core.info('Posting comment to GitHub...');
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: issueNumber,
      body: `🤖 **Gemini Agent:**\n\n${response.text}`
    });

    core.info('Successfully handled the event.');
  } catch (error) {
    if (error instanceof Error) core.setFailed(`Action failed with error: ${error.message}`);
    else core.setFailed('Action failed with unknown error');
  }
}

run();
