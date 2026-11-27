"use client";

import { useMemo, useState } from "react";

type Model = {
  title: string;
  creator: string;
  category: string;
  fileSize: string;
  downloads: string;
  style: string;
  shape: string;
  featured?: boolean;
};

const models: Model[] = [
  { title: "Mossy little house", creator: "Mina Park", category: "Scenes", fileSize: "18.4 MB", downloads: "2.4k", style: "house", shape: "⌂", featured: true },
  { title: "Orbit desk lamp", creator: "Theo Vance", category: "Objects", fileSize: "8.2 MB", downloads: "1.8k", style: "lamp", shape: "◉" },
  { title: "Cloudberry friend", creator: "June Studio", category: "Characters", fileSize: "12.6 MB", downloads: "986", style: "berry", shape: "●" },
  { title: "Sunday market", creator: "Kai Watanabe", category: "Scenes", fileSize: "24.1 MB", downloads: "742", style: "market", shape: "▱" },
  { title: "Pebble speaker", creator: "Alex Rivera", category: "Objects", fileSize: "6.8 MB", downloads: "612", style: "speaker", shape: "◍" },
  { title: "Tiny tide pool", creator: "Mina Park", category: "Scenes", fileSize: "16.3 MB", downloads: "508", style: "tide", shape: "◌" },
];

const categories = ["Everything", "Scenes", "Objects", "Characters"];

export default function Home() {
  const [category, setCategory] = useState("Everything");
  const [query, setQuery] = useState("");
  const filteredModels = useMemo(() => models.filter((model) => {
    const matchesCategory = category === "Everything" || model.category === category;
    const matchesQuery = `${model.title} ${model.creator} ${model.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Poly Nook home"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a>
        <nav className="top-links" aria-label="Main navigation"><a href="#gallery">Explore</a><a href="#about">About</a></nav>
        <a className="submit-button" href="#share">Share a model <span aria-hidden="true">↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A little world of 3D things</div>
          <h1>Good things<br />take <em>shape.</em></h1>
          <p>A cozy corner of the internet for thoughtful 3D models. Find something lovely, preview it, and make it your own.</p>
          <a className="hero-link" href="#gallery">Wander through the gallery <span>↓</span></a>
        </div>
        <div className="hero-art" aria-label="Abstract 3D scene illustration" role="img">
          <div className="sun-orb" /><div className="hero-cloud cloud-one" /><div className="hero-cloud cloud-two" />
          <div className="hero-platform platform-back" /><div className="hero-platform platform-front" />
          <div className="hero-vase"><i /></div><div className="hero-leaf leaf-one" /><div className="hero-leaf leaf-two" />
          <div className="art-caption"><span>01 / 06</span><span>Objects with a little soul</span></div>
          <span className="sparkle sparkle-one">✳</span><span className="sparkle sparkle-two">✦</span>
        </div>
        <div className="hero-note"><span>↓</span> Scroll to explore</div>
      </section>

      <section className="gallery-section" id="gallery">
        <div className="section-heading">
          <div><div className="eyebrow muted-eyebrow">THE COLLECTION <span>—</span> 001</div><h2>Made to be <em>found.</em></h2></div>
          <p>Free little building blocks for your next big idea.<br />Made by artists, shared with everyone.</p>
        </div>
        <div className="toolbar">
          <div className="category-tabs" role="group" aria-label="Filter models by category">
            {categories.map((item) => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a model..." aria-label="Search models" /></label>
        </div>
        <div className="model-grid">
          {filteredModels.map((model, index) => (
            <article className={`model-card ${model.featured ? "featured-card" : ""}`} key={model.title}>
              <div className={`model-art art-${model.style}`}>
                <div className="art-grain" />
                <div className="model-shape" aria-hidden="true">{model.shape}</div>
                <span className="model-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="preview-pill"><span /> 3D PREVIEW</span>
                <button className="quick-view" aria-label={`Preview ${model.title}`} onClick={(event) => { const card = event.currentTarget.closest(".model-card"); card?.classList.toggle("show-details"); }}>↗</button>
                <div className="card-overlay"><strong>{model.title}</strong><span>Preview file will appear here when connected to R2</span></div>
              </div>
              <div className="card-info"><div><span className="card-category">{model.category}</span><h3>{model.title}</h3><p>by {model.creator}</p></div><div className="card-meta"><span>↓ {model.downloads}</span><span>{model.fileSize}</span></div></div>
            </article>
          ))}
          {filteredModels.length === 0 && <div className="empty-state">No models found. Try another search.</div>}
        </div>
        <div className="collection-footer"><span>SHOWING {filteredModels.length} OF {models.length} MODELS</span><span>MORE GOOD THINGS, SOON <b>✳</b></span></div>
      </section>

      <section className="share-section" id="share">
        <div className="share-spark" aria-hidden="true">✳</div>
        <div><div className="eyebrow">MADE SOMETHING?</div><h2>Put it out<br />into the <em>world.</em></h2><p>This gallery will grow with artists like you. We’re getting the studio ready for submissions.</p></div>
        <a className="share-button" href="#gallery">Explore the gallery <span>↗</span></a>
      </section>

      <footer id="about"><a className="brand footer-brand" href="#top"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a><span>A small place for things made in 3D.</span><span>MADE FOR THE LOVE OF MAKING <b>✳</b></span><a href="#top" className="back-top">BACK TO TOP ↑</a></footer>
    </main>
  );
}
