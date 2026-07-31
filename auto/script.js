(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  document.querySelectorAll("[data-accordion]").forEach((root) => {
    root.querySelectorAll(".accordion__item").forEach((item) => {
      const btn = item.querySelector(".accordion__btn");
      if (!btn) return;

      btn.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        root.querySelectorAll(".accordion__item.is-open").forEach((openItem) => {
          if (openItem === item) return;
          openItem.classList.remove("is-open");
          openItem.querySelector(".accordion__btn")?.setAttribute("aria-expanded", "false");
        });

        item.classList.toggle("is-open", !isOpen);
        btn.setAttribute("aria-expanded", String(!isOpen));
      });
    });
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = [...el.parentElement.children];
          const index = siblings.indexOf(el);
          el.style.transitionDelay = `${Math.min(index % 6, 5) * 60}ms`;
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((el) => io.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  }

  const header = document.querySelector(".header");
  if (header) {
    const onScroll = () => {
      header.style.borderBottomColor =
        window.scrollY > 20 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
