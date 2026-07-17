(() => {
  const DURATION = 320;
  const EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  let active = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function lightboxable(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (!img.src) return false;
    if (img.closest(".lightbox")) return false;
    // Screenshots in the grid or full-width hero shots
    return Boolean(img.closest(".screenshots") || img.classList.contains("screenshot-hero"));
  }

  function open(img) {
    if (active || !lightboxable(img)) return;

    const rect = img.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;

    const reduced = prefersReducedMotion();
    const overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", img.alt || "Expanded image");

    const clone = document.createElement("img");
    clone.src = img.currentSrc || img.src;
    clone.alt = img.alt || "";
    clone.className = "lightbox-image";
    clone.draggable = false;

    const naturalW = img.naturalWidth || rect.width;
    const naturalH = img.naturalHeight || rect.height;
    const maxW = Math.min(window.innerWidth * 0.92, naturalW);
    const maxH = Math.min(window.innerHeight * 0.92, naturalH);
    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
    const targetW = naturalW * scale;
    const targetH = naturalH * scale;
    const targetLeft = (window.innerWidth - targetW) / 2;
    const targetTop = (window.innerHeight - targetH) / 2;

    Object.assign(clone.style, {
      position: "fixed",
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      maxWidth: "none",
      borderRadius: getComputedStyle(img).borderRadius || "0.75rem",
      objectFit: getComputedStyle(img).objectFit || "contain",
      zIndex: "1",
      cursor: "zoom-out",
      transition: reduced ? "none" : `left ${DURATION}ms ${EASING}, top ${DURATION}ms ${EASING}, width ${DURATION}ms ${EASING}, height ${DURATION}ms ${EASING}, border-radius ${DURATION}ms ${EASING}`,
    });

    overlay.appendChild(clone);
    document.body.appendChild(overlay);
    img.classList.add("lightbox-source");
    document.body.classList.add("lightbox-open");

    requestAnimationFrame(() => {
      overlay.classList.add("is-open");
      Object.assign(clone.style, {
        left: `${targetLeft}px`,
        top: `${targetTop}px`,
        width: `${targetW}px`,
        height: `${targetH}px`,
        borderRadius: "0.75rem",
      });
    });

    const state = {
      img,
      overlay,
      clone,
      startRect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: getComputedStyle(img).borderRadius || "0.75rem",
      },
      closing: false,
    };
    active = state;

    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onOverlayClick = (e) => {
      if (e.target === overlay || e.target === clone) close();
    };

    overlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKey);
    state.onKey = onKey;
  }

  function close() {
    if (!active || active.closing) return;
    active.closing = true;

    const { img, overlay, clone, startRect, onKey } = active;
    const reduced = prefersReducedMotion();
    const live = img.getBoundingClientRect();
    const end = live.width > 0
      ? {
          left: live.left,
          top: live.top,
          width: live.width,
          height: live.height,
        }
      : startRect;

    overlay.classList.remove("is-open");
    Object.assign(clone.style, {
      left: `${end.left}px`,
      top: `${end.top}px`,
      width: `${end.width}px`,
      height: `${end.height}px`,
      borderRadius: startRect.borderRadius,
      transition: reduced ? "none" : `left ${DURATION}ms ${EASING}, top ${DURATION}ms ${EASING}, width ${DURATION}ms ${EASING}, height ${DURATION}ms ${EASING}, border-radius ${DURATION}ms ${EASING}`,
    });

    const finish = () => {
      overlay.remove();
      img.classList.remove("lightbox-source");
      document.body.classList.remove("lightbox-open");
      document.removeEventListener("keydown", onKey);
      active = null;
    };

    if (reduced) {
      finish();
      return;
    }

    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      finish();
    };
    clone.addEventListener("transitionend", once);
    window.setTimeout(once, DURATION + 80);
  }

  document.addEventListener("click", (e) => {
    const img = e.target.closest("img");
    if (!img || !lightboxable(img)) return;
    e.preventDefault();
    open(img);
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const img = e.target.closest("img");
        if (!img || !lightboxable(img)) return;
        e.preventDefault();
        open(img);
      }
    },
    true
  );

  window.addEventListener("resize", () => {
    if (active) close();
  });

  function markInteractive() {
    document.querySelectorAll("img").forEach((img) => {
      if (!lightboxable(img)) return;
      img.classList.add("lightbox-target");
      if (!img.hasAttribute("tabindex")) img.tabIndex = 0;
      if (!img.hasAttribute("role")) img.setAttribute("role", "button");
      if (!img.getAttribute("aria-label") && img.alt) {
        img.setAttribute("aria-label", `View larger: ${img.alt}`);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markInteractive);
  } else {
    markInteractive();
  }
})();
