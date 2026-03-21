/** SnapshotResult — successful scan response from /v1/snapshot */
export interface SnapshotResult {
  requested_url: string;
  normalized_url: string;
  final_url: string;
  fetched_at: string; // ISO 8601
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
  /** Present on demo endpoint only */
  _demo?: boolean;
}

/** SnapshotError — returned with HTTP 400 */
export interface SnapshotError {
  requested_url: string;
  error: string;
  error_type: "ssrf" | "timeout" | "unreachable" | "invalid_url";
}

/** Options for SnapshotClient */
export interface SnapshotClientOptions {
  /** Base URL override (default: https://api.cybersecurity-japan.com) */
  baseUrl?: string;
  /** Timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}
