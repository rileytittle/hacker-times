"use client";

import { useEffect, useRef } from "react";

/**
 * Progressive enhancement for the server-rendered comment tree:
 * - click a thread rail or "hide" to collapse a comment + its replies
 * - keyboard: j/k next/prev comment, n/p next/prev thread, x collapse
 * - highlights comments posted since your last visit (localStorage)
 */
export function ThreadControls({ storyId, total }: { storyId: number; total: number }) {
  const newRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const thread = document.querySelector<HTMLElement>("[data-thread]");
    if (!thread) return;

    // --- New since last visit -------------------------------------------
    const key = `ht:lastVisit:${storyId}`;
    let lastVisit: number | null = null;
    try {
      const stored = localStorage.getItem(key);
      lastVisit = stored ? Number(stored) : null;
      localStorage.setItem(key, String(Math.floor(Date.now() / 1000)));
    } catch {
      // Storage unavailable (private mode etc.): skip the feature.
    }
    if (lastVisit) {
      let count = 0;
      for (const el of thread.querySelectorAll<HTMLElement>("[data-comment]")) {
        if (Number(el.dataset.time) > lastVisit) {
          el.classList.add("is-new");
          count++;
        }
      }
      if (newRef.current && count > 0) {
        newRef.current.textContent = `${count} new since your last visit`;
        newRef.current.hidden = false;
      }
    }

    // --- Collapse ---------------------------------------------------------
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement).closest('[data-action="toggle"]');
      const comment = trigger?.closest<HTMLElement>("[data-comment]");
      if (!comment) return;
      e.preventDefault();
      toggle(comment);
    };
    thread.addEventListener("click", onClick);

    // --- Keyboard navigation ---------------------------------------------
    let current: HTMLElement | null = null;
    const setCurrent = (el: HTMLElement | undefined) => {
      if (!el) return;
      current?.classList.remove("is-current");
      current = el;
      el.classList.add("is-current");
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    const visible = (selector: string) =>
      [...thread.querySelectorAll<HTMLElement>(selector)].filter((el) => el.offsetParent !== null);
    const step = (selector: string, dir: 1 | -1) => {
      const list = visible(selector);
      if (list.length === 0) return;
      // When stepping by thread, measure from the current comment's root.
      const anchor =
        current && selector === ".comment--root" ? current.closest<HTMLElement>(".comment--root") : current;
      let idx = anchor ? list.indexOf(anchor) : -1;
      if (idx === -1) {
        // Nothing selected (or it got hidden): start from the top of the viewport.
        const firstBelow = list.findIndex((el) => el.getBoundingClientRect().top >= 1);
        const base = firstBelow === -1 ? list.length : firstBelow;
        idx = dir === 1 ? base - 1 : base;
      }
      setCurrent(list[Math.min(Math.max(idx + dir, 0), list.length - 1)]);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      switch (e.key) {
        case "j":
          return step("[data-comment]", 1);
        case "k":
          return step("[data-comment]", -1);
        case "n":
          return step(".comment--root", 1);
        case "p":
          return step(".comment--root", -1);
        case "x":
          if (current) toggle(current);
          return;
      }
    };
    document.addEventListener("keydown", onKey);

    return () => {
      thread.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [storyId]);

  const setAll = (collapsed: boolean) => {
    document.querySelectorAll<HTMLElement>(".comment--root").forEach((el) => toggle(el, collapsed, false));
  };

  return (
    <div className="thread-toolbar">
      <div className="thread-toolbar__row">
        <h2 className="thread-toolbar__title">
          {total.toLocaleString("en-US")} {total === 1 ? "comment" : "comments"}
        </h2>
        <span ref={newRef} className="thread-toolbar__new" hidden />
        <div className="thread-toolbar__actions">
          <button type="button" onClick={() => setAll(true)}>
            Collapse all
          </button>
          <button type="button" onClick={() => setAll(false)}>
            Expand all
          </button>
          <a href={`https://news.ycombinator.com/item?id=${storyId}`} target="_blank" rel="noopener noreferrer">
            Reply on HN ↗
          </a>
        </div>
      </div>
      <p className="thread-toolbar__keys">
        <kbd>j</kbd> <kbd>k</kbd> next / previous comment · <kbd>n</kbd> <kbd>p</kbd> next / previous thread ·{" "}
        <kbd>x</kbd> collapse
      </p>
    </div>
  );
}

function toggle(comment: HTMLElement, collapse?: boolean, keepInView = true) {
  const next = collapse ?? !comment.classList.contains("is-collapsed");
  comment.classList.toggle("is-collapsed", next);
  comment.querySelector(":scope > .comment__header .comment__toggle")?.setAttribute("aria-expanded", String(!next));
  // After collapsing a long thread you'd otherwise be stranded far below it.
  if (next && keepInView && comment.getBoundingClientRect().top < 0) {
    comment.scrollIntoView({ block: "start" });
  }
}
