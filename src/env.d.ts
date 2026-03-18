/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  run(): Promise<unknown>;
  first<T>(): Promise<T | null>;
}

interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

interface Env {
  DB?: D1DatabaseLike;
  MAGIC_LINK_SECRET?: string;
  SESSION_SECRET?: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  PUBLIC_BASE_URL?: string;
}

declare namespace App {
  interface Locals extends Runtime {}
  interface Locals {
    authenticatedEmail?: string;
  }
}
