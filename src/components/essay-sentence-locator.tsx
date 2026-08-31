"use client";

import { useEffect } from "react";

const sentenceHashPattern = /^#sentence-\d+-\d+$/;
const locatingClass = "essay-sentence-locating";

export function EssaySentenceLocator() {
  useEffect(() => {
    let retryTimer: number | undefined;
    let highlightTimer: number | undefined;
    let attempts = 0;

    const locateSentence = () => {
      if (!sentenceHashPattern.test(window.location.hash)) return;
      const target = document.getElementById(window.location.hash.slice(1));
      if (!target) {
        if (attempts < 10) {
          attempts += 1;
          retryTimer = window.setTimeout(locateSentence, 80);
        }
        return;
      }

      target.scrollIntoView({ block: "center", behavior: "auto" });
      target.classList.remove(locatingClass);
      void target.getBoundingClientRect();
      target.classList.add(locatingClass);
      window.clearTimeout(highlightTimer);
      highlightTimer = window.setTimeout(() => target.classList.remove(locatingClass), 2800);
    };

    const startLocating = () => {
      attempts = 0;
      window.clearTimeout(retryTimer);
      window.requestAnimationFrame(locateSentence);
    };

    startLocating();
    window.addEventListener("hashchange", startLocating);
    window.addEventListener("pageshow", startLocating);

    return () => {
      window.removeEventListener("hashchange", startLocating);
      window.removeEventListener("pageshow", startLocating);
      window.clearTimeout(retryTimer);
      window.clearTimeout(highlightTimer);
    };
  }, []);

  return null;
}
