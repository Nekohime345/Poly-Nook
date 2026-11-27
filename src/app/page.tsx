"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";

type Model = {
  id?: string;
  title: string;
  creator: string;
  category: string;
  description?: string;
  createdAt?: string;
  fileSize: string;
  downloads: string;
  style: string;
  shape: string;
  featured?: boolean;
  previewUrl?: string;
  downloadUrl?: string;
};

type ViewerProps = { src: string; alt: string; className?: string; loading?: "lazy"; "camera-controls"?: boolean; "auto-rotate"?: boolean; "shadow-intensity"?: string };
const ModelViewer = "model-viewer" as unknown as ComponentType<ViewerProps>;

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
  const [modelList, setModelList] = useState(models);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/api/google-drive/models", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (mounted && Array.isArray(result?.models) && result.models.length > 0) {
          setModelList(result.models.map((model: Model) => ({ ...model, downloads: "NEW", style: model.category.toLowerCase() })));
        }
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!selectedModel) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedModel(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedModel]);
  const filteredModels = useMemo(() => modelList.filter((model) => {
    const matchesCategory = category === "Everything" || model.category === category;
    const matchesQuery = `${model.title} ${model.creator} ${model.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query, modelList]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Poly Nook home"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a>
        <nav className="top-links" aria-label="Main navigation"><a href="#gallery">Explore</a><a href="#about">About</a></nav>
        <a className="submit-button" href="/submit">Share a model <span aria-hidden="true">↗</span></a>
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
            <article className={`model-card ${model.featured ? "featured-card" : ""}`} key={model.id ?? model.title}>
              <div className={`model-art art-${model.style}`}>
                <div className="art-grain" />
                {model.previewUrl ? <ModelViewer className="model-viewer" src={model.previewUrl} alt={`Interactive 3D preview of ${model.title}`} camera-controls auto-rotate loading="lazy" shadow-intensity="0.8" /> : <div className="model-shape" aria-hidden="true">{model.shape}</div>}
                <span className="model-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="preview-pill"><span /> 3D PREVIEW</span>
                <button className="quick-view" aria-label={`View details for ${model.title}`} onClick={() => setSelectedModel(model)}>↗</button>
                <div className="card-overlay"><strong>{model.title}</strong><span>by {model.creator}</span><span>Open the details panel for files and description</span></div>
              </div>
              <div className="card-info"><div><span className="card-category">{model.category}</span><h3>{model.title}</h3><p>by {model.creator}</p></div><div className="card-meta"><span>↓ {model.downloads}</span><span>{model.fileSize}</span><button className="view-details-button" onClick={() => setSelectedModel(model)}>View details ↗</button></div></div>
            </article>
          ))}
          {filteredModels.length === 0 && <div className="empty-state">No models found. Try another search.</div>}
        </div>
        <div className="collection-footer"><span>SHOWING {filteredModels.length} OF {modelList.length} MODELS</span><span>MORE GOOD THINGS, SOON <b>✳</b></span></div>
      </section>

      <section className="share-section" id="share">
        <div className="share-spark" aria-hidden="true">✳</div>
        <div><div className="eyebrow">MADE SOMETHING?</div><h2>Put it out<br />into the <em>world.</em></h2><p>This gallery will grow with artists like you. We’re getting the studio ready for submissions.</p></div>
        <a className="share-button" href="/submit">Submit a model <span>↗</span></a>
      </section>

      <footer id="about"><a className="brand footer-brand" href="#top"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a><span>A small place for things made in 3D.</span><span>MADE FOR THE LOVE OF MAKING <b>✳</b></span><a href="#top" className="back-top">BACK TO TOP ↑</a></footer>
      {selectedModel && <div className="model-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedModel(null); }}>
        <section className="model-dialog" role="dialog" aria-modal="true" aria-labelledby="model-dialog-title">
          <button className="model-dialog-close" aria-label="Close model details" onClick={() => setSelectedModel(null)}>×</button>
          <div className={`model-dialog-preview art-${selectedModel.style}`}>
            {selectedModel.previewUrl ? <ModelViewer className="model-viewer" src={selectedModel.previewUrl} alt={`Interactive 3D preview of ${selectedModel.title}`} camera-controls auto-rotate shadow-intensity="0.8" /> : <div className="model-shape" aria-hidden="true">{selectedModel.shape}</div>}
          </div>
          <div className="model-dialog-content">
            <div className="eyebrow"><span className="eyebrow-dot" /> {selectedModel.category}</div>
            <h2 id="model-dialog-title">{selectedModel.title}</h2>
            <p className="model-dialog-creator">Made by {selectedModel.creator}</p>
            <p className="model-dialog-description">{selectedModel.description?.trim() || "No description was added for this model."}</p>
            <dl className="model-dialog-facts">
              <div><dt>Category</dt><dd>{selectedModel.category}</dd></div>
              <div><dt>Project file</dt><dd>{selectedModel.downloadUrl ? ".blend" : "Not available"}</dd></div>
              <div><dt>File size</dt><dd>{selectedModel.fileSize || "Not listed"}</dd></div>
              {selectedModel.createdAt && <div><dt>Added</dt><dd>{new Date(selectedModel.createdAt).toLocaleDateString()}</dd></div>}
              <div><dt>Web preview</dt><dd>{selectedModel.previewUrl ? "Interactive GLB" : "No preview file"}</dd></div>
            </dl>
            {selectedModel.downloadUrl ? <a className="model-download-button" href={selectedModel.downloadUrl}>Download Blender file <span>↓</span></a> : <button className="model-download-button unavailable" disabled>Blender file unavailable</button>}
          </div>
        </section>
      </div>}
    </main>
  );
}
