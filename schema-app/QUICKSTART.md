# QUICK START - Schema Generator

## You have 6 files:
1. package.json - Dependencies
2. vercel.json - Vercel config
3. api/generate.js - Backend for initial generation
4. api/update.js - Backend for updates
5. public/index.html - Frontend interface
6. DEPLOYMENT.md - Full instructions

## THE 5-MINUTE DEPLOYMENT:

### 1. Get Anthropic API Key
- Go to https://console.anthropic.com
- Create a key
- Copy it (starts with "sk-ant-...")

### 2. Upload to GitHub
- Go to https://github.com
- New Repository → "schema-generator"
- Upload all 6 files (keep folder structure!)
- Commit

### 3. Deploy on Vercel
- Go to https://vercel.com
- Sign up with GitHub
- Import your "schema-generator" repo
- **BEFORE DEPLOYING:** Add Environment Variable:
  - Name: `ANTHROPIC_API_KEY`
  - Value: Your API key
- Click Deploy

### 4. Done!
- You'll get a URL like schema-generator.vercel.app
- Test it by entering any website URL
- Share it with nonprofit clients!

## If You Get Stuck:
Read DEPLOYMENT.md for detailed step-by-step instructions with screenshots-level detail.

## Cost:
- Vercel: FREE
- Anthropic: ~$0.003 per generation (100 schemas = $0.30)

That's it!
