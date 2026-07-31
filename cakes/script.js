(() => {
  "use strict";

  /* Burger */
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

  /* Active nav */
  const page = (document.body.dataset.page || "").trim();
  if (page) {
    document.querySelectorAll(".nav a[data-nav]").forEach((link) => {
      if (link.dataset.nav === page) link.classList.add("is-active");
    });
  }

  /* Catalog filters */
  const filters = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".cake-card[data-cat]");

  if (filters.length && cards.length) {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const cat = btn.dataset.filter || "all";
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");

        cards.forEach((card) => {
          const cats = (card.dataset.cat || "").split(/\s+/);
          const show = cat === "all" || cats.includes(cat);
          card.classList.toggle("is-hidden", !show);
        });
      });
    });
  }

  /* Reveal on scroll */
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
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Header shadow on scroll */
  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => {
      header.style.boxShadow =
        window.scrollY > 12 ? "0 8px 24px rgba(42,31,26,0.06)" : "none";
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }
})();
