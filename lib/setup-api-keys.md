# API Keys Setup Guide

This guide will help you set up all required API keys for the LangSmith prompt testing system.

## Required API Keys

### 1. Gemini API Key (Google)
**Status**: Required for Gemini models in LangSmith prompts

**Setup Steps**:
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the API key (starts with `AIza...`)
5. Add to `.env.local`:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```

**Troubleshooting**:
- If you get a 403 error, the API might not be enabled
- Make sure you're in the correct Google Cloud project
- Check if you have quota/credits available

---

### 2. Mistral API Key
**Status**: Required for Mistral AI models

**Setup Steps**:
1. Visit [Mistral Console](https://console.mistral.ai/)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **"Create new key"**
5. Copy the API key
6. Add to `.env.local`:
   ```bash
   MISTRAL_API_KEY=your_key_here
   ```

---

### 3. Codestral API Key
**Status**: Optional (uses Mistral endpoint)

**Setup Steps**:
1. Codestral is a Mistral product - you can use the same Mistral key
2. **Option A**: Use the same key as Mistral:
   ```bash
   CODESTRAL_API_KEY=<same_as_mistral_key>
   ```
3. **Option B**: Get dedicated Codestral access from Mistral
   - Visit [Mistral Console](https://console.mistral.ai/)
   - Check if you have Codestral access enabled
   - Create a dedicated key if available

**Note**: Codestral now uses the standard Mistral API endpoint (`https://api.mistral.ai/v1/models`)

---

### 4. OpenRouter API Key
**Status**: Required for multi-model access

**Setup Steps**:
1. Visit [OpenRouter](https://openrouter.ai/)
2. Sign in or create an account
3. Go to **API Keys** section
4. Create a new API key
5. Add to `.env.local`:
   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```

**Features**:
- Access to multiple AI models through one API
- Pay-as-you-go pricing
- Some free models available

---

### 5. Groq API Key
**Status**: Required for fast inference with Groq

**Setup Steps**:
1. Visit [Groq Console](https://console.groq.com/keys)
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **"Create API Key"**
5. Copy the key
6. Add to `.env.local`:
   ```bash
   GROQ_API_KEY=your_key_here
   ```

**Benefits**:
- Ultra-fast inference speeds
- Support for Llama, Mixtral, and other models
- Generous free tier

---

## Testing Your Setup

After adding all keys to `.env.local`, test them:

```bash
npm run test:api-keys
```

Or run directly:

```bash
npx tsx lib/test-api-keys.ts
```

Expected output:
```
✅ Success: 5  ❌ Failed: 0  ⏭️  Skipped: 0
```

---

## Common Issues

### Issue: "API key has whitespace"
**Solution**: Ensure there are no spaces, newlines, or quotes around your API key in `.env.local`
```bash
# Wrong
GEMINI_API_KEY=" AIza... "

# Correct
GEMINI_API_KEY=AIza...
```

### Issue: "Authentication failed"
**Solutions**:
1. Regenerate the API key from the provider's console
2. Check if the key is expired
3. Verify you have credits/quota available
4. Ensure the API is enabled in the provider's dashboard

### Issue: "Rate limit exceeded"
**Solutions**:
1. Wait a few minutes and try again
2. Check your provider's rate limits
3. Consider upgrading your plan if needed

---

## Environment File Example

Your `.env.local` should look like this:

```bash
# AI API Keys
GEMINI_API_KEY=AIzaSyD...
MISTRAL_API_KEY=abc123...
CODESTRAL_API_KEY=abc123...  # Can be same as MISTRAL_API_KEY
OPENROUTER_API_KEY=sk-or-v1-...
GROQ_API_KEY=gsk_...

# LangSmith (for prompt testing)
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=vibebaba-prompts
```

---

## Next Steps

Once all API keys are configured:

1. **Test authentication**:
   ```bash
   npm run test:api-keys
   ```

2. **Set up LangSmith datasets**:
   ```bash
   npm run langsmith:setup-dataset setup-all-nodes
   ```

3. **Run prompt experiments**:
   ```bash
   npm run langsmith:test-all
   ```

---

## Support

If you continue to have issues:
1. Check the provider's status page for outages
2. Verify your account has the necessary permissions
3. Consult the provider's documentation
4. Contact the provider's support team
