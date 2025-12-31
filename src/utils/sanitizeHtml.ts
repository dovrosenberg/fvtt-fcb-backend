import sanitize from 'sanitize-html';
import { LLM_ALLOWED_HTML_TAGS } from '@/utils/htmlPolicy';

function stripOuterCodeFences(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('```')) return input;

  const lines = trimmed.split(/\r?\n/);
  if (lines.length < 3) return input;

  const firstLine = lines[0].trim();
  const lastLine = lines[lines.length - 1].trim();
  if (!firstLine.startsWith('```') || lastLine !== '```') return input;

  return lines.slice(1, -1).join('\n').trim();
}

export function sanitizeHtml(input: string): string {
  const stripped = stripOuterCodeFences(input);

  return sanitize(stripped, {
    allowedTags: [...LLM_ALLOWED_HTML_TAGS],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    enforceHtmlBoundary: true,
    allowVulnerableTags: false,
  }).trim();
}
