export const metadata = {
  title: "Privacy Policy | Poly Nook",
  description: "How Poly Nook handles model submissions and Google Drive data.",
};

export default function PrivacyPage() {
  return (
    <main className="policy-page">
      <header className="topbar submit-topbar">
        <a className="brand" href="/" aria-label="Poly Nook home"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a>
        <a className="submit-back" href="/">Back to gallery <span aria-hidden="true">↗</span></a>
      </header>
      <article className="policy-content">
        <div className="eyebrow"><span className="eyebrow-dot" /> YOUR INFORMATION</div>
        <h1>Privacy <em>policy.</em></h1>
        <p className="policy-updated">Last updated November 27, 2026</p>

        <h2>About Poly Nook</h2>
        <p>Poly Nook is a small gallery for sharing 3D models. The gallery is public, and model submissions are published automatically.</p>

        <h2>Information submitted to the gallery</h2>
        <p>When someone submits a model, Poly Nook stores the name or handle they provide, the model title, category, optional description, and the uploaded Blender project and optional GLB preview. These files and details are stored in the site owner’s Google Drive.</p>
        <p>Published model details, previews, and downloadable files are available to people who visit the gallery. Do not submit personal or confidential information, or files you do not have permission to share.</p>

        <h2>Google Drive access</h2>
        <p>Poly Nook connects to the site owner’s Google Drive using Google’s <code>drive.file</code> permission. The connection is used to create, store, retrieve, and serve model files submitted to the gallery. Poly Nook does not ask submitters to connect their own Google accounts or access their personal Drive files.</p>
        <p>The site owner’s Google OAuth credentials are kept in server-side environment settings and are not included in the public website. Google processes and stores files in accordance with its own privacy terms.</p>

        <h2>Use and sharing</h2>
        <p>Poly Nook uses submission information to display, preview, and provide downloads for models in the gallery. It does not sell this information or use Google Drive data for advertising. Files submitted for publication are shared through the public gallery.</p>

        <h2>Retention and removal</h2>
        <p>Published submissions remain in the site owner’s Drive until the owner removes them. To request removal of a submission, contact the site owner using the support email listed on the Google consent screen.</p>

        <h2>Changes and contact</h2>
        <p>This policy may be updated if Poly Nook’s features or data practices change. The latest version will be available on this page. For privacy questions, contact the site owner using the support email listed on the Google consent screen.</p>
      </article>
    </main>
  );
}
