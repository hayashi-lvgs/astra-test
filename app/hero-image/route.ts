import c0 from '../../lib/heroChunk0';
import c1 from '../../lib/heroChunk1';
import c2 from '../../lib/heroChunk2';
import c3 from '../../lib/heroChunk3';

export const dynamic = 'force-static';

export function GET() {
  const bytes = Buffer.from(`${c0}${c1}${c2}${c3}`, 'base64');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
