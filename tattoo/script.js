(function () {
  "use strict";

  /* Active nav */
  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!path || path === "") path = "index.html";
  document.querySelectorAll("[data-nav] a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path || (path === "index.html" && href === "./")) {
      a.classList.add("is-active");
    }
  });

  /* Mobile menu */
  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("is-open", !open);
    });
  }

  /* Reveal */
  var nodes = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  } else {
    nodes.forEach(function (n) {
      n.classList.add("is-in");
    });
  }

  /* FAQ */
  document.querySelectorAll(".faq-q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      if (!item) return;
      var open = item.classList.contains("is-open");
      item.parentElement.querySelectorAll(".faq-item").forEach(function (el) {
        el.classList.remove("is-open");
      });
      if (!open) item.classList.add("is-open");
    });
  });

  /* Portfolio filters */
  var filterRoot = document.querySelector("[data-filters]");
  if (filterRoot) {
    var works = document.querySelectorAll("[data-work]");
    filterRoot.querySelectorAll(".filter-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterRoot.querySelectorAll(".filter-btn").forEach(function (b) {
          b.classList.remove("is-active");
        });
        btn.classList.add("is-active");
        var cat = btn.getAttribute("data-filter") || "all";
        works.forEach(function (w) {
          var match = cat === "all" || w.getAttribute("data-work") === cat;
          w.hidden = !match;
        });
      });
    });
  }

  /* About tabs */
  var tabs = document.querySelector("[data-tabs]");
  if (tabs) {
    var buttons = tabs.querySelectorAll(".tab");
    var panels = document.querySelectorAll("[data-tab-panel]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-tab");
        buttons.forEach(function (b) {
          b.classList.toggle("is-active", b === btn);
        });
        panels.forEach(function (p) {
          p.hidden = p.getAttribute("data-tab-panel") !== id;
        });
      });
    });
  }

  /* Booking modal */
  var modal = document.getElementById("book-modal");
  var form = document.getElementById("book-form");
  var ok = document.getElementById("book-ok");

  function openModal() {
    if (!modal) return;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (ok) ok.hidden = true;
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-book-open]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
    });
  });

  document.querySelectorAll("[data-book-close]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  if (modal) {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        name: (form.name && form.name.value) || "",
        phone: (form.phone && form.phone.value) || "",
        service: (form.service && form.service.value) || "",
        comment: (form.comment && form.comment.value) || "",
        createdAt: new Date().toISOString()
      };
      try {
        var key = "chernila_bookings";
        var list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(data);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (err) {
        /* ignore */
      }
      if (ok) ok.hidden = false;
      form.reset();
    });
  }
})();
