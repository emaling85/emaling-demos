(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav-toggle");
  const headerActions = document.querySelector(".header__actions");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      if (headerActions) headerActions.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        if (headerActions) headerActions.classList.remove("is-open");
      });
    });
  }

  /* Reveal */
  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Modals */
  const modals = {
    signin: document.getElementById("modal-signin"),
    signup: document.getElementById("modal-signup"),
    order: document.getElementById("modal-order"),
  };

  function openModal(name) {
    const modal = modals[name];
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add("modal-open");
    const focusable = modal.querySelector("input, select, button");
    focusable?.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    if (![...Object.values(modals)].some((m) => m && !m.hidden)) {
      document.body.classList.remove("modal-open");
    }
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (toggle && nav) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      }
      const name = btn.getAttribute("data-open-modal");
      if (name === "order") {
        const drink = btn.getAttribute("data-drink");
        const label = document.getElementById("order-drink-label");
        const form = document.getElementById("order-form");
        const success = document.getElementById("order-success");
        if (form) form.hidden = false;
        if (success) success.hidden = true;
        const radios = form?.querySelectorAll('input[name="drink"]');
        if (radios?.length) {
          radios.forEach((radio) => {
            radio.checked = drink ? radio.value === drink : radio.value === "Cappuccino";
          });
        }
        if (drink && label) {
          label.textContent = `Ordering: ${drink}`;
        } else if (label) {
          label.textContent = "Choose your favourite coffee";
        }
      } else {
        const modal = modals[name];
        const form = modal?.querySelector(".modal__form");
        const success = modal?.querySelector(".modal__success");
        if (form) form.hidden = false;
        if (success) success.hidden = true;
      }
      openModal(name);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.closest(".modal")));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    Object.values(modals).forEach((m) => {
      if (m && !m.hidden) closeModal(m);
    });
  });

  document.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.hidden = true;
      const success = form.parentElement.querySelector(".modal__success");
      if (success) success.hidden = false;
      form.reset();
    });
  });

  const orderForm = document.getElementById("order-form");
  orderForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!orderForm.checkValidity()) {
      orderForm.reportValidity();
      return;
    }
    const drink =
      orderForm.querySelector('input[name="drink"]:checked')?.value || "Coffee";
    const success = document.getElementById("order-success");
    orderForm.hidden = true;
    if (success) {
      success.hidden = false;
      success.textContent = `Thanks! Your ${drink} order is on the way.`;
    }
    orderForm.reset();
  });

  /* Newsletter */
  const subForm = document.getElementById("subscribe-form");
  const subMsg = document.getElementById("subscribe-msg");
  subForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = subForm.querySelector('input[type="email"]');
    if (!email?.checkValidity()) {
      email?.reportValidity();
      return;
    }
    if (subMsg) {
      subMsg.hidden = false;
      subMsg.textContent = "Thanks for subscribing!";
    }
    subForm.reset();
  });

  /* Testimonials slider */
  const slides = [...document.querySelectorAll(".feedback__slide")];
  let index = 0;

  function showSlide(next) {
    if (!slides.length) return;
    slides[index].classList.remove("is-active");
    index = (next + slides.length) % slides.length;
    slides[index].classList.add("is-active");
  }

  document.querySelector(".feedback__arrow--prev")?.addEventListener("click", () => {
    showSlide(index - 1);
  });
  document.querySelector(".feedback__arrow--next")?.addEventListener("click", () => {
    showSlide(index + 1);
  });
})();
