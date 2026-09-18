import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import getDb from '@/lib/db';

const client = new Anthropic();

interface DbItem {
  id: number;
  name: string;
  type: string;
  color: string;
  brand: string;
  price_estimate: number;
  image_path: string;
  product_image_url: string | null;
  product_url: string | null;
}

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

// DuckDuckGo Image Search: returns direct CDN image URLs and product page URLs
async function ddgImageSearch(query: string): Promise<{ imageUrl: string; pageUrl: string } | null> {
  // Step 1: get the vqd token DuckDuckGo requires for the image API
  const tokenRes = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    { headers: { ...BROWSER_HEADERS, 'Accept': 'text/html' }, signal: AbortSignal.timeout(10000) }
  );
  const html = await tokenRes.text();
  const vqdMatch = html.match(/vqd=['"]([^'"]{10,})['"]/);
  if (!vqdMatch) return null;

  // Step 2: fetch image results JSON
  const imgRes = await fetch(
    `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqdMatch[1]}&f=,,,,,&p=1&l=us-en`,
    { headers: { ...BROWSER_HEADERS, 'Referer': 'https://duckduckgo.com/', 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) }
  );
  const data = await imgRes.json() as { results?: { image: string; url: string; title: string }[] };

  const first = data.results?.[0];
  if (!first?.image) return null;
  return { imageUrl: first.image, pageUrl: first.url };
}

// Use Claude with web_search to get enriched text data (brand, price, name)
async function enrichTextData(item: DbItem): Promise<{ brand: string; price_estimate: number | null; name: string; product_url: string | null }> {
  const query = `${item.brand !== 'Unknown' ? item.brand + ' ' : ''}${item.name} ${item.color}`;
  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 512,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
      messages: [{
        role: 'user',
        content: `Search for "${query}" on a fashion retailer. Find the brand name, current retail price, and product page URL.

Return ONLY valid JSON — no other text:
{
  "brand": "exact brand name",
  "price_estimate": retail price as a number (null if not found),
  "name": "exact product name",
  "product_url": "URL to product page (null if not found)"
}`,
      }],
    });
    const textBlocks = response.content.filter(b => b.type === 'text');
    const lastText = textBlocks[textBlocks.length - 1];
    const text = lastText?.type === 'text' ? lastText.text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {}
  return { brand: item.brand, price_estimate: item.price_estimate, name: item.name, product_url: null };
}

async function downloadImageLocally(imageUrl: string, itemId: number): Promise<string | null> {
  const res = await fetch(imageUrl, {
    headers: { ...BROWSER_HEADERS, 'Referer': 'https://duckduckgo.com/' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.startsWith('image/')) return null;

  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const filename = `product-${itemId}-${Date.now()}.${ext}`;
  const savePath = path.join(process.cwd(), 'public', 'uploads', filename);

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength < 2000) return null; // reject tiny/broken images
  await writeFile(savePath, buf);
  return `/uploads/${filename}`;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as DbItem | undefined;
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const imageQuery = `${item.brand !== 'Unknown' ? item.brand + ' ' : ''}${item.name} ${item.color} product photo`;

    // Run image search and text enrichment in parallel
    const [imgResult, textData] = await Promise.all([
      ddgImageSearch(imageQuery).catch(() => null),
      enrichTextData(item),
    ]);

    let localImagePath: string | null = null;
    if (imgResult?.imageUrl) {
      localImagePath = await downloadImageLocally(imgResult.imageUrl, item.id).catch(() => null);
    }

    db.prepare(`
      UPDATE items SET
        product_image_url = ?,
        product_url = ?,
        brand = ?,
        price_estimate = ?,
        name = ?
      WHERE id = ?
    `).run(
      localImagePath,
      textData.product_url ?? imgResult?.pageUrl ?? null,
      textData.brand ?? item.brand,
      textData.price_estimate ?? item.price_estimate,
      textData.name ?? item.name,
      id,
    );
  } catch (err) {
    console.error('[enrich] failed:', err);
  }

  return NextResponse.json(db.prepare('SELECT * FROM items WHERE id = ?').get(id));
}
