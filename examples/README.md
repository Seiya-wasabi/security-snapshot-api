# Examples

## check-before-linking.mjs

An agent-side gate: snapshot a URL, then decide `proceed` / `caution` / `block`
before linking to it, recommending it, or sending data to it.

```bash
npm install security-snapshot-api viem
node examples/check-before-linking.mjs --demo                      # free canned result
PRIVATE_KEY=0x... node examples/check-before-linking.mjs https://example.com   # 0.05 USDC on Base
```

The decision rules in the file are an example policy; the API itself only reports
what it observed. The payment is verified before the URL is checked, but invalid,
private or unreachable targets get a 400 that is not settled, so they are not charged.

## Claude Desktop (MCP)

```json
{
  "mcpServers": {
    "security-snapshot": {
      "command": "npx",
      "args": ["-y", "mcp-server-security-snapshot"],
      "env": { "WALLET_PRIVATE_KEY": "0xYOUR_PRIVATE_KEY" }
    }
  }
}
```

Then ask: "Before you link to https://example.com, check its security headers."
Use a dedicated wallet holding only a small amount of USDC on Base.
