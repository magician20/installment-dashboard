
**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

🚀 Complete GitHub Pages Deployment Guide:

✅ What I've Configured:
Vite Configuration: Updated vite.config.ts to use the correct base path for GitHub Pages
Build Scripts: Added build:gh-pages and preview:gh-pages scripts to package.json
GitHub Actions Workflow: Created .github/workflows/deploy.yml for automated deployment
Local Testing: Verified the build process works correctly

 Step-by-Step Deployment Instructions:
Step 1: Commit and Push Your Changes
```sh
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```
Step 2: Enable GitHub Pages in Repository Settings
- Go to your GitHub repository: https://github.com/magician20/installment-dashboard
- Click on Settings tab
- Scroll down to Pages section in the left sidebar
- Under Source, select GitHub Actions
- Save the settings

Step 3: Monitor the Deployment
- Go to the Actions tab in your repository
- You should see a workflow run called "Deploy to GitHub Pages"
- Click on it to monitor the deployment progress
- The deployment will take 2-5 minutes

Step 4: Access Your Deployed Application
- Once the deployment is complete, your application will be available at:
- (https://magician20.github.io/installment-dashboard/)


Local Testing:
To test your production build locally:
```sh
npm run build:gh-pages
npm run preview:gh-pages
```