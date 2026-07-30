(function () {
  "use strict";

  document.documentElement.classList.add("js-anim");

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
  function showAll() {
    nodes.forEach(function (n) {
      n.classList.add("is-in");
    });
  }
  if ("IntersectionObserver" in window && nodes.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
    /* страховка: если что-то не попало в viewport — показать через секунду */
    setTimeout(showAll, 1200);
  } else {
    showAll();
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

  /* Remove any leftover old modals (select-based) */
  document.querySelectorAll("#book-modal, #cert-modal, .modal").forEach(function (el) {
    if (el.querySelector("select") || el.id === "book-modal" || el.id === "cert-modal") {
      el.remove();
    }
  });

  var shell = document.createElement("div");
  shell.innerHTML =
    '<div class="modal" id="book-modal" hidden>' +
    '<div class="modal-backdrop" data-book-close></div>' +
    '<div class="modal-dialog" role="dialog" aria-modal="true">' +
    '<button type="button" class="modal-close" data-book-close aria-label="Закрыть">×</button>' +
    "<h2>Запись</h2>" +
    "<p>Выберите услугу с ценой — перезвоним и согласуем время.</p>" +
    '<form id="book-form">' +
    '<div class="form-row"><label for="book-name">Имя</label><input id="book-name" name="name" type="text" required autocomplete="name" /></div>' +
    '<div class="form-row"><label for="book-phone">Телефон</label><input id="book-phone" name="phone" type="tel" required autocomplete="tel" placeholder="+7" /></div>' +
    '<div class="form-row"><span class="field-label">Услуга</span><div class="option-list" role="radiogroup">' +
    '<label class="option-card is-selected"><input type="radio" name="service" value="Татуировка · от 3 500 ₽" checked /><strong>Татуировка</strong><span class="opt-desc">Эскиз + сеанс</span><span class="opt-price">от 3 500 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="service" value="Перекрытие · от 5 000 ₽" /><strong>Перекрытие</strong><span class="opt-desc">Закрытие старой работы</span><span class="opt-price">от 5 000 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="service" value="Пирсинг · от 2 000 ₽" /><strong>Пирсинг</strong><span class="opt-desc">Прокол + серьга</span><span class="opt-price">от 2 000 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="service" value="Консультация · 0 ₽" /><strong>Консультация</strong><span class="opt-desc">Идея и вилка по цене</span><span class="opt-price">0 ₽</span></label>' +
    "</div></div>" +
    '<div class="form-row"><label for="book-comment">Комментарий</label><textarea id="book-comment" name="comment" rows="2" placeholder="Стиль, зона, мастер"></textarea></div>' +
    '<button class="btn" type="submit">Отправить</button>' +
    '<p class="form-ok" id="book-ok" hidden>Заявка сохранена (демо).</p>' +
    "</form></div></div>" +
    '<div class="modal" id="cert-modal" hidden>' +
    '<div class="modal-backdrop" data-cert-close></div>' +
    '<div class="modal-dialog modal-dialog--wide" role="dialog" aria-modal="true">' +
    '<button type="button" class="modal-close" data-cert-close aria-label="Закрыть">×</button>' +
    '<div id="cert-steps">' +
    '<div class="cert-step" data-cert-step="1">' +
    "<h2>Купить сертификат</h2>" +
    "<p>Шаг 1 из 3 — выберите номинал</p>" +
    '<div class="option-list" role="radiogroup" id="cert-amounts">' +
    '<label class="option-card is-selected"><input type="radio" name="amount" value="5000" data-label="5 000 ₽" checked /><strong>5 000 ₽</strong><span class="opt-desc">Мини или консультация+</span><span class="opt-price">5 000 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="amount" value="10000" data-label="10 000 ₽" /><strong>10 000 ₽</strong><span class="opt-desc">Средний сеанс</span><span class="opt-price">10 000 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="amount" value="15000" data-label="15 000 ₽" /><strong>15 000 ₽</strong><span class="opt-desc">Крупная работа / этап</span><span class="opt-price">15 000 ₽</span></label>' +
    '<label class="option-card"><input type="radio" name="amount" value="custom" data-label="Своя сумма" /><strong>Своя сумма</strong><span class="opt-desc">От 3 000 ₽</span><span class="opt-price">своя</span></label>' +
    "</div>" +
    '<div class="form-row" id="cert-custom-row" hidden><label for="cert-custom">Сумма, ₽</label><input id="cert-custom" type="number" min="3000" step="500" placeholder="3000" /></div>' +
    '<button type="button" class="btn" data-cert-next="2">Далее</button>' +
    "</div>" +
    '<div class="cert-step" data-cert-step="2" hidden>' +
    "<h2>Данные</h2>" +
    "<p>Шаг 2 из 3 — кто покупает и кому</p>" +
    '<div class="form-row"><label for="cert-name">Ваше имя</label><input id="cert-name" type="text" required /></div>' +
    '<div class="form-row"><label for="cert-phone">Телефон</label><input id="cert-phone" type="tel" required placeholder="+7" /></div>' +
    '<div class="form-row"><label for="cert-for">Кому подарок</label><input id="cert-for" type="text" placeholder="Имя получателя" /></div>' +
    '<div class="form-row"><span class="field-label">Как получить</span><div class="option-list" id="cert-delivery">' +
    '<label class="option-card is-selected"><input type="radio" name="delivery" value="email" checked /><strong>На e-mail</strong><span class="opt-desc">PDF-код сразу после оплаты</span><span class="opt-price">онлайн</span></label>' +
    '<label class="option-card"><input type="radio" name="delivery" value="studio" /><strong>В студии</strong><span class="opt-desc">Бумажный конверт, Рентгена 7</span><span class="opt-price">забрать</span></label>' +
    "</div></div>" +
    '<div class="form-row" id="cert-email-row"><label for="cert-email">E-mail</label><input id="cert-email" type="email" placeholder="you@mail.ru" /></div>' +
    '<div class="cert-nav"><button type="button" class="btn btn-ghost" data-cert-next="1">Назад</button><button type="button" class="btn" data-cert-next="3">К оплате</button></div>' +
    "</div>" +
    '<div class="cert-step" data-cert-step="3" hidden>' +
    "<h2>Оплата</h2>" +
    '<p>Шаг 3 из 3 — к оплате <strong id="cert-pay-sum">5 000 ₽</strong></p>' +
    '<div class="pay-box">' +
    '<div class="form-row"><label for="pay-card">Номер карты (демо)</label><input id="pay-card" type="text" inputmode="numeric" placeholder="ACCT-000003" maxlength="19" /></div>' +
    '<div class="pay-row">' +
    '<div class="form-row"><label for="pay-exp">Срок</label><input id="pay-exp" type="text" placeholder="12/28" maxlength="5" /></div>' +
    '<div class="form-row"><label for="pay-cvc">CVC</label><input id="pay-cvc" type="password" placeholder="•••" maxlength="3" /></div>' +
    "</div>" +
    "<p class="pay-note">Демо: деньги не списываются. Нажмите «Оплатить» — появится код сертификата.</p>" +
    "</div>" +
    '<div class="cert-nav"><button type="button" class="btn btn-ghost" data-cert-next="2">Назад</button><button type="button" class="btn" id="cert-pay-btn">Оплатить</button></div>' +
    "</div>" +
    '<div class="cert-step" data-cert-step="done" hidden>' +
    '<div class="cert-success">' +
    "<h2>Сертификат оформлен</h2>" +
    '<p class="cert-code-label">Код</p>' +
    '<p class="cert-code" id="cert-code">CH-0000</p>' +
    '<p id="cert-done-text">Номинал сохранён. В живом проекте код уходит на e-mail или выдаётся в студии.</p>' +
    '<button type="button" class="btn" data-cert-close>Готово</button>' +
    "</div></div>" +
    "</div></div></div>";

  while (shell.firstChild) document.body.appendChild(shell.firstChild);

  function bindCards(root) {
    if (!root) return;
    root.querySelectorAll(".option-card").forEach(function (card) {
      card.addEventListener("click", function () {
        var list = card.closest(".option-list");
        if (!list) return;
        list.querySelectorAll(".option-card").forEach(function (c) {
          c.classList.remove("is-selected");
        });
        card.classList.add("is-selected");
        var input = card.querySelector('input[type="radio"]');
        if (input) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    });
  }

  var bookModal = document.getElementById("book-modal");
  var certModal = document.getElementById("cert-modal");
  var bookForm = document.getElementById("book-form");
  var bookOk = document.getElementById("book-ok");

  bindCards(bookForm);
  bindCards(document.getElementById("cert-amounts"));
  bindCards(document.getElementById("cert-delivery"));

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

  function showCertStep(n) {
    certModal.querySelectorAll(".cert-step").forEach(function (step) {
      step.hidden = step.getAttribute("data-cert-step") !== String(n);
    });
  }

  function selectedAmount() {
    var checked = certModal.querySelector('#cert-amounts input[name="amount"]:checked');
    if (!checked) return { value: 5000, label: "5 000 ₽" };
    if (checked.value === "custom") {
      var raw = parseInt((document.getElementById("cert-custom") || {}).value || "0", 10);
      if (!raw || raw < 3000) raw = 3000;
      return {
        value: raw,
        label: raw.toLocaleString("ru-RU") + " ₽"
      };
    }
    return {
      value: parseInt(checked.value, 10),
      label: checked.getAttribute("data-label") || checked.value + " ₽"
    };
  }

  var amounts = document.getElementById("cert-amounts");
  if (amounts) {
    amounts.addEventListener("change", function () {
      var custom = certModal.querySelector('#cert-amounts input[value="custom"]');
      var row = document.getElementById("cert-custom-row");
      if (row) row.hidden = !(custom && custom.checked);
    });
  }

  var delivery = document.getElementById("cert-delivery");
  if (delivery) {
    delivery.addEventListener("change", function () {
      var email = certModal.querySelector('#cert-delivery input[value="email"]');
      var row = document.getElementById("cert-email-row");
      if (row) row.hidden = !(email && email.checked);
    });
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
      showCertStep(1);
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
      showCertStep(1);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeDialog(bookModal);
    closeDialog(certModal);
  });

  certModal.querySelectorAll("[data-cert-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = btn.getAttribute("data-cert-next");
      if (next === "2") {
        var amt = selectedAmount();
        if (amt.value < 3000) {
          alert("Минимальный номинал — 3 000 ₽");
          return;
        }
      }
      if (next === "3") {
        var name = (document.getElementById("cert-name") || {}).value || "";
        var phone = (document.getElementById("cert-phone") || {}).value || "";
        if (!name.trim() || !phone.trim()) {
          alert("Укажите имя и телефон");
          return;
        }
        var emailOn = certModal.querySelector('#cert-delivery input[value="email"]');
        if (emailOn && emailOn.checked) {
          var email = (document.getElementById("cert-email") || {}).value || "";
          if (!email.trim()) {
            alert("Укажите e-mail для отправки сертификата");
            return;
          }
        }
        var sum = document.getElementById("cert-pay-sum");
        if (sum) sum.textContent = selectedAmount().label;
      }
      showCertStep(next);
    });
  });

  var payBtn = document.getElementById("cert-pay-btn");
  if (payBtn) {
    payBtn.addEventListener("click", function () {
      var amt = selectedAmount();
      var code =
        "CH-" +
        amt.value +
        "-" +
        Math.floor(1000 + Math.random() * 9000);
      var order = {
        type: "certificate_purchase",
        amount: amt.value,
        amountLabel: amt.label,
        name: (document.getElementById("cert-name") || {}).value || "",
        phone: (document.getElementById("cert-phone") || {}).value || "",
        forWhom: (document.getElementById("cert-for") || {}).value || "",
        delivery: (
          (certModal.querySelector('#cert-delivery input:checked') || {}).value ||
          "email"
        ),
        email: (document.getElementById("cert-email") || {}).value || "",
        code: code,
        createdAt: new Date().toISOString()
      };
      try {
        var key = "chernila_bookings";
        var list = JSON.parse(localStorage.getItem(key) || "[]");
        list.push(order);
        localStorage.setItem(key, JSON.stringify(list));
      } catch (err) {
        /* ignore */
      }
      var codeEl = document.getElementById("cert-code");
      var textEl = document.getElementById("cert-done-text");
      if (codeEl) codeEl.textContent = code;
      if (textEl) {
        textEl.textContent =
          "Номинал " +
          amt.label +
          ". Код действует 12 месяцев. Демо-оплата — без реального списания.";
      }
      showCertStep("done");
    });
  }

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
      bookForm.querySelectorAll(".option-card").forEach(function (c, i) {
        c.classList.toggle("is-selected", i === 0);
        var r = c.querySelector("input");
        if (r) r.checked = i === 0;
      });
    });
  }
})();
