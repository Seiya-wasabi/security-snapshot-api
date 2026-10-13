// Check a website before your agent links to it, recommends it, or sends data
// to it. Pays 0.05 USDC on Base per live check (x402 v2).
//
//   PRIVATE_KEY=0x... node examples/check-before-linking.mjs https://example.com
//   node examples/check-before-linking.mjs --demo     # free canned result, no wallet
//
// The rules below are an example policy, not part of the API: the API only
// reports what it observed. Adjust them to your agent's risk tolerance.
import { SnapshotClient, SnapshotApiError } from "security-snapshot-api";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

const target = process.argv[2] ?? "https://example.com";
const demo = target === "--demo" || !process.env.PRIVATE_KEY;
const client = new SnapshotClient(privateKeyToAccount(process.env.PRIVATE_KEY ?? generatePrivateKey()));

let snap;
try {
  snap = demo ? await client.demo() : await client.scan(target);
} catch (err) {
  if (err instanceof SnapshotApiError) {
    // 400 (invalid URL, private/localhost target, unreachable). The payment is
    // verified before the URL is checked, but an error response is not settled,
    // so nothing is charged. With an unfunded wallet you get "Payment not
    // accepted" instead, because verification fails first.
    console.log(JSON.stringify({ decision: "block", reasons: [`${err.data.error_type}: ${err.data.error}`] }));
    process.exit(0);
  }
  throw err; // e.g. "Payment not accepted: ..." when the wallet has no USDC on Base
}

const reasons = [];
if (!snap.reachable) reasons.push("site not reachable");
if (!snap.https_ok) reasons.push("final URL is not HTTPS");
if (!snap.hsts_present) reasons.push("no HSTS header");
if (!snap.csp_present) reasons.push("no Content-Security-Policy");
if (new URL(snap.final_url).hostname !== new URL(snap.requested_url).hostname) reasons.push("redirects to another host");

const decision = !snap.reachable || !snap.https_ok ? "block" : reasons.length ? "caution" : "proceed";
console.log(JSON.stringify({ url: snap.requested_url, demo, decision, reasons, notes: snap.notes }, null, 2));
