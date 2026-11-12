"use client";

import { createContext, useContext, useRef, type ReactNode, type Ref } from "react";
import { IconButton } from "@/components/redesign/icon-button";

/** True when the game center runs on the synthetic dataset instead of the organisers' tracking data. */
export const SyntheticData = createContext(false);

const real = ["Teams and lineups", "Final score", "Goals, scorers and assists", "Penalties"];

const simulated = [
  "Player and puck movement in the goal replays",
  "Shots, expected goals and saves",
  "Faceoffs, takeaways and giveaways",
  "Ice time, shifts, zone entries and exits",
];

function AboutDataDialog({ ref }: { ref: Ref<HTMLDialogElement> }) {
  return (
    <dialog
      ref={ref}
      className="rd-about"
      aria-labelledby="rd-about-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <div className="rd-about-panel">
        <header className="rd-about-head">
          <h2 id="rd-about-title">About the data</h2>
          <form method="dialog">
            <IconButton icon="close" label="Close" type="submit" />
          </form>
        </header>
        <p className="rd-about-lead">
          The tracking data of the final is confidential, so this game center runs on a simulated match. The simulation
          replays the public facts of the game and makes up everything in between.
        </p>
        <div className="rd-about-lists">
          <section>
            <h3>Real</h3>
            <ul>
              {real.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Simulated</h3>
            <ul>
              {simulated.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}

function AboutDataButton({ className, children }: { className: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" onClick={() => dialog.current!.showModal()}>
        {children}
      </button>
      <AboutDataDialog ref={dialog} />
    </>
  );
}

/** Line in the view bar that says the page runs on synthetic data, with a link to the explanation. */
export function DataNotice() {
  return (
    <div className="rd-data-notice">
      <span className="rd-data-notice-full">This page shows synthetic data.</span>
      <span className="rd-data-notice-short">Synthetic data.</span>
      <AboutDataButton className="rd-data-notice-link">What&apos;s real?</AboutDataButton>
    </div>
  );
}

/** Tag for a card whose numbers come from the simulation; opens the same explanation. */
export function SimulatedTag() {
  if (!useContext(SyntheticData)) return null;
  return <AboutDataButton className="rd-kicker rd-sim-tag">Simulated</AboutDataButton>;
}
