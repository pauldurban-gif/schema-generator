# Schema Markup Generator - Deployment Instructions

## Step-by-Step Deployment to Vercel (FREE)

### Prerequisites
- A GitHub account (free)
- An Anthropic API key (get one at console.anthropic.com)

---

## STEP 1: Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign in or create an account
3. Click "API Keys" in the left sidebar
4. Click "Create Key"
5. Give it a name like "Schema Generator"
6. Copy the key (starts with "sk-ant-...")
7. **SAVE THIS KEY** - you'll need it in Step 4

---

## STEP 2: Upload Code to GitHub

### Option A: Using GitHub Website (Easiest)

1. Go to https://github.com
2. Sign in (or create account)
3. Click the "+" in top right → "New repository"
4. Name it "schema-generator"
5. Click "Create repository"
6. On the next page, click "uploading an existing file"
7. Drag ALL these files into the upload box:
   - package.json
   - vercel.json
   - index.html
   - api/generate.js (keep the api folder!)
   - api/update.js
8. Click "Commit changes"

### Option B: Using GitHub Desktop (If you prefer apps)

1. Download GitHub Desktop from https://desktop.github.com
2. Install and sign in
3. File → New Repository
4. Name it "schema-generator"
5. Create Repository
6. Copy all the project files into the repository folder
7. Commit and Push to GitHub

---

## STEP 3: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel to access GitHub
4. Click "Add New..." → "Project"
5. Find your "schema-generator" repository
6. Click "Import"
7. **DON'T CLICK DEPLOY YET!**

---

## STEP 4: Add Your API Key (CRITICAL!)

Before deploying, you need to add your Anthropic API key:

1. On the deployment settings page, scroll to "Environment Variables"
2. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Paste your API key from Step 1 (starts with "sk-ant-...")
3. Click "Add"
4. NOW click "Deploy"

---

## STEP 5: Wait for Deployment

- Vercel will build and deploy your app (takes 1-2 minutes)
- You'll see a "Congratulations" screen when done
- You'll get a URL like: `schema-generator.vercel.app`

---

## STEP 6: Test Your App

1. Click "Visit" or go to your Vercel URL
2. Enter a website (like "liedcenter.org")
3. Click "Generate Schema Markup"
4. It should analyze the site and show results!

---

## Troubleshooting

### "API Key not found" error
- Go to Vercel dashboard → Your project → Settings → Environment Variables
- Make sure `ANTHROPIC_API_KEY` is set
- If not, add it and redeploy (Deployments tab → click "..." → Redeploy)

### "Module not found" error
- Make sure package.json was uploaded correctly
- Go to Vercel dashboard → Deployments → click "..." → Redeploy

### Site shows blank page
- Check browser console for errors (F12)
- Make sure all files (especially public/index.html) were uploaded

---

## Customization

### Change the Domain
1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add a custom domain (like schema.filament.com)

### Update the Code
1. Make changes to files in GitHub
2. Commit the changes
3. Vercel automatically redeploys!

---

## Cost

- **Vercel**: FREE for personal/commercial use
- **Anthropic API**: Pay per use
  - ~$0.003 per schema generation
  - 100 schemas = ~$0.30
  - Very affordable!

---

## Support

If something doesn't work:
1. Check the Troubleshooting section above
2. Check Vercel's deployment logs (Dashboard → Deployments → click deployment → View Function Logs)
3. Make sure your API key is correct

---

## What You Get

✅ Working Schema Generator at your own URL
✅ Automatically analyzes websites
✅ Shows before/after previews
✅ Lets users select improvements
✅ Updates schema with real data from the site
✅ Download JSON or TXT
✅ Professional design
✅ Mobile-friendly

Enjoy your Schema Generator!
