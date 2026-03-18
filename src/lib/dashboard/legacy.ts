import legacyDashboardHtml from '../../../index.html?raw';

function extractSection(source: string, tagName: 'head' | 'body'): string {
  const match = source.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i'));

  if (!match) {
    throw new Error(`Unable to locate <${tagName}> in legacy dashboard source.`);
  }

  return match[1].trim();
}

function stripLegacyAuthShell(bodyContent: string): string {
  return bodyContent
    .replace(/<div\s+style="width:100%;[\s\S]*?<div id="auth"><\/div>\s*<\/div>\s*/i, '')
    .replace('<div id="app" style="display:none;">', '<div id="app">');
}

function stripLegacyClerkScripts(bodyContent: string): string {
  return bodyContent.replace(
    /\s*<!-- Rest of your HTML file -->\s*<script async crossorigin="anonymous"[\s\S]*?<\/script>\s*<!-- Rest of your HTML file -->\s*<script>[\s\S]*?<\/script>\s*$/i,
    '',
  );
}

export async function loadLegacyDashboardSource(): Promise<{ headContent: string; bodyContent: string }> {
  const headContent = extractSection(legacyDashboardHtml, 'head');
  const bodyContent = stripLegacyClerkScripts(
    stripLegacyAuthShell(extractSection(legacyDashboardHtml, 'body')),
  );

  return {
    headContent,
    bodyContent,
  };
}
