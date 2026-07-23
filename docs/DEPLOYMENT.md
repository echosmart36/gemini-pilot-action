# Deployment Guide

This application consists of two parts:
1. **The Web Dashboard**: A web interface for users to connect their GitHub, view repositories, and configure which Gemini AI model each repository should use.
2. **The GitHub Action**: The Node.js script that runs directly in the user's repository via GitHub Actions.

## 1. Deploying the Web Dashboard to GitHub Pages

The web dashboard is built using React and Vite. We have set up a GitHub Actions workflow to automatically deploy the frontend to GitHub Pages using the custom domain `gemini.echosmart.me`.

### Custom Domain & CNAME
We have placed a `CNAME` file in the `public/` directory containing the domain `gemini.echosmart.me`. 
To ensure this works:
1. Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare).
2. Create a CNAME record pointing `gemini` to `your-github-username.github.io`.
3. In your GitHub repository settings, under **Pages**, ensure the Custom Domain is set to `gemini.echosmart.me`.

> **Note on Backend**: GitHub Pages only hosts static files. The chat assistant requires a Node.js backend. If you want the AI chat to function fully on the hosted page, you must host the backend (e.g. `server.ts`) on a service like Cloud Run, Heroku, or Render, and update the `/api/chat` fetch calls to point to your hosted backend URL.

### GitHub Actions Deployment
Whenever you push to the `main` branch, the `.github/workflows/deploy-pages.yml` workflow will trigger. It builds the static assets and publishes them to GitHub Pages.

## 2. Deploying the GitHub Action

The GitHub action logic resides in `src/action.ts`. When you run `npm run build`, we use `@vercel/ncc` to compile the action into a single file at `dist/index.js`.

To publish the action:
1. Ensure the `action.yml` file is at the root of the repository.
2. Commit the `dist/` directory to the `main` branch.
3. Users can then reference your action in their repositories using `uses: your-username/geminipilot-action@main`.

If you fork or clone this repository to create your own action:
1. Make your changes to `src/action.ts`.
2. Run `npm run build:action` to regenerate `dist/index.js`.
3. Commit both `src/action.ts` and `dist/index.js` and push to your repository.
