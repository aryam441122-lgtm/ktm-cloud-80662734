import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpLeft, Check, Copy, Download, ExternalLink, Search, X } from "lucide-react";
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

function SourceCard({ source, origin, index }: { source: Source; origin: string; index: number }) {
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
    <li className="group relative flex min-h-[330px] min-w-0 flex-col justify-between overflow-hidden rounded-md border border-border bg-card p-6 transition-[border-color,transform,background-color] duration-300 hover:-translate-y-1 hover:border-primary/60 hover:bg-secondary motion-reduce:transform-none sm:p-7">
      <span className="absolute right-7 top-0 h-0.5 w-12 origin-right scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100 motion-reduce:transition-none" aria-hidden="true" />
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-primary"><span className={`size-1.5 rounded-full ${pending ? "bg-muted-foreground" : "bg-primary"}`} />{pending ? "بانتظار المحتوى" : "مصدر متاح"}</span>
          <span className="font-source-display text-4xl font-bold tabular-nums text-foreground/10 transition-colors group-hover:text-primary/25" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="mt-7 flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-md border border-primary/20 bg-primary/10 font-source-display text-xl font-bold text-primary" aria-hidden="true">{source.name.slice(0, 1)}</span>
          <h2 className="min-w-0 break-words font-source-display text-2xl font-bold text-foreground sm:text-[28px]" dir="ltr">{source.name}</h2>
        </div>
        <p className="mt-3 text-xs text-muted-foreground" dir="ltr">/sources/{source.file}</p>
        <div className="mt-7 flex items-end gap-2 border-t border-border pt-5">
          <strong className="font-source-display text-4xl font-bold leading-none tabular-nums text-foreground" dir="ltr">{count.toLocaleString("en-US")}</strong>
          <span className="pb-0.5 text-xs text-muted-foreground">لعبة مفهرسة</span>
        </div>
      </div>
      <div className="mt-7 flex gap-2">
        <Button type="button" onClick={copy} variant="outline" size="icon" className="size-11 shrink-0 border-border bg-background text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary" title={copied ? "تم النسخ" : `نسخ رابط ${source.name}`} aria-label={copied ? `تم نسخ رابط ${source.name}` : `نسخ رابط ${source.name}`}>
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
        <Button variant="outline" asChild className="h-11 min-w-0 flex-1 border-border bg-background text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground">
          <a href={`/sources/${source.file}`} target="_blank" rel="noopener noreferrer" aria-label={`فتح ملف ${source.name}`}><ExternalLink aria-hidden="true" /> فتح المصدر</a>
        </Button>
        <Button variant="outline" size="icon" asChild className="size-11 shrink-0 border-border bg-background text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary" title={`تحميل ملف ${source.name}`}>
          <a href={`/sources/${source.file}`} download={source.file} aria-label={`تحميل ملف ${source.name}`}><Download aria-hidden="true" /></a>
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
  const totalGames = sources.reduce((total, source) => total + source.count, 0);

  return (
    <main className="sources-surface min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 sm:flex sm:justify-between sm:px-8 lg:px-12">
          <a href="/sources" className="flex min-w-0 items-center gap-3 text-lg font-bold text-foreground" aria-label="KTM Launcher">
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-primary/40 bg-primary/10 font-source-display text-xl font-bold text-primary">K</span>
            <span className="truncate font-source-display">KTM <span className="font-normal text-muted-foreground">Launcher</span></span>
          </a>
          <span className="hidden text-xs font-semibold text-primary sm:block">دليل المصادر</span>
          <Button asChild size="sm" className="h-10 shrink-0 bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary/85">
            <a href={ktmZip.url} download="KTM.zip"><Download aria-hidden="true" /><span className="hidden sm:inline">تحميل البرنامج</span><span className="sm:hidden">تحميل</span></a>
          </Button>
        </div>
      </header>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16 lg:px-12">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-end">
            <div className="min-w-0">
              <span className="inline-flex border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">KTM / دليل المصادر</span>
              <h1 className="mt-5 font-source-display text-5xl font-extrabold leading-tight text-foreground sm:text-7xl">المصادر<span className="text-primary">.</span></h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">جميع مصادر الألعاب المتاحة لبرنامج KTM في مكان واحد.</p>
            </div>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-primary" aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مصدر..." aria-label="ابحث عن مصدر" className="h-14 w-full rounded-md border border-border border-b-2 bg-card pr-4 pl-12 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary" />
              {query && <Button type="button" variant="ghost" size="icon" onClick={() => setQuery("")} className="absolute left-10 top-1/2 size-8 -translate-y-1/2 text-muted-foreground" aria-label="مسح البحث"><X aria-hidden="true" /></Button>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 pt-9 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
          <p className="text-sm font-semibold text-foreground">استكشف المصادر</p>
          <p className="shrink-0 font-source-display text-sm tabular-nums text-primary" dir="ltr">{filtered.length.toString().padStart(2, "0")} / {sources.length.toString().padStart(2, "0")}</p>
        </div>
        {filtered.length > 0 ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((source) => <SourceCard key={source.file} source={source} origin={origin} index={sources.indexOf(source)} />)}
          </ul>
        ) : (
          <div className="border border-border py-16 text-center"><p className="text-sm text-muted-foreground">لا توجد مصادر تطابق البحث.</p><Button variant="link" onClick={() => setQuery("")} className="mt-2 text-primary">مسح البحث <ArrowUpLeft aria-hidden="true" /></Button></div>
        )}
        <div className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-8">
          <div><p className="text-xs text-muted-foreground">المصادر المتاحة</p><p className="mt-1 font-source-display text-3xl font-bold text-foreground" dir="ltr">{sources.length}</p></div>
          <div><p className="text-xs text-muted-foreground">الألعاب المفهرسة</p><p className="mt-1 font-source-display text-3xl font-bold text-primary" dir="ltr">{totalGames.toLocaleString("en-US")}+</p></div>
        </div>
      </section>
    </main>
  );
}
