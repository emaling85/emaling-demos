/**
 * Линия — логика админки заявок.
 * Читает/пишет данные через window.LiniaBookings (js/bookings.js, общий
 * localStorage-ключ "linia_bookings" с формой записи book.html).
 *
 * Демо-гейт (sessionStorage) — не настоящая защита, только чтобы страница
 * не открывалась случайно с первого клика; пароль показан в подсказке.
 */
(function () {
  "use strict";

  var GATE_KEY = "linia_admin_gate_ok";
  var GATE_PASSWORD = "liniya2026";

  var STATUS_LABEL = {
    new: "Новая",
    confirmed: "Подтверждена",
    done: "Выполнена",
    cancelled: "Отменена",
  };

  var FILTER_LABEL = {
    all: "Все",
    new: "новые",
    confirmed: "подтверждённые",
    done: "выполненные",
    cancelled: "отменённые",
  };

  var currentFilter = "all";

  var gateEl = document.getElementById("gate");
  var gateForm = document.getElementById("gate-form");
  var gatePasswordInput = document.getElementById("gate-password");
  var gateError = document.getElementById("gate-error");
  var appEl = document.getElementById("app");
  var listEl = document.getElementById("booking-list");
  var filtersEl = document.getElementById("filters");
  var toastEl = document.getElementById("toast");
  var toastTimer = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2400);
  }

  /* ---------- Gate ---------- */

  function openApp() {
    gateEl.hidden = true;
    appEl.hidden = false;
    render();
  }

  function checkGate() {
    try {
      if (sessionStorage.getItem(GATE_KEY) === "1") {
        openApp();
        return;
      }
    } catch (e) {
      /* sessionStorage unavailable — just show the gate */
    }
    gateEl.hidden = false;
    appEl.hidden = true;
  }

  gateForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var value = gatePasswordInput.value.trim();
    if (value.toLowerCase() !== GATE_PASSWORD) {
      gateError.textContent = "Неверный пароль. Подсказка: " + GATE_PASSWORD;
      gateError.hidden = false;
      gatePasswordInput.focus();
      return;
    }
    gateError.hidden = true;
    try {
      sessionStorage.setItem(GATE_KEY, "1");
    } catch (e) {
      /* ignore */
    }
    openApp();
  });

  document.getElementById("logout-btn").addEventListener("click", function () {
    try {
      sessionStorage.removeItem(GATE_KEY);
    } catch (e) {
      /* ignore */
    }
    gatePasswordInput.value = "";
    checkGate();
  });

  /* ---------- Formatting helpers ---------- */

  function formatDate(value) {
    if (!value) return "";
    var parts = String(value).split("-");
    if (parts.length !== 3) return value;
    return parts[2] + "." + parts[1] + "." + parts[0];
  }

  function dayBadge(dateStr) {
    if (!dateStr) return "";
    var today = new Date();
    var todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr =
      tomorrow.getFullYear() +
      "-" +
      String(tomorrow.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(tomorrow.getDate()).padStart(2, "0");
    if (dateStr === todayStr) return "Сегодня";
    if (dateStr === tomorrowStr) return "Завтра";
    if (dateStr < todayStr) return "Прошло";
    return "";
  }

  function formatCreatedAt(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yyyy = d.getFullYear();
    var hh = String(d.getHours()).padStart(2, "0");
    var min = String(d.getMinutes()).padStart(2, "0");
    return dd + "." + mm + "." + yyyy + ", " + hh + ":" + min;
  }

  /* ---------- Rendering ---------- */

  function computeCounts(all) {
    var counts = { all: all.length, new: 0, confirmed: 0, done: 0, cancelled: 0 };
    all.forEach(function (b) {
      if (counts[b.status] != null) counts[b.status]++;
    });
    return counts;
  }

  function renderStats(counts) {
    document.getElementById("stat-all").textContent = counts.all;
    document.getElementById("stat-new").textContent = counts.new;
    document.getElementById("stat-confirmed").textContent = counts.confirmed;
    document.getElementById("stat-done").textContent = counts.done;
    document.getElementById("stat-cancelled").textContent = counts.cancelled;

    document.getElementById("count-all").textContent = counts.all;
    document.getElementById("count-new").textContent = counts.new;
    document.getElementById("count-confirmed").textContent = counts.confirmed;
    document.getElementById("count-done").textContent = counts.done;
    document.getElementById("count-cancelled").textContent = counts.cancelled;
  }

  function renderFilters() {
    filtersEl.querySelectorAll(".filter").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-filter") === currentFilter);
    });
  }

  function emptyStateHtml(all) {
    if (all.length === 0) {
      return (
        '<div class="empty">' +
        '<div class="empty-icon" aria-hidden="true">🗓</div>' +
        '<p class="empty-title">Заявок пока нет</p>' +
        '<p class="empty-text">Заполните форму записи на сайте — она сохранится в этом браузере и сразу появится здесь, без Telegram-бота и звонков. Можно также посмотреть, как выглядит список, на демо-данных.</p>' +
        '<div class="empty-actions">' +
        '<a class="btn btn-primary" href="../book.html">Открыть форму записи</a>' +
        '<button class="btn btn-secondary" type="button" data-action="seed-demo">Показать демо-данные</button>' +
        "</div></div>"
      );
    }
    var label = FILTER_LABEL[currentFilter] || currentFilter;
    return (
      '<div class="empty">' +
      '<div class="empty-icon" aria-hidden="true">∅</div>' +
      '<p class="empty-title">Нет заявок со статусом «' + escapeHtml(label) + '»</p>' +
      '<p class="empty-text">Заявки есть, но ни одна не подходит под текущий фильтр. Переключитесь на «Все», чтобы увидеть список целиком.</p>' +
      '<div class="empty-actions">' +
      '<button class="btn btn-secondary" type="button" data-action="show-all">Показать все</button>' +
      "</div></div>"
    );
  }

  function bookingCardHtml(b) {
    var statusClass = "status-" + b.status;
    var statusLabel = STATUS_LABEL[b.status] || b.status;
    var badge = dayBadge(b.date);
    var whenText = b.date ? formatDate(b.date) : "дата не указана";
    if (b.time) whenText += " в " + escapeHtml(b.time);
    if (badge) whenText += " · " + badge;

    var actions = "";
    if (b.status !== "confirmed") {
      actions += '<button class="btn btn-confirm" type="button" data-action="confirm">Подтвердить</button>';
    }
    if (b.status !== "done") {
      actions += '<button class="btn btn-done" type="button" data-action="done">Выполнено</button>';
    }
    if (b.status !== "cancelled") {
      actions += '<button class="btn btn-cancel" type="button" data-action="cancel">Отменить</button>';
    }
    actions += '<button class="btn btn-ghost" type="button" data-action="delete">Удалить</button>';

    var sourceTag =
      b.source === "bot-import"
        ? '<span class="source-tag">импорт из бота</span>'
        : '<span class="source-tag">с сайта</span>';

    return (
      '<article class="booking" data-id="' + escapeHtml(b.id) + '" data-status="' + escapeHtml(b.status) + '">' +
      '<div class="booking-main">' +
      '<div class="booking-head">' +
      '<h2 class="booking-name">' + (escapeHtml(b.name) || "Без имени") + "</h2>" +
      '<span class="status ' + statusClass + '">' + escapeHtml(statusLabel) + "</span>" +
      sourceTag +
      "</div>" +
      '<p class="booking-when">' + escapeHtml(whenText) + "</p>" +
      '<p class="booking-contact">' + (escapeHtml(b.phone) || "контакт не указан") + "</p>" +
      '<dl class="booking-meta">' +
      "<div><dt>Услуга</dt><dd>" + (escapeHtml(b.serviceTitle) || "—") + "</dd></div>" +
      "<div><dt>Цена</dt><dd>" + (escapeHtml(b.servicePrice) || "—") + "</dd></div>" +
      "<div><dt>Создано</dt><dd>" + formatCreatedAt(b.createdAt) + "</dd></div>" +
      "</dl>" +
      (b.comment ? '<p class="row-comment">' + escapeHtml(b.comment) + "</p>" : "") +
      '<label class="note-field">Заметка администратора' +
      '<textarea rows="1" placeholder="Например: перенесли на четверг, звонили дважды" data-action="note">' +
      escapeHtml(b.adminNote) +
      "</textarea></label>" +
      "</div>" +
      '<div class="booking-actions">' + actions + "</div>" +
      "</article>"
    );
  }

  function render() {
    var all = window.LiniaBookings.list();
    var counts = computeCounts(all);
    renderStats(counts);
    renderFilters();

    var filtered =
      currentFilter === "all"
        ? all
        : all.filter(function (b) {
            return b.status === currentFilter;
          });

    if (filtered.length === 0) {
      listEl.innerHTML = emptyStateHtml(all);
      return;
    }

    listEl.innerHTML = filtered.map(bookingCardHtml).join("");
  }

  /* ---------- Event delegation ---------- */

  filtersEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter");
    if (!btn) return;
    currentFilter = btn.getAttribute("data-filter");
    render();
  });

  listEl.addEventListener("click", function (e) {
    var actionBtn = e.target.closest("[data-action]");
    if (!actionBtn) return;
    var action = actionBtn.getAttribute("data-action");

    if (action === "seed-demo") {
      window.LiniaBookings.seedDemo();
      showToast("Добавлены демо-заявки");
      render();
      return;
    }
    if (action === "show-all") {
      currentFilter = "all";
      render();
      return;
    }

    var card = actionBtn.closest(".booking");
    if (!card) return;
    var id = card.getAttribute("data-id");

    if (action === "confirm") {
      window.LiniaBookings.updateStatus(id, "confirmed");
      showToast("Заявка подтверждена");
      render();
    } else if (action === "done") {
      window.LiniaBookings.updateStatus(id, "done");
      showToast("Отмечено как выполнено");
      render();
    } else if (action === "cancel") {
      window.LiniaBookings.updateStatus(id, "cancelled");
      showToast("Заявка отменена");
      render();
    } else if (action === "delete") {
      if (window.confirm("Удалить эту заявку без возможности восстановить?")) {
        window.LiniaBookings.remove(id);
        showToast("Заявка удалена");
        render();
      }
    }
  });

  listEl.addEventListener(
    "focus",
    function (e) {
      var el = e.target;
      if (el && el.getAttribute && el.getAttribute("data-action") === "note") {
        el.dataset.prevValue = el.value;
      }
    },
    true
  );

  listEl.addEventListener(
    "blur",
    function (e) {
      var el = e.target;
      if (!el || !el.getAttribute || el.getAttribute("data-action") !== "note") return;
      if (el.value === el.dataset.prevValue) return;
      var card = el.closest(".booking");
      if (!card) return;
      var id = card.getAttribute("data-id");
      window.LiniaBookings.updateNote(id, el.value);
      showToast("Заметка сохранена");
    },
    true
  );

  /* ---------- Top toolbar actions ---------- */

  document.getElementById("refresh-btn").addEventListener("click", function () {
    render();
    showToast("Список обновлён");
  });

  document.getElementById("demo-btn").addEventListener("click", function () {
    window.LiniaBookings.seedDemo();
    showToast("Добавлены демо-заявки");
    render();
  });

  document.getElementById("clear-btn").addEventListener("click", function () {
    if (window.confirm("Удалить ВСЕ заявки без возможности восстановить?")) {
      window.LiniaBookings.clearAll();
      showToast("Все заявки удалены");
      render();
    }
  });

  document.getElementById("import-file").addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        var added = window.LiniaBookings.importLegacyJson(data);
        showToast(added ? "Импортировано заявок: " + added : "Новых заявок не найдено");
        render();
      } catch (err) {
        window.alert("Не удалось прочитать JSON: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  });

  checkGate();
})();
