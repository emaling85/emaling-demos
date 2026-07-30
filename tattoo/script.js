(function () {
  "use strict";

  var path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (!path) path = "index.html";
  document.querySelectorAll("[data-nav] a").forEach(function (a) {
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("is-active");
  });

  var toggle = document.querySelector("[data-nav-toggle]");
  var panel = document.querySelector("[data-nav-panel]");
  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("is-open", !open);
    });
  }

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
          w.hidden = !(cat === "all" || w.getAttribute("data-work") === cat);
        });
      });
    });
  }

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

  /* Remove old static modals — inject unified ones */
  document.querySelectorAll("#book-modal, #cert-modal").forEach(function (el) {
    el.remove();
  });

  var wrap = document.createElement("div");
  wrap.innerHTML =
    '<div class="modal" id="book-modal" hidden>' +
    '<div class="modal-backdrop" data-book-close></div>' +
    '<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="book-title">' +
    '<button type="button" class="modal-close" data-book-close aria-label="Закрыть">×</button>' +
    '<h2 id="book-title">Запись</h2>' +
    "<p>Выберите услугу — рядом ориентир по цене. Перезвоним и уточним время.</p>" +
    '<form id="book-form">' +
    '<div class="form-row"><label for="book-name">Имя</label><input id="book-name" name="name" type="text" required autocomplete="name" /></div>' +
    '<div class="form-row"><label for="book-phone">Телефон</label><input id="book-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+7" /></div>' +
    '<div class="form-row"><span class="field-label">Услуга</span>' +
    '<div class="option-list" role="radiogroup" aria-label="Услуга">' +
    '<label class="option-card is-selected" role="radio" aria-checked="true"><input type="radio" name="service" value="Татуировка · от 3 500 ₽" checked /><strong>Татуировка</strong><span class="opt-desc">Эскиз + сеанс</span><span class="opt-price">от 3 500 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="service" value="Перекрытие · от 5 000 ₽" /><strong>Перекрытие</strong><span class="opt-desc">Закрытие старой работы</span><span class="opt-price">от 5 000 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="service" value="Пирсинг · от 2 000 ₽" /><strong>Пирсинг</strong><span class="opt-desc">Прокол + базовая серьга</span><span class="opt-price">от 2 000 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="service" value="Консультация · бесплатно" /><strong>Консультация</strong><span class="opt-desc">Идея, зона, вилка по цене</span><span class="opt-price">0 ₽</span></label>' +
    "</div></div>" +
    '<div class="form-row"><label for="book-comment">Комментарий</label><textarea id="book-comment" name="comment" rows="2" placeholder="Стиль, зона, мастер, удобные дни"></textarea></div>' +
    '<button class="btn" type="submit">Отправить</button>' +
    '<p class="form-ok" id="book-ok" hidden>Заявка сохранена. В демо — localStorage браузера.</p>' +
    "</form></div></div>" +
    '<div class="modal" id="cert-modal" hidden>' +
    '<div class="modal-backdrop" data-cert-close></div>' +
    '<div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="cert-title">' +
    '<button type="button" class="modal-close" data-cert-close aria-label="Закрыть">×</button>' +
    '<h2 id="cert-title">Сертификат</h2>' +
    "<p>Выберите номинал. Оформим и отправим электронно или выдадим в студии.</p>" +
    '<form id="cert-form">' +
    '<div class="form-row"><label for="cert-name">Ваше имя</label><input id="cert-name" name="name" type="text" required /></div>' +
    '<div class="form-row"><label for="cert-phone">Телефон</label><input id="cert-phone" name="phone" type="tel" required /></div>' +
    '<div class="form-row"><label for="cert-for">Кому</label><input id="cert-for" name="forWhom" type="text" placeholder="Имя получателя (необязательно)" /></div>' +
    '<div class="form-row"><span class="field-label">Номинал</span>' +
    '<div class="option-list" role="radiogroup" aria-label="Номинал">' +
    '<label class="option-card is-selected" role="radio" aria-checked="true"><input type="radio" name="amount" value="5 000 ₽" checked /><strong>5 000 ₽</strong><span class="opt-desc">Мини / консультация+</span><span class="opt-price">5 000 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="amount" value="10 000 ₽" /><strong>10 000 ₽</strong><span class="opt-desc">Средний сеанс</span><span class="opt-price">10 000 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="amount" value="15 000 ₽" /><strong>15 000 ₽</strong><span class="opt-desc">Крупная работа / этап</span><span class="opt-price">15 000 ₽</span></label>' +
    '<label class="option-card" role="radio" aria-checked="false"><input type="radio" name="amount" value="Своя сумма" /><strong>Своя сумма</strong><span class="opt-desc">Укажите в комментарии</span><span class="opt-price">от 3 000 ₽</span></label>' +
    "</div></div>" +
    '<div class="form-row"><label for="cert-comment">Комментарий</label><textarea id="cert-comment" name="comment" rows="2" placeholder="Своя сумма, пожелания к оформлению"></textarea></div>' +
    '<button class="btn" type="submit">Оформить</button>' +
    '<p class="form-ok" id="cert-ok" hidden>Заявка на сертификат сохранена (демо).</p>' +
    "</form></div></div>";
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  function bindOptionCards(root) {
    if (!root) return;
    root.querySelectorAll(".option-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var list = card.closest(".option-list");
        list.querySelectorAll(".option-card").forEach(function (c) {
          c.classList.remove("is-selected");
          c.setAttribute("aria-checked", "false");
        });
        card.classList.add("is-selected");
        card.setAttribute("aria-checked", "true");
        var input = card.querySelector('input[type="radio"]');
        if (input) input.checked = true;
      });
    });
  }

  var bookModal = document.getElementById("book-modal");
  var certModal = document.getElementById("cert-modal");
  var bookForm = document.getElementById("book-form");
  var certForm = document.getElementById("cert-form");
  var bookOk = document.getElementById("book-ok");
  var certOk = document.getElementById("cert-ok");

  bindOptionCards(bookForm);
  bindOptionCards(certForm);

  function openDialog(el) {
    if (!el) return;
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDialog(el) {
    if (!el) return;
    el.hidden = true;
    if (bookModal.hidden && certModal.hidden) document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-book-open]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (bookOk) bookOk.hidden = true;
      openDialog(bookModal);
    });
  });

  document.querySelectorAll("[data-cert-open]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      if (certOk) certOk.hidden = true;
      openDialog(certModal);
    });
  });

  document.querySelectorAll("[data-book-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeDialog(bookModal);
    });
  });

  document.querySelectorAll("[data-cert-close]").forEach(function (el) {
    el.addEventListener("click", function () {
      closeDialog(certModal);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeDialog(bookModal);
    closeDialog(certModal);
  });

  function saveBooking(data) {
    try {
      var key = "chernila_bookings";
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(data);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (err) {
      /* ignore */
    }
  }

  function resetOptions(form) {
    form.querySelectorAll(".option-card").forEach(function (c, i) {
      c.classList.toggle("is-selected", i === 0);
      c.setAttribute("aria-checked", i === 0 ? "true" : "false");
      var r = c.querySelector("input");
      if (r) r.checked = i === 0;
    });
  }

  if (bookForm) {
    bookForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var service =
        (bookForm.querySelector('input[name="service"]:checked') || {}).value ||
        "";
      saveBooking({
        type: "booking",
        name: (bookForm.querySelector('[name="name"]') || {}).value || "",
        phone: (bookForm.querySelector('[name="phone"]') || {}).value || "",
        service: service,
        comment: (bookForm.querySelector('[name="comment"]') || {}).value || "",
        createdAt: new Date().toISOString()
      });
      if (bookOk) bookOk.hidden = false;
      bookForm.reset();
      resetOptions(bookForm);
    });
  }

  if (certForm) {
    certForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var amount =
        (certForm.querySelector('input[name="amount"]:checked') || {}).value ||
        "";
      saveBooking({
        type: "certificate",
        name: (certForm.querySelector('[name="name"]') || {}).value || "",
        phone: (certForm.querySelector('[name="phone"]') || {}).value || "",
        amount: amount,
        forWhom: (certForm.querySelector('[name="forWhom"]') || {}).value || "",
        comment: (certForm.querySelector('[name="comment"]') || {}).value || "",
        createdAt: new Date().toISOString()
      });
      if (certOk) certOk.hidden = false;
      certForm.reset();
      resetOptions(certForm);
    });
  }
})();
