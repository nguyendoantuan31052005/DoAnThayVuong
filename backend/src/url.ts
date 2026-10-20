import { BadRequestException } from '@nestjs/common';
export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error();
    url.hash = '';
    return url.href;
  } catch { throw new BadRequestException('URL phải dùng http/https và không chứa thông tin đăng nhập'); }
}
