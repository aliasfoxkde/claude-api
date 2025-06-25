# 🚨 QUICK FIX: KV Namespace Error

Your deployment is failing because the KV namespace IDs in `wrangler.toml` are still placeholder values.

## ⚡ Immediate Fix (2 minutes)

### Option 1: Automatic Fix (if you have Wrangler CLI)
```bash
./scripts/fix-kv-namespaces.sh
git add wrangler.toml
git commit -m "Fix KV namespace IDs"
git push origin main
```

### Option 2: Manual Fix (Cloudflare Dashboard)

1. **Create KV Namespaces**:
   - Go to https://dash.cloudflare.com
   - Navigate to: Workers & Pages → KV
   - Click "Create namespace"
   - Create: `API_KEYS`
   - Create: `RATE_LIMITS`
   - Copy both namespace IDs

2. **Update wrangler.toml**:
   Replace these lines in `wrangler.toml`:
   ```toml
   # BEFORE (broken):
   id = "your-api-keys-namespace-id"
   id = "your-rate-limits-namespace-id"
   
   # AFTER (working):
   id = "abc123def456"  # Your actual API_KEYS namespace ID
   id = "xyz789uvw012"  # Your actual RATE_LIMITS namespace ID
   ```

3. **Commit and Push**:
   ```bash
   git add wrangler.toml
   git commit -m "Fix KV namespace IDs"
   git push origin main
   ```

## ✅ Verification

After the fix, your deployment should succeed. Test with:

```bash
curl https://claude-api.your-subdomain.workers.dev/health
```

## 🔍 What Was Wrong

The build log showed:
```
✘ [ERROR] KV namespace 'your-api-keys-namespace-id' is not valid. [code: 10042]
```

This happened because:
1. ❌ `wrangler.toml` had placeholder IDs instead of real namespace IDs
2. ❌ Cloudflare couldn't find namespaces with those fake IDs
3. ✅ **Fixed**: Real namespace IDs now point to actual KV stores

## 🎯 Next Steps After Fix

1. **Generate API Key**:
   ```bash
   curl -X POST https://claude-api.your-subdomain.workers.dev/v1/keys \
     -H "Content-Type: application/json" \
     -d '{"name": "Admin Key", "permissions": ["chat", "admin"]}'
   ```

2. **Test Chat API**:
   ```bash
   curl -X POST https://claude-api.your-subdomain.workers.dev/v1/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -d '{"model": "claude-3-5-sonnet", "messages": [{"role": "user", "content": "Hello!"}]}'
   ```

3. **Visit Documentation**: https://your-docs-site.pages.dev

---

**Need help?** Check `scripts/setup-cloudflare-dashboard.md` for detailed instructions.
