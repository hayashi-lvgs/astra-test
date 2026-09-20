import h0 from '../../lib/heroHQ0';
import h1 from '../../lib/heroHQ1';
import h2 from '../../lib/heroHQ2';
import h3 from '../../lib/heroHQ3';
import h4 from '../../lib/heroHQ4';
import h5 from '../../lib/heroHQ5';
import h6 from '../../lib/heroHQ6';
import h7 from '../../lib/heroHQ7';
import h8 from '../../lib/heroHQ8';

export const dynamic = 'force-static';

export function GET() {
  const heroBase64 = [h0,h1,h2,h3,h4,h5,h6,h7,h8].join('');
  const bytes = Buffer.from(heroBase64, 'base64');

  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(bytes.length),
    },
  });
}
