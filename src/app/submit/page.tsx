"use client";

import { FormEvent, useState } from "react";

type UploadResult = { id: string };

export default function SubmitPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function uploadFile(file: File, form: FormData, submissionId: string, role: "source" | "preview") {
    const sessionResponse = await fetch("/api/google-drive/upload-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionCode: form.get("submissionCode"),
        filename: file.name,
        size: file.size,
        title: form.get("title"),
        creator: form.get("creator"),
        category: form.get("category"),
        description: form.get("description"),
        submissionId,
        role,
      }),
    });
    const session = await sessionResponse.json();
    if (!sessionResponse.ok) throw new Error(session.error ?? "Could not start the upload.");

    const chunkSize = 4 * 1024 * 1024;
    let uploaded: UploadResult | undefined;
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      const chunkResponse = await fetch("/api/google-drive/upload-chunk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
          "X-Poly-Nook-Upload-Url": session.uploadUrl,
          "X-Poly-Nook-Submission-Code": String(form.get("submissionCode") ?? ""),
        },
        body: file.slice(start, end),
      });
      const chunkResult: { complete?: boolean; id?: string; error?: string } = await chunkResponse.json().catch(() => ({}));
      if (!chunkResponse.ok) throw new Error(chunkResult.error ?? "Drive could not finish this file upload. Try again.");
      if (chunkResult.complete && chunkResult.id) uploaded = { id: chunkResult.id };
    }
    if (!uploaded) throw new Error("Drive did not confirm that the file finished uploading. Please try again.");

    const publishResponse = await fetch("/api/google-drive/publish-file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionCode: form.get("submissionCode"), fileId: uploaded.id }),
    });
    const published = await publishResponse.json();
    if (!publishResponse.ok) throw new Error(published.error ?? "The file uploaded, but could not be published.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const source = form.get("sourceFile");
    const preview = form.get("previewFile");
    if (!(source instanceof File) || source.size === 0) return setMessage("Choose a .blend file to submit.");
    if (!source.name.toLowerCase().endsWith(".blend")) return setMessage("The downloadable file must end in .blend.");
    if (source.size > 1024 * 1024 * 1024) return setMessage("The .blend file must be smaller than 1 GB.");
    if (preview instanceof File && preview.size > 0 && !preview.name.toLowerCase().endsWith(".glb")) return setMessage("The preview file must end in .glb.");
    if (preview instanceof File && preview.size > 1024 * 1024 * 1024) return setMessage("The .glb preview must be smaller than 1 GB.");

    setBusy(true);
    setMessage("Uploading your Blender file to Poly Nook Drive… keep this page open.");
    const submissionId = crypto.randomUUID();
    try {
      await uploadFile(source, form, submissionId, "source");
      if (preview instanceof File && preview.size > 0) {
        setMessage("Blender file uploaded. Uploading the GLB preview…");
        await uploadFile(preview, form, submissionId, "preview");
      }
      setMessage("Your model is uploaded and published in the gallery. Thank you for sharing!");
      formElement.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="submit-page">
      <header className="topbar submit-topbar">
        <a className="brand" href="/" aria-label="Poly Nook home"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a>
        <a className="submit-back" href="/">Back to gallery <span>↗</span></a>
      </header>
      <section className="submit-wrap">
        <div className="eyebrow"><span className="eyebrow-dot" /> SHARE YOUR WORK</div>
        <h1>Give your model<br />a little <em>nook.</em></h1>
        <p className="submit-intro">Add a .blend download and, if you have one, a .glb preview. The files upload straight to Poly Nook’s Drive.</p>
        <form className="submission-form" onSubmit={handleSubmit}>
          <label>Model title<input name="title" maxLength={100} required placeholder="e.g. Little greenhouse" /></label>
          <div className="submit-row">
            <label>Your name<input name="creator" maxLength={80} required placeholder="Name or handle" /></label>
            <label>Category<select name="category" defaultValue="Objects"><option>Objects</option><option>Characters</option><option>Scenes</option><option>Other</option></select></label>
          </div>
          <label>About this model <span className="optional">OPTIONAL</span><textarea name="description" maxLength={500} rows={3} placeholder="A few words about how you made it…" /></label>
          <label className="file-picker">Blender project <span className="required-note">REQUIRED · .BLEND · UP TO 1 GB</span><input name="sourceFile" type="file" accept=".blend" required /></label>
          <label className="file-picker">Web preview <span className="optional">OPTIONAL · .GLB · UP TO 1 GB</span><input name="previewFile" type="file" accept=".glb" /></label>
          <label>Friend invite code<input name="submissionCode" type="password" autoComplete="off" required placeholder="Ask the Poly Nook host" /></label>
          <button className="submission-submit" type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload and publish"}<span>↗</span></button>
          <p className="submission-status" aria-live="polite">{message}</p>
          <p className="submission-footnote">Submissions publish automatically. The gallery is visible to anyone with the site link.</p>
        </form>
      </section>
    </main>
  );
}
