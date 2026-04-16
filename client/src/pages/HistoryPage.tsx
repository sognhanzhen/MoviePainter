import { useMemo, useState } from "react";

type AssetCategory = "All" | "My Favorites";

type CreativeAsset = {
  category: "Overlays" | "Presets" | "Textures" | "Typography";
  imageUrl: string;
  label: string;
  section: "Essential Textures" | "Recently Added";
  title: string;
};

const categoryOptions: AssetCategory[] = ["All", "My Favorites"];

const assetImages = {
  agedScript: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
  anamorphic: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=900&q=80",
  brutalist: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
  dust: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80",
  grain: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  kinetic: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
  letterbox: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
  optic: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80"
};

const creativeAssets: CreativeAsset[] = [
  {
    category: "Overlays",
    imageUrl: assetImages.grain,
    label: "Overlay",
    section: "Recently Added",
    title: "16mm Grain Pack"
  },
  {
    category: "Overlays",
    imageUrl: assetImages.anamorphic,
    label: "Lighting",
    section: "Recently Added",
    title: "Blue Anamorphic"
  },
  {
    category: "Textures",
    imageUrl: assetImages.brutalist,
    label: "Texture",
    section: "Recently Added",
    title: "Brutalist Surface"
  },
  {
    category: "Presets",
    imageUrl: assetImages.optic,
    label: "UI Elements",
    section: "Recently Added",
    title: "Optic Interface"
  },
  {
    category: "Presets",
    imageUrl: assetImages.kinetic,
    label: "Motion",
    section: "Recently Added",
    title: "Kinetic Blur"
  },
  {
    category: "Presets",
    imageUrl: assetImages.letterbox,
    label: "Frame",
    section: "Recently Added",
    title: "Modern Letterbox"
  },
  {
    category: "Overlays",
    imageUrl: assetImages.dust,
    label: "VFX",
    section: "Recently Added",
    title: "Dust Particles"
  },
  {
    category: "Typography",
    imageUrl: assetImages.agedScript,
    label: "Typography",
    section: "Recently Added",
    title: "Aged Script"
  },
  {
    category: "Textures",
    imageUrl: assetImages.grain,
    label: "Texture",
    section: "Essential Textures",
    title: "Grain v.2"
  }
];

export function HistoryPage() {
  const [activeCategory, setActiveCategory] = useState<AssetCategory>("All");

  const filteredAssets = useMemo(() => {
    if (activeCategory === "All") {
      return creativeAssets;
    }

    return creativeAssets.filter((asset) =>
      ["16mm Grain Pack", "Blue Anamorphic", "Aged Script"].includes(asset.title)
    );
  }, [activeCategory]);

  const sections = ["Recently Added", "Essential Textures"] as const;

  return (
    <section className="relative space-y-10">
      <section className="mx-auto max-w-7xl">
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-[#1c1b1b] p-1">
          {categoryOptions.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`inline-flex h-9 min-w-[8.75rem] cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-bold transition ${
                activeCategory === category
                  ? "bg-gradient-to-r from-[#ffb4aa] to-[#e50914] text-[#410001] shadow-lg shadow-[#e50914]/20"
                  : "text-white/60 hover:bg-white/7 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12">
        {sections.map((section) => {
          const sectionAssets = filteredAssets.filter((asset) => asset.section === section);

          if (sectionAssets.length === 0) {
            return null;
          }

          return (
            <section key={section}>
              <div className="mb-6 flex items-center gap-4">
                <h2 className="font-[var(--font-display)] text-lg font-bold tracking-[-0.035em] text-white/90">
                  {section}
                </h2>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {sectionAssets.map((asset) => (
                  <AssetCard key={`${asset.section}-${asset.title}`} asset={asset} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-20 flex justify-center">
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 py-4 font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-[#410001] uppercase shadow-lg shadow-[#e50914]/20 transition hover:scale-105 active:scale-95"
        >
          Browse All Assets
        </button>
      </div>

      <footer className="mt-24 flex flex-col items-center justify-between gap-8 border-t border-white/5 py-10 md:flex-row">
        <div className="text-center md:text-left">
          <p className="font-[var(--font-display)] text-lg font-black text-[#e5e2e1]">MoviePainter</p>
          <p className="mt-2 text-[10px] tracking-[0.24em] text-neutral-600 uppercase">
            © 2024 MoviePainter. The Digital Curator.
          </p>
        </div>
        <nav className="flex gap-10 text-[10px] tracking-[0.24em] uppercase">
          {["Privacy", "Terms", "Support"].map((item) => (
            <a key={item} href="#" className="text-neutral-600 transition hover:text-[#e5e2e1]">
              {item}
            </a>
          ))}
        </nav>
      </footer>
    </section>
  );
}

function AssetCard({ asset }: { asset: CreativeAsset }) {
  return (
    <article className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg bg-[#1c1b1b] transition duration-500 hover:scale-[1.02]">
      <img
        src={asset.imageUrl}
        alt={asset.title}
        className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-110 group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/16 to-transparent opacity-76 transition group-hover:opacity-92" />
      <div className="absolute right-0 bottom-0 left-0 translate-y-2 p-4 transition duration-300 group-hover:translate-y-0">
        <p className="font-[var(--font-display)] text-[9px] font-bold tracking-[0.2em] text-[#ffb4aa] uppercase">
          {asset.label}
        </p>
        <h3 className="mt-1 font-[var(--font-display)] text-sm leading-tight font-bold text-[#e5e2e1]">
          {asset.title}
        </h3>
      </div>
    </article>
  );
}
