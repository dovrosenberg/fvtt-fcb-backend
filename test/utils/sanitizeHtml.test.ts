import { sanitizeHtml } from '@/utils/sanitizeHtml';

describe('sanitizeHtml', () => {
  it('should strip script tags and event handler attributes', () => {
    const input = '<p>Hello</p><img src=x onerror=alert(1) /><script>alert(1)</script>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<p>Hello</p>');
  });

  it('should strip all attributes from allowed tags', () => {
    const input = '<p class="x" style="color:red">Hi <strong onclick="evil()">there</strong></p>';
    const output = sanitizeHtml(input);
    expect(output).toBe('<p>Hi <strong>there</strong></p>');
  });

  it('should remove outer markdown code fences', () => {
    const input = '```html\n<p>Hi</p>\n```';
    const output = sanitizeHtml(input);
    expect(output).toBe('<p>Hi</p>');
  });
});
