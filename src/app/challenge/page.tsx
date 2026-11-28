"use client";

import { useEffect, useState } from "react";

type Challenge = {
  challengeDate: string;
  title: string;
  prompt: string;
  rules: string[];
  inspiration?: string;
  createdAt?: string | null;
};

type ChallengeSubmission = {
  id: string;
  title: string;
  creator: string;
  category: string;
  description?: string;
  sourceFileId: string;
  previewFileId?: string;
  submittedAt?: string | null;
};

export default function ChallengePage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/challenges/today", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/challenges/today/submissions", { cache: "no-store" }).then((response) => response.json()),
    ]).then(([challengeResult, submissionResult]) => {
      if (!active) return;
      if (challengeResult.error) setError(challengeResult.error);
      setChallenge(challengeResult.challenge ?? null);
      setSubmissions(Array.isArray(submissionResult.submissions) ? submissionResult.submissions : []);
    }).catch(() => {
      if (active) setError("Could not load today’s challenge. Please try again later.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="challenge-page">
      <header className="topbar submit-topbar">
        <a className="brand" href="/" aria-label="Poly Nook home"><span className="brand-mark">p</span>poly nook<span className="brand-period">.</span></a>
        <a className="submit-back" href="/">Back to gallery <span aria-hidden="true">↗</span></a>
      </header>
      <section className="challenge-content">
        <div className="eyebrow"><span className="eyebrow-dot" /> THE DAILY BLENDER CHALLENGE</div>
        {loading ? <div className="challenge-empty"><h1>Checking the <em>prompt…</em></h1><p>Looking for today’s challenge.</p></div> : challenge ? <>
          <p className="challenge-date">{new Date(`${challenge.challengeDate}T12:00:00+08:00`).toLocaleDateString(undefined, { timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <h1>{challenge.title}</h1>
          <div className="challenge-prompt"><p>{challenge.prompt}</p>{challenge.inspiration && <p className="challenge-inspiration">{challenge.inspiration}</p>}</div>
          {challenge.rules.length > 0 && <section className="challenge-rules"><h2>Challenge rules</h2><ul>{challenge.rules.map((rule, index) => <li key={`${index}-${rule}`}>{rule}</li>)}</ul></section>}
          <a className="share-button challenge-submit-link" href={`/submit?challengeDate=${encodeURIComponent(challenge.challengeDate)}`}>Submit your model <span aria-hidden="true">↗</span></a>
          <section className="challenge-entries">
            <div className="eyebrow muted-eyebrow">COMMUNITY BUILDS <span>—</span> {String(submissions.length).padStart(2, "0")}</div>
            <h2>Made for this <em>challenge.</em></h2>
            {submissions.length === 0 ? <p className="challenge-empty-note">No submissions yet. Be the first to share a model.</p> : <div className="challenge-submission-list">
              {submissions.map((submission) => <article className="challenge-submission" key={submission.id}>
                <div><span className="card-category">{submission.category}</span><h3>{submission.title}</h3><p>by {submission.creator}</p>{submission.description && <p className="challenge-submission-description">{submission.description}</p>}</div>
                <div className="challenge-submission-actions">{submission.previewFileId && <a href={`/api/google-drive/file/${encodeURIComponent(submission.previewFileId)}`} target="_blank" rel="noreferrer">Preview GLB</a>}<a className="model-download-button" href={`/api/google-drive/file/${encodeURIComponent(submission.sourceFileId)}?download=1`}>Download .blend <span>↓</span></a></div>
              </article>)}
            </div>}
          </section>
        </> : <div className="challenge-empty"><h1>Today’s prompt is <em>on its way.</em></h1><p>{error || "Check the Discord announcement again soon."}</p></div>}
      </section>
    </main>
  );
}
