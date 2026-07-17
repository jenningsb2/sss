(() => {
  const OPEN_MS = 420;
  const CLOSE_MS = 480;
  const OPEN_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const CLOSE_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
  let active = null;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function lightboxable(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    if (!img.src) return false;
    if (img.closest(".lightbox")) return false;
    return Boolean(
      img.closest(".screenshots") ||
      img.closest(".device") ||
      img.classList.contains("screenshot-hero")
    );
  }

  function sourceRadius(img) {
    const screen = img.closest(".device-screen");
    if (screen) {
      return getComputedStyle(screen).borderRadius || "1.3rem";
    }
    return getComputedStyle(img).borderRadius || "0.75rem";
  }

  function targetSize(img, rect) {
    const naturalW = img.naturalWidth || rect.width;
    const naturalH = img.naturalHeight || rect.height;
    const maxW = Math.min(window.innerWidth * 0.9, naturalW);
    const maxH = Math.min(window.innerHeight * 0.9, naturalH);
    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
    const width = naturalW * scale;
    const height = naturalH * scale;
    return {
      width,
      height,
      left: (window.innerWidth - width) / 2,
      top: (window.innerHeight - height) / 2,
    };
  }

  function flipFromRect(rect, target) {
    const sx = rect.width / target.width;
    const sy = rect.height / target.height;
    const dx = rect.left - target.left;
    const dy = rect.top - target.top;
    return { sx, sy, dx, dy };
  }

  function open(img) {
    if (active || !lightboxable(img)) return;

    const rect = img.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;

    const reduced = prefersReducedMotion();
    const radius = sourceRadius(img);
    const target = targetSize(img, rect);
    const flip = flipFromRect(rect, target);

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

    Object.assign(clone.style, {
      position: "fixed",
      left: `${target.left}px`,
      top: `${target.top}px`,
      width: `${target.width}px`,
      height: `${target.height}px`,
      margin: "0",
      maxWidth: "none",
      borderRadius: radius,
      objectFit: "cover",
      objectPosition: "center",
      transformOrigin: "top left",
      transform: reduced
        ? "none"
        : `translate(${flip.dx}px, ${flip.dy}px) scale(${flip.sx}, ${flip.sy})`,
      transition: "none",
      willChange: "transform, border-radius",
      zIndex: "1",
      cursor: "zoom-out",
    });

    overlay.appendChild(clone);
    document.body.appendChild(overlay);
    img.classList.add("lightbox-source");
    document.body.classList.add("lightbox-open");

    const state = {
      img,
      overlay,
      clone,
      target,
      radius,
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

    if (reduced) {
      overlay.classList.add("is-open");
      return;
    }

    // Double rAF so the browser paints the start transform before easing open.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!active || active.closing) return;
        overlay.classList.add("is-open");
        clone.style.transition = `transform ${OPEN_MS}ms ${OPEN_EASE}, border-radius ${OPEN_MS}ms ${OPEN_EASE}`;
        clone.style.transform = "translate(0px, 0px) scale(1, 1)";
        clone.style.borderRadius = "0.75rem";
      });
    });
  }

  function close() {
    if (!active || active.closing) return;
    active.closing = true;

    const { img, overlay, clone, target, radius, onKey } = active;
    const reduced = prefersReducedMotion();

    const live = img.getBoundingClientRect();
    const end =
      live.width > 0
        ? live
        : {
            left: target.left,
            top: target.top,
            width: target.width,
            height: target.height,
          };
    const flip = flipFromRect(end, {
      left: target.left,
      top: target.top,
      width: parseFloat(clone.style.width) || target.width,
      height: parseFloat(clone.style.height) || target.height,
    });

    const finish = () => {
      // Reveal the source under the clone first so the device frame is never empty.
      img.classList.remove("lightbox-source");
      // Wait two frames for the source pixels to paint, then drop the clone.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.remove();
          document.body.classList.remove("lightbox-open");
          document.removeEventListener("keydown", onKey);
          active = null;
        });
      });
    };

    if (reduced) {
      finish();
      return;
    }

    // Keep the dimmed/blurred backdrop solid until the image is seated again.
    // Fading it mid-flight exposes the empty black device screen behind it.
    overlay.classList.add("is-closing");

    clone.style.transition = `transform ${CLOSE_MS}ms ${CLOSE_EASE}, border-radius ${CLOSE_MS}ms ${CLOSE_EASE}, box-shadow ${CLOSE_MS}ms ${CLOSE_EASE}`;
    void clone.offsetWidth;
    clone.style.transform = `translate(${flip.dx}px, ${flip.dy}px) scale(${flip.sx}, ${flip.sy})`;
    clone.style.borderRadius = radius;
    clone.style.boxShadow = "none";

    let done = false;
    const once = (e) => {
      if (e && e.propertyName && e.propertyName !== "transform") return;
      if (e && e.target !== clone) return;
      if (done) return;
      done = true;
      clone.removeEventListener("transitionend", once);
      finish();
    };
    clone.addEventListener("transitionend", once);
    window.setTimeout(() => once(), CLOSE_MS + 120);
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
