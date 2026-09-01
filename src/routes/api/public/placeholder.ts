import { createFileRoute } from "@tanstack/react-router";
import { corsHeaders } from "@/lib/steam-catalogue";

const SHAPES: Record<string, { w: number; h: number }> = {
  cover: { w: 920, h: 430 },
  library: { w: 600, h: 900 },
  hero: { w: 1920, h: 620 },
  icon: { w: 231, h: 87 },
};

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (c) =>
    c === "<"
      ? "&lt;"
      : c === ">"
        ? "&gt;"
        : c === "&"
          ? "&amp;"
          : c === "'"
            ? "&apos;"
            : "&quot;"
  );

/** Deterministic hue so each game keeps the same placeholder colour. */
const hueFor = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) % 360;
  }
  return hash;
};

const wrap = (title: string, maxChars: number) => {
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
};

export const Route = createFileRoute("/api/public/placeholder")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, { status: 204, headers: corsHeaders }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const title = (url.searchParams.get("title") ?? "Game").slice(0, 60);
        const shape = url.searchParams.get("shape") ?? "cover";
        const { w, h } = SHAPES[shape] ?? SHAPES['cover']!;

        const hue = hueFor(title);
        const fontSize = Math.round(Math.min(w, h) / 9);
        const lines = wrap(title, Math.max(10, Math.floor(w / (fontSize * 0.6))));
        const startY = h / 2 - ((lines.length - 1) * fontSize * 1.2) / 2;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue}, 45%, 22%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 55%, 10%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="rgba(255,255,255,0.92)" text-anchor="middle">
    ${lines
      .map(
        (line, index) =>
          `<text x="${w / 2}" y="${startY + index * fontSize * 1.2}" dominant-baseline="middle">${escapeXml(line)}</text>`
      )
      .join("\n    ")}
  </g>
</svg>`;

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Cache-Control": "public, max-age=604800, immutable",
            ...corsHeaders,
          },
        });
      },
    },
  },
});
