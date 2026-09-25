import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ktmZip from "@/assets/KTM.zip.asset.json";

export const Route = createFileRoute("/sources/")({
  head: () => ({
    meta: [
      { title: "مصادر التحميل | KTM Launcher" },
      { name: "description", content: "تصفح مصادر تحميل KTM وانسخ روابط SteamRip وFitGirl وFreeGOG وOnlineFix وDODI وIGGames وInsaneRamZes وRexaGames وAnkerGames." },
      { property: "og:title", content: "مصادر التحميل | KTM Launcher" },
      { property: "og:description", content: "دليل مصادر التحميل المتاحة لبرنامج KTM Launcher." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SourcesPage,
});

const sources = [
  { name: "SteamRip", file: "steamrip.json", count: 4784, platform: "Windows" },
  { name: "FitGirl", file: "fitgirl.json", count: 8706, platform: "Windows" },
  { name: "FreeGOG", file: "freegog.json", count: 7688, platform: "Windows" },
  { name: "OnlineFix", file: "onlinefix.json", count: 2784, platform: "Windows" },
  { name: "DODI", file: "dodi.json", count: 0, platform: "Windows" },
  { name: "IGGames", file: "iggames.json", count: 5731, platform: "Windows" },
  { name: "InsaneRamZes", file: "insaneramzes.json", count: 3493, platform: "Windows" },
  { name: "RexaGames", file: "rexagames.json", count: 3025, platform: "Windows" },
  { name: "AnkerGames", file: "ankergames.json", count: 1876, platform: "Windows" },
] as const;

type Source = (typeof sources)[number];

function SourceCard({ source, origin }: { source: Source; origin: string }) {
  const [copied, setCopied] = useState(false);
  const [count, setCount] = useState<number>(source.count);
  const url = `${origin}/sources/${source.file}`;
  const pending = count === 0;

  useEffect(() => {
    if (source.count !== 0) return;
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { downloads?: unknown[] } | null) => {
        if (Array.isArray(data?.downloads)) setCount(data.downloads.length);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [source.count, url]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <li className="flex min-w-0 flex-col rounded-md border border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-card-foreground" dir="auto">{source.name}</h2>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`size-1.5 shrink-0 rounded-full ${pending ? "bg-muted-foreground" : "bg-chart-2"}`} />
            {pending ? "بانتظار إضافة الألعاب" : "متاح"}
            <span aria-hidden="true">·</span>
            {source.platform}
          </p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-xs font-bold text-secondary-foreground" aria-label="Windows">⊞</span>
      </div>

      <div className="mt-5 flex min-h-16 items-center gap-3 rounded-md border border-primary/10 bg-primary/5 px-4">
        <strong className="text-2xl font-bold tabular-nums text-primary">{count.toLocaleString("en-US")}</strong>
        <span className="text-xs leading-5 text-muted-foreground">لعبة<br />مفهرسة</span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="button" variant="outline" onClick={copy} className="min-w-0 flex-1 border-border bg-transparent text-foreground hover:bg-accent" aria-label={`نسخ رابط ${source.name}`}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </Button>
        <Button variant="outline" size="icon" asChild className="border-border bg-transparent" title={`فتح ${source.name}`}>
          <a href={`/sources/${source.file}`} target="_blank" rel="noopener noreferrer" aria-label={`فتح ملف ${source.name}`}><ExternalLink aria-hidden="true" /></a>
        </Button>
      </div>
    </li>
  );
}

function SourcesPage() {
  const [origin, setOrigin] = useState("https://ktm-cloud.lovable.app");
  const [query, setQuery] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const filtered = useMemo(() => sources.filter((source) => source.name.toLowerCase().includes(query.trim().toLowerCase())), [query]);

  return (
    <main className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="/sources" className="flex shrink-0 items-center gap-2 text-base font-black text-foreground" aria-label="KTM Launcher">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">K</span>
            KTM <span className="hidden text-xs font-normal text-muted-foreground sm:inline">Launcher</span>
          </a>
          <nav aria-label="التنقل الرئيسي" className="flex items-center gap-2">
            <span className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-foreground" aria-current="page">المصادر</span>
          </nav>
          <Button size="sm" variant="outline" asChild className="shrink-0 border-primary/30 text-primary hover:bg-accent">
            <a href={ktmZip.url} download="KTM.zip"><Download aria-hidden="true" /><span className="hidden sm:inline">تحميل البرنامج</span><span className="sm:hidden">تحميل</span></a>
          </Button>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-5 pb-7 pt-9 sm:px-8 sm:pt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">دليل المصادر / KTM</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">المصادر المتاحة</h1>
            </div>
            <div className="text-sm tabular-nums text-muted-foreground">{filtered.length} / {sources.length} مصادر</div>
          </div>
          <div className="relative mt-6 w-full max-w-sm">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مصدر..." aria-label="ابحث عن مصدر" className="h-10 w-full rounded-md border border-border bg-card pr-10 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring" />
            {query && <Button type="button" variant="ghost" size="icon" onClick={() => setQuery("")} className="absolute left-1 top-1/2 size-8 -translate-y-1/2" aria-label="مسح البحث"><X aria-hidden="true" /></Button>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {filtered.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((source) => <SourceCard key={source.file} source={source} origin={origin} />)}
          </ul>
        ) : (
          <p className="py-16 text-center text-sm text-muted-foreground">لا توجد مصادر تطابق البحث.</p>
        )}
      </section>
    </main>
  );
}