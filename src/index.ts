/**
 * security-snapshot-api
 * TypeScript client for the Website Security Snapshot API.
 * Pays 0.05 USDC on Base per call with the x402 v2 client (@x402/fetch).
 *
 * @example
 * ```typescript
 * import { SnapshotClient } from "security-snapshot-api";
 * import { privateKeyToAccount } from "viem/accounts";
 *
 * const client = new SnapshotClient(privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`));
 * const result = await client.scan("https://example.com");
 * console.log(result.hsts_present); // true
 * ```
 */

import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import type { SnapshotResult, SnapshotError as SnapshotErrorData, SnapshotClientOptions } from "./types.js";

export type { SnapshotResult, SnapshotErrorData, SnapshotClientOptions };

const DEFAULT_BASE_URL = "https://api.cybersecurity-japan.com";
const DEFAULT_TIMEOUT_MS = 30_000;
/** The API accepts USDC on Base mainnet only (CAIP-2 id). */
const BASE_MAINNET = "eip155:8453";

/** Signer accepted by the x402 v2 EVM scheme, e.g. a viem `privateKeyToAccount()` account. */
export type SnapshotSigner = ConstructorParameters<typeof ExactEvmScheme>[0];

export class SnapshotApiError extends Error {
  constructor(
    public readonly data: SnapshotErrorData,
    public readonly status: number
  ) {
    super(`Snapshot API error (${data.error_type}): ${data.error}`);
    this.name = "SnapshotApiError";
  }
}

/**
 * Client for the Website Security Snapshot API (x402 v2, Base mainnet).
 */
export class SnapshotClient {
  private readonly fetch402: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    /** A viem account, e.g. `privateKeyToAccount(key)`, holding USDC on Base */
    signer: SnapshotSigner,
    options: SnapshotClientOptions = {}
  ) {
    this.fetch402 = wrapFetchWithPaymentFromConfig(fetch, {
      schemes: [{ network: BASE_MAINNET, client: new ExactEvmScheme(signer) }],
    }) as (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Scan a URL's security headers.
   * Pays 0.05 USDC on Base automatically via x402.
   * @throws {SnapshotError} if the API returns an error response
   */
  async scan(url: string): Promise<SnapshotResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res!: Response;
    try {
      res = await this.fetch402(`${this.baseUrl}/v1/snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 400) {
      const err = (await res.json()) as SnapshotErrorData;
      throw new SnapshotApiError(err, 400);
    }

    if (res.status === 402) {
      // Payment was attempted but not accepted; the facilitator's reason is in
      // the PAYMENT-REQUIRED header (e.g. insufficient USDC on Base).
      throw new Error(`Payment not accepted: ${paymentError(res) ?? "no reason given"}`);
    }

    if (!res.ok) {
      throw new Error(`Unexpected status ${res.status} from Snapshot API`);
    }

    return res.json() as Promise<SnapshotResult>;
  }

  /**
   * Fetch the free canned demo snapshot (no payment required).
   * Useful for testing your integration without spending USDC.
   */
  async demo(): Promise<SnapshotResult> {
    const res = await fetch(`${this.baseUrl}/demo/snapshot`);
    if (!res.ok) throw new Error(`Demo endpoint returned ${res.status}`);
    return res.json() as Promise<SnapshotResult>;
  }

  /**
   * Check API health.
   */
  async health(): Promise<{ status: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Health check returned ${res.status}`);
    return res.json();
  }
}

function paymentError(res: Response): string | undefined {
  const header = res.headers.get("PAYMENT-REQUIRED");
  if (!header) return undefined;
  try {
    return (JSON.parse(Buffer.from(header, "base64").toString("utf8")) as { error?: string }).error;
  } catch {
    return undefined;
  }
}
