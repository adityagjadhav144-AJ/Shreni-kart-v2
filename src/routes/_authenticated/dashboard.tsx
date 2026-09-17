import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Mic,
  Plus,
  Search,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import heroImg from "@/assets/hero-artisan.jpg";
import { Phone, SectionTitle } from "@/components/kk/shell";
import { inr, products as initialProducts, type Product } from "@/lib/kalakart-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "ShreniKart — Empowering Artisans with Shreni AI" },
      {
        name: "description",
        content:
          "ShreniKart turns an artisan's voice and camera into verified listings on Shreni Bazaar with AI storytelling and fair pricing.",
      },
      { property: "og:title", content: "ShreniKart — Empowering Artisans" },
      {
        property: "og:description",
        content:
          "AI marketplace and smart cataloging assistant for Indian artisans. Speak in your language, sell everywhere.",
      },
    ],
  }),
  component: Home,
});

const filters = ["All", "Published", "Draft", "Out of Stock"] as const;

function Home() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [query, setQuery] = useState("");
  const [allProductsList, setAllProductsList] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // Sync newly added products from Shreni AI Bazaar
    try {
      const stored = localStorage.getItem("shrenikart_user_products");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const adapted: Product[] = parsed.map((item: any) => ({
            id: item.id || `p-${Date.now()}`,
            name: item.title,
            price: item.final_price,
            stock: 12,
            status: "Published",
            rating: 5.0,
            reviewsCount: 1,
            craft: item.craft || "Handicraft",
            image: item.image || "/assets/p-vase.jpg",
            category: "Handicrafts",
            description: item.description || "",
            materials: item.materials ? item.materials.split(",") : ["Handmade"],
          }));
          setAllProductsList([...adapted, ...initialProducts]);
        }
      }
    } catch {}
  }, []);

  const mine = allProductsList.filter(
    (p) =>
      (filter === "All" || p.status === filter) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Phone withNav>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 px-5 pt-6">
        <div>
          <p className="font-display text-xl font-semibold tracking-[0.18em] text-primary">
            SHRENIKART
          </p>
          <h1 className="mt-1.5 text-[22px] leading-tight font-semibold text-foreground">
            Namaste, Artisan! 🙏
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shreni Bazaar • Empowering traditional Indian crafts
          </p>
        </div>
        <Link
          to="/profile"
          aria-label="Profile and language settings"
          className="tap grid size-11 shrink-0 place-items-center rounded-2xl bg-card text-primary shadow-soft"
        >
          <UserRound className="size-5" />
        </Link>
      </div>

      {/* Hero */}
      <section className="rise mt-4 px-5">
        <div className="relative overflow-hidden rounded-3xl shadow-card">
          <img
            src={heroImg}
            alt="Indian artisan shaping a terracotta pot on a potter's wheel"
            width={1200}
            height={912}
            className="h-56 w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-hero opacity-80" />
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <span className="w-fit rounded-full bg-ivory/15 px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-ivory backdrop-blur">
              AI CATALOGING
            </span>
            <div>
              <h2 className="font-display text-2xl leading-[1.05] font-semibold text-ivory">
                YOUR CRAFT.
                <br />
                YOUR STORY.
                <br />
                YOUR MARKET.
              </h2>
              <p className="mt-2 max-w-[15rem] text-[11px] leading-snug text-ivory/75">
                Turn your handmade products into professional digital listings with AI.
              </p>
              <Link
                to="/add-product"
                className="tap mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-5 py-3 text-sm font-semibold text-gold-foreground shadow-float"
              >
                <Plus className="size-4" strokeWidth={3} />
                Add Product
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Two feature cards */}
      <section className="mt-4 grid grid-cols-2 gap-3 px-5">
        <Link
          to="/voice"
          className="tap rise rounded-3xl bg-card p-4 shadow-soft border border-amber-500/20"
          style={{ animationDelay: "80ms" }}
        >
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-gradient-warm text-primary-foreground shadow-sm">
              <Mic className="size-5" />
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-900 border border-amber-500/25">
              Namaste Shreni
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-foreground">Shreni AI</p>
          <p className="text-[11px] font-medium text-primary">Multilingual Voice & Camera</p>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            Say “Namaste Shreni” to navigate, interview, capture photo, and list on Bazaar.
          </p>
        </Link>
        <Link
          to="/chat"
          className="tap rise rounded-3xl bg-card p-4 shadow-soft"
          style={{ animationDelay: "160ms" }}
        >
          <span className="grid size-10 place-items-center rounded-2xl bg-maroon text-maroon-foreground">
            <Sparkles className="size-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-foreground">AI ChatBot</p>
          <p className="text-[11px] text-primary">Your business assistant</p>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            Ask about products, prices, descriptions and selling.
          </p>
        </Link>
      </section>

      {/* Popular picks */}
      <section className="mt-5">
        <div className="px-5">
          <SectionTitle
            title="Popular Picks"
            subtitle="Trending handicrafts buyers love"
            action={<ArrowRight className="size-4 text-primary" />}
          />
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-5 pb-2">
          {initialProducts.map((p, i) => (
            <article
              key={p.id}
              className="rise w-40 shrink-0 rounded-3xl bg-card p-2.5 shadow-soft"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className="overflow-hidden rounded-2xl bg-beige">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  width={700}
                  height={700}
                  className="h-28 w-full object-cover"
                />
              </div>
              <p className="mt-2 line-clamp-2 h-8 text-xs font-semibold text-foreground">
                {p.name}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-primary">{inr(p.price)}</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="size-3 fill-gold text-gold" />
                    {p.rating}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Add ${p.name}`}
                  onClick={() => toast.success(`${p.name} added to your showcase`)}
                  className="tap grid size-8 place-items-center rounded-xl bg-gradient-warm text-primary-foreground"
                >
                  <Plus className="size-4" strokeWidth={3} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* My products */}
      <section className="mt-6 px-5">
        <SectionTitle
          title="My Products"
          subtitle="Your artisan catalog"
          action={
            <Link
              to="/add-product"
              className="tap inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              <Plus className="size-3.5" strokeWidth={3} /> Add
            </Link>
          }
        />

        <div className="relative">
          <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your products"
            className="w-full rounded-2xl border border-border bg-card py-3 pr-4 pl-11 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "tap shrink-0 rounded-full px-4 py-2 text-xs font-semibold",
                filter === f
                  ? "bg-maroon text-maroon-foreground"
                  : "bg-card text-muted-foreground shadow-soft",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-3">
          {mine.map((p) => (
            <article
              key={p.id}
              className="flex items-center gap-3 rounded-3xl bg-card p-3 shadow-soft"
            >
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                width={700}
                height={700}
                className="size-20 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {p.name}
                </p>
                <p className="text-sm font-bold text-primary">{inr(p.price)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.stock} available
                </p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    p.status === "Published" && "bg-leaf/15 text-leaf",
                    p.status === "Draft" && "bg-gold/25 text-gold-foreground",
                    p.status === "Out of Stock" && "bg-destructive/10 text-destructive",
                  )}
                >
                  {p.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toast(`Editing ${p.name}`)}
                className="tap self-start rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
              >
                Edit
              </button>
            </article>
          ))}
          {mine.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products match this filter yet.
            </p>
          ) : null}
        </div>
      </section>
    </Phone>
  );
}
