interface SendMagicLinkEmailInput {
  apiKey?: string;
  from?: string;
  to: string;
  magicLinkUrl: string;
}

export async function sendMagicLinkEmail(input: SendMagicLinkEmailInput): Promise<void> {
  if (!input.apiKey || !input.from) {
    console.log(`[magic-link] Email provider not configured. Send ${input.magicLinkUrl} to ${input.to}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: 'Your MTN OneUp sign-in link',
      html: `<p>Use the link below to access the MTN OneUp Gaming Research dashboard.</p><p><a href="${input.magicLinkUrl}">Sign in</a></p><p>This link expires after 24 hours and can be used only once.</p>`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to send magic link email: ${body}`);
  }
}
