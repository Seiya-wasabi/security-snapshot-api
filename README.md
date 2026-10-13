# security-snapshot-api

TypeScript client for [Website Security Snapshot API](https://api.cybersecurity-japan.com).

**Pay per call. No account. No API key.**

Payment is settled automatically on-chain via the [x402 protocol](https://github.com/coinbase/x402) (v2) — 0.05 USDC on Base mainnet. You need a wallet holding USDC on Base.

> **v2.0.0 (2026-10-13):** the API moved to x402 v2 on 2026-10-04. v1.x of this package used the v1 client (`x402-fetch`) and can no longer pay. Upgrade to 2.x and pass a viem account instead of a `createSigner()` result.

## Install

```bash
npm install security-snapshot-api viem
```

## Quick Start

```typescript
import { SnapshotClient } from "security-snapshot-api";
import { privateKeyToAccount } from "viem/accounts";

// Your wallet private key (keep this secret!) — the wallet needs USDC on Base
const client = new SnapshotClient(privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`));

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
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// Any account works: demo() never pays
const client = new SnapshotClient(privateKeyToAccount(generatePrivateKey()));
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
  // Payment problems (e.g. no USDC on Base) throw an Error starting with
  // "Payment not accepted:" followed by the facilitator's reason.
}
```

Error responses (4xx/5xx) are not settled: you only pay for successful results.

## Testnet

There is no testnet endpoint. Use `client.demo()` (free, canned result) to test your integration.

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
