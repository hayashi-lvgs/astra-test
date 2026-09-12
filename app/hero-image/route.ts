import heroBase64 from '../../lib/heroBase64';

export const dynamic = 'force-static';

export function GET() {
  const bytes = Buffer.from(heroBase64.trim(), 'base64');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
