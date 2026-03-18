export interface MagicLinkRecord {
  selector: string;
  verifier_hash: string;
  email: string;
  expires_at: number;
  consumed_at: number | null;
  created_at: number;
  request_ip: string | null;
  user_agent: string | null;
}

export interface RateLimitRecord {
  key: string;
  bucket: string;
  window_start: number;
  count: number;
}
