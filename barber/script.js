(() => {
  "use strict";

  /* ── Shared footer (править только footer.html) ─────── */
  const footerHost = document.getElementById("site-footer");
  if (footerHost) {
    fetch("footer.html")
      .then((r) => {
        if (!r.ok) throw new Error("footer fetch failed");
        return r.text();
      })
      .then((html) => {
        footerHost.outerHTML = html;
      })
      .catch(() => {
        footerHost.innerHTML =
          '<p class="footer__copy" style="padding:24px;text-align:center">Откройте сайт через локальный сервер или GitHub Pages — футер подгружается из footer.html</p>';
      });
  }

  /* ── Burger menu ───────────────────────────────────── */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      document.body.style.overflow = open ? "" : "hidden";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });
  }

  /* ── Active nav item ───────────────────────────────── */
  const page = (document.body.dataset.page || "").trim();
  if (page) {
    document.querySelectorAll(".nav a[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) link.classList.add("is-active");
    });
  }

  /* ── Smooth scroll for same-page anchors ───────────── */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ── Reveal on scroll ──────────────────────────────── */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ── Gallery filters ───────────────────────────────── */
  const filterBtns = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter;

        filterBtns.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        galleryItems.forEach((item) => {
          const cat = item.dataset.category;
          const show = filter === "all" || cat === filter;
          item.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* ── Gallery lightbox ──────────────────────────────── */
  const lbItems = document.querySelectorAll(".gallery-item img");
  if (lbItems.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Просмотр фото");
    lb.hidden = true;
    lb.innerHTML =
      '<button type="button" class="lightbox__close" aria-label="Закрыть">×</button>' +
      '<img class="lightbox__img" alt="" />';
    document.body.appendChild(lb);

    const lbImg = lb.querySelector(".lightbox__img");
    const lbClose = lb.querySelector(".lightbox__close");

    const openLb = (img) => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    const closeLb = () => {
      lb.hidden = true;
      lbImg.src = "";
      document.body.style.overflow = "";
    };

    lbItems.forEach((img) => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", () => openLb(img));
      img.setAttribute("tabindex", "0");
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLb(img);
        }
      });
    });

    lbClose.addEventListener("click", closeLb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb) closeLb();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lb.hidden) closeLb();
    });
  }
})();
