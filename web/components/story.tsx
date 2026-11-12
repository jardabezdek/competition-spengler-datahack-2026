import { stories, type Story } from "@/lib/game";

export function MatchStory({ kind, story = stories[kind] }: { kind: "report" | "preview"; story?: Story }) {
  return (
    <article className="story">
      <h2>{story.title}</h2>
      {story.paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>
        <a href={story.href} target="_blank" rel="noreferrer">
          {story.linkLabel}
        </a>
      </p>
    </article>
  );
}
