# R2 Quick Upload 📤

A serverless, secure file upload utility built on Cloudflare Workers and R2 storage. It provides an Nginx-style Basic Authentication layer and a lightweight web UI to quickly upload and retrieve files.

## Features

- **Zero Infrastructure:** Runs entirely on Cloudflare's edge network.
- **Secure:** Protected by Basic Authentication.
- **Web UI:** Drag-and-drop or select files from a clean HTML interface.
- **CLI Friendly:** Can be used fully via `curl` without the browser.

## Deployment Instructions

### 1. Setup the Environment

Ensure you have Node.js installed, then install the dependencies:
\`\`\`bash
npm install
\`\`\`

### 2. Create the R2 Bucket

If you haven't already, create your storage bucket (or do it via the Cloudflare Dashboard):
\`\`\`bash
npx wrangler r2 bucket create quick-uploads
\`\`\`
_Important: Set a Lifecycle Rule in the Cloudflare UI to auto-delete files to stay within the free tier limits._

### 3. Set the Secret Password

Your worker needs the `AUTH_KEY` secret to function. Run this command and type your desired password when prompted:
\`\`\`bash
npx wrangler secret put AUTH_KEY
\`\`\`

### 4. Deploy

Publish the code to Cloudflare's global network:
\`\`\`bash
npm run deploy
\`\`\`

## Usage

**Via Browser:**
Navigate to your worker URL.

- Username: `admin`
- Password: `<YOUR_AUTH_KEY>`

**Via Terminal (cURL):**
\`\`\`bash
curl -X PUT https://your-worker-url.workers.dev/my-file.zip \
 -u admin:<YOUR_AUTH_KEY> \
 --data-binary "@my-local-file.zip"
\`\`\`
