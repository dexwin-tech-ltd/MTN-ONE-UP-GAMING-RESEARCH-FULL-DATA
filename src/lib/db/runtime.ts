type RuntimeEnv = App.Locals['runtime']['env'];

export function getRuntimeEnv(locals: App.Locals): RuntimeEnv {
  if (!locals.runtime?.env) {
    throw new Error('Cloudflare runtime env is not available.');
  }

  return locals.runtime.env;
}

export function getOptionalRuntimeEnv(locals: App.Locals): RuntimeEnv | null {
  try {
    return getRuntimeEnv(locals);
  } catch {
    return null;
  }
}

export function getDatabase(locals: App.Locals): NonNullable<RuntimeEnv['DB']> {
  const env = getRuntimeEnv(locals);

  if (!env.DB) {
    throw new Error('Missing Cloudflare D1 binding `DB`.');
  }

  return env.DB;
}
