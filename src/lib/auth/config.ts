import { getOptionalRuntimeEnv } from '../db/runtime';

function getProcessEnv(name: string): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }

  return process.env[name];
}

interface AuthConfigOptions {
  requestUrl?: string;
}

export interface AuthConfig {
  sessionSecret: string;
  magicLinkSecret: string;
  resendApiKey?: string;
  emailFrom?: string;
  publicBaseUrl?: string;
}

export function getAuthConfig(locals: App.Locals, options: AuthConfigOptions = {}): AuthConfig {
  const env = getOptionalRuntimeEnv(locals);
  const fallbackBaseUrl = options.requestUrl ? new URL(options.requestUrl).origin : undefined;

  return {
    sessionSecret: env?.SESSION_SECRET ?? getProcessEnv('SESSION_SECRET') ?? 'dev-session-secret',
    magicLinkSecret: env?.MAGIC_LINK_SECRET ?? getProcessEnv('MAGIC_LINK_SECRET') ?? 'dev-magic-link-secret',
    resendApiKey: env?.RESEND_API_KEY ?? getProcessEnv('RESEND_API_KEY'),
    emailFrom: env?.EMAIL_FROM ?? getProcessEnv('EMAIL_FROM'),
    publicBaseUrl: env?.PUBLIC_BASE_URL ?? getProcessEnv('PUBLIC_BASE_URL') ?? fallbackBaseUrl,
  };
}
