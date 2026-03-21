# security-snapshot-api

TypeScript client for [Website Security Snapshot API](https://api.cybersecurity-japan.com).

**Pay per call. No account. No API key.**

Payment is settled automatically on-chain via the [x402 protocol](https://github.com/coinbase/x402) — 0.05 USDC on Base.

> **Network status:** Currently on Base Sepolia testnet. Mainnet (Base) goes live **2026-03-28**.
> Use `NETWORK=base-sepolia` for testing before that date; switch to `NETWORK=base` on 2026-03-28.

## Install

```bash
npm install security-snapshot-api x402-fetch viem
```

## Quick Start

```typescript
import { SnapshotClient } from "security-snapshot-api";
import { createSigner } from "x402-fetch";

// Your wallet private key (keep this secret!)
const signer = await createSigner("base", "0xYOUR_PRIVATE_KEY");
const client = new SnapshotClient(signer);

// Scan any public URL — costs 0.05 USDC per call
const result = await client.scan("https://example.com");

console.log(result.hsts_present);               // true
console.log(result.csp_present);                // false
console.log(result.x_frame_options_present);    // true
console.log(result.redirect_count);             // 1
console.log(result.security_txt_present);       // null (not checked)
```

## Try Without Paying

```typescript
const client = new SnapshotClient(signer); // signer not used for demo
const demo = await client.demo();
// Returns pre-baked example response with _demo: true
```

## Full Response Type

```typescript
interface SnapshotResult {
  requested_url: string;
  normalized_url: string;
  final_url: string;
  fetched_at: string;           // ISO 8601
  reachable: boolean;
  final_status_code: number | null;
  redirect_count: number;
  https_ok: boolean;
  hsts_present: boolean;
  csp_present: boolean;
  x_frame_options_present: boolean;
  x_content_type_options_present: boolean;
  referrer_policy_present: boolean;
  permissions_policy_present: boolean;
  security_txt_present: boolean | null;
  robots_txt_present: boolean | null;
  sitemap_xml_present: boolean | null;
  notes: string[];
  checks: Record<string, boolean | null>;
}
```

## Error Handling

```typescript
import { SnapshotClient, SnapshotApiError } from "security-snapshot-api";

try {
  const result = await client.scan("http://192.168.1.1");
} catch (err) {
  if (err instanceof SnapshotApiError) {
    console.log(err.data.error_type); // "ssrf"
    console.log(err.data.error);      // "Private or reserved IP ranges are not allowed."
  }
}
```

## Use with viem WalletClient

```typescript
import { SnapshotClient } from "security-snapshot-api";
import { createWalletClient, http } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount("0xYOUR_PRIVATE_KEY");
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http(),
});

const client = new SnapshotClient(walletClient);
const result = await client.scan("https://example.com");
```

## Testnet (Base Sepolia)

```typescript
import { createSigner } from "x402-fetch";
const signer = await createSigner("base-sepolia", "0xYOUR_TESTNET_KEY");
const client = new SnapshotClient(signer, {
  baseUrl: "https://api.cybersecurity-japan.com", // same endpoint, different network in wallet
});
```

Get free testnet USDC: https://faucet.circle.com

## Pricing

| | |
|--|--|
| Per call | 0.05 USDC |
| Network | Base (mainnet) |
| Asset | USDC |
| Account required | No |

## Links

- [API docs](https://api.cybersecurity-japan.com/docs)
- [OpenAPI spec](https://api.cybersecurity-japan.com/openapi.json)
- [Quickstart guide](https://api.cybersecurity-japan.com/quickstart)
- [Pricing](https://api.cybersecurity-japan.com/pricing)

## License

MIT
