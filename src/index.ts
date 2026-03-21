/**
 * security-snapshot-api
 * TypeScript client for the Website Security Snapshot API.
 * Wraps x402-fetch to handle on-chain USDC payment automatically.
 *
 * @example
 * ```typescript
 * import { SnapshotClient } from "security-snapshot-api";
 * import { createSigner } from "x402-fetch";
 *
 * const signer = await createSigner("base", "0xYOUR_PRIVATE_KEY");
 * const client = new SnapshotClient(signer);
 * const result = await client.scan("https://example.com");
 * console.log(result.hsts_present); // true
 * ```
 */

import { wrapFetchWithPayment } from "x402-fetch";
import type { SnapshotResult, SnapshotError as SnapshotErrorData, SnapshotClientOptions } from "./types.js";

export type { SnapshotResult, SnapshotErrorData, SnapshotClientOptions };

const DEFAULT_BASE_URL = "https://api.cybersecurity-japan.com";
const DEFAULT_TIMEOUT_MS = 30_000;

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
 * Client for the Website Security Snapshot API.
 * Accepts any x402-fetch compatible signer (viem WalletClient, createSigner, etc.)
 */
export class SnapshotClient {
  private readonly fetch402: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    /** A viem WalletClient or the result of x402-fetch's createSigner() */
    signer: Parameters<typeof wrapFetchWithPayment>[1],
    options: SnapshotClientOptions = {}
  ) {
    this.fetch402 = wrapFetchWithPayment(fetch, signer) as (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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
