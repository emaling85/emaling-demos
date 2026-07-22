/**
 * Слог — admin panel (demo mini-CRM)
 * Gate password: slog (sessionStorage)
 */
(function () {
  "use strict";

  var GATE_KEY = "slog_admin_ok";
  var PASSWORD = "slog";
  var FILTERS = ["all", "new", "confirmed", "rejected", "done"];

  var STATUS_LABEL = {
    new: "Новая",
    confirmed: "Подтверждена",
    rejected: "Отклонена",
    done: "Завершена",
  };

  var PACKAGE_LABEL = {
    month: "Месяц",
    trial: "Пробное",
  };

  var SUBJECT_LABEL = {
    math: "Математика",
    russian: "Русский",
    english: "Английский",
  };

  var FORMAT_LABEL = {
    online: "Онлайн",
    offline: "Очно",
  };

  var DAY_LABEL = {
    mon: "Пн",
    tue: "Вт",
    wed: "Ср",
    thu: "Чт",
    fri: "Пт",
    sat: "Сб",
    sun: "Вс",
  };

  var DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  var state = { filter: "all" };

  var els = {
    gate: document.getElementById("gate"),
    gateForm: document.getElementById("gate-form"),
    gatePass: document.getElementById("gate-pass"),
    gateError: document.getElementById("gate-error"),
    app: document.getElementById("app"),
    list: document.getElementById("booking-list"),
    empty: document.getElementById("empty"),
    filters: document.getElementById("filters"),
    statNew: document.getElementById("stat-new"),
    statConfirmedWeek: document.getElementById("stat-confirmed-week"),
    seedBtn: document.getElementById("seed-btn"),
    seedEmptyBtn: document.getElementById("seed-empty-btn"),
    logoutBtn: document.getElementById("logout-btn"),
  };

  function isAuthed() {
    try {
      return sessionStorage.getItem(GATE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setAuthed(ok) {
    try {
      if (ok) sessionStorage.setItem(GATE_KEY, "1");
      else sessionStorage.removeItem(GATE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function formatRub(n) {
    return (
      Math.round(Number(n) || 0).toLocaleString("ru-RU") + "\u00a0₽"
    );
  }

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function startOfWeek(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = day === 0 ? -6 : 1 - day;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + diff);
    return d;
  }

  function isThisWeek(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return false;
    var start = startOfWeek(new Date());
    var end = new Date(start);
    end.setDate(end.getDate() + 7);
    return d >= start && d < end;
  }

  function filteredList() {
    var all = window.SlogBookings.list();
    if (state.filter === "all") return all;
    return all.filter(function (b) {
      return b.status === state.filter;
    });
  }

  function updateStats(all) {
    var newCount = 0;
    var confirmedWeek = 0;
    for (var i = 0; i < all.length; i++) {
      if (all[i].status === "new") newCount++;
      if (all[i].status === "confirmed" && isThisWeek(all[i].createdAt)) {
        confirmedWeek++;
      }
    }
    els.statNew.textContent = String(newCount);
    els.statConfirmedWeek.textContent = String(confirmedWeek);
  }

  function syncFilterButtons() {
    var buttons = els.filters.querySelectorAll("[data-filter]");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var active = btn.getAttribute("data-filter") === state.filter;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function labelSubject(raw) {
    if (!raw) return "—";
    return SUBJECT_LABEL[raw] || raw;
  }

  function labelFormat(raw) {
    if (!raw) return "—";
    return FORMAT_LABEL[raw] || raw;
  }

  function daysLabel(days, time) {
    var list = Array.isArray(days) ? days.slice() : [];
    list.sort(function (a, b) {
      var ia = DAY_ORDER.indexOf(a);
      var ib = DAY_ORDER.indexOf(b);
      if (ia < 0 && ib < 0) return String(a).localeCompare(String(b));
      if (ia < 0) return 1;
      if (ib < 0) return -1;
      return ia - ib;
    });
    var d = list.length
      ? list
          .map(function (x) {
            return DAY_LABEL[x] || x;
          })
          .join(", ")
      : "—";
    var t = time ? time : "";
    return t ? d + " · " + t : d;
  }

  function priceLabel(b) {
    var lesson = formatRub(b.priceLesson);
    if (b.package === "trial") {
      return lesson + " · пробное";
    }
    return lesson + " / зан. · " + formatRub(b.priceMonth) + " / мес.";
  }

  function hoursLabel(b) {
    if (b.package === "trial") return "1 занятие";
    var n = Number(b.hoursPerWeek) || 0;
    return n ? String(n) : "—";
  }

  function renderItem(b) {
    var noteVal = escapeHtml(b.adminNote || "");
    var commentBlock = b.comment
      ? '<p class="row-comment">' + escapeHtml(b.comment) + "</p>"
      : "";

    return (
      '<article class="booking" data-id="' +
      escapeHtml(b.id) +
      '" data-status="' +
      escapeHtml(b.status) +
      '">' +
      '<div class="booking-main">' +
      '<div class="booking-head">' +
      '<h2 class="booking-name">' +
      escapeHtml(b.name || "Без имени") +
      "</h2>" +
      '<span class="status status-' +
      escapeHtml(b.status) +
      '">' +
      escapeHtml(STATUS_LABEL[b.status] || b.status) +
      "</span>" +
      "</div>" +
      '<p class="booking-contact">' +
      escapeHtml(b.contact || "—") +
      "</p>" +
      '<dl class="booking-meta">' +
      "<div><dt>Предмет</dt><dd>" +
      escapeHtml(labelSubject(b.subject)) +
      "</dd></div>" +
      "<div><dt>Формат</dt><dd>" +
      escapeHtml(labelFormat(b.format)) +
      "</dd></div>" +
      "<div><dt>Пакет</dt><dd>" +
      escapeHtml(PACKAGE_LABEL[b.package] || b.package || "—") +
      "</dd></div>" +
      "<div><dt>Расписание</dt><dd>" +
      escapeHtml(daysLabel(b.days, b.time)) +
      "</dd></div>" +
      "<div><dt>" +
      (b.package === "trial" ? "Объём" : "Часов/нед.") +
      "</dt><dd>" +
      escapeHtml(hoursLabel(b)) +
      "</dd></div>" +
      "<div><dt>Цена</dt><dd>" +
      escapeHtml(priceLabel(b)) +
      "</dd></div>" +
      "<div><dt>Дата</dt><dd>" +
      escapeHtml(formatDate(b.createdAt)) +
      "</dd></div>" +
      "</dl>" +
      commentBlock +
      '<label class="note-field">' +
      "<span>Заметка админа</span>" +
      '<textarea rows="2" data-action="note" placeholder="Кратко для себя">' +
      noteVal +
      "</textarea>" +
      "</label>" +
      "</div>" +
      '<div class="booking-actions">' +
      (b.status !== "confirmed"
        ? '<button type="button" class="btn btn-confirm" data-action="confirm">Подтвердить</button>'
        : "") +
      (b.status !== "rejected"
        ? '<button type="button" class="btn btn-reject" data-action="reject">Отклонить</button>'
        : "") +
      (b.status !== "done"
        ? '<button type="button" class="btn btn-done" data-action="done">Завершить</button>'
        : "") +
      '<button type="button" class="btn btn-ghost" data-action="save-note">Сохранить заметку</button>' +
      "</div>" +
      "</article>"
    );
  }

  function render() {
    if (!window.SlogBookings) return;

    var all = window.SlogBookings.list();
    updateStats(all);
    syncFilterButtons();

    var items = filteredList();
    if (!items.length) {
      els.list.innerHTML = "";
      els.list.hidden = true;
      els.empty.hidden = false;
      var emptyTitle = els.empty.querySelector(".empty-title");
      var emptyText = els.empty.querySelector(".empty-text");
      if (all.length === 0) {
        emptyTitle.textContent = "Заявок пока нет";
        emptyText.textContent =
          "Отправки с book.html появятся здесь. Можно добавить демо-заявки, чтобы посмотреть панель.";
        if (els.seedEmptyBtn) els.seedEmptyBtn.hidden = false;
      } else {
        emptyTitle.textContent = "В этом фильтре пусто";
        emptyText.textContent =
          "Переключите фильтр или дождитесь новых заявок.";
        if (els.seedEmptyBtn) els.seedEmptyBtn.hidden = true;
      }
      return;
    }

    els.empty.hidden = true;
    els.list.hidden = false;
    els.list.innerHTML = items.map(renderItem).join("");
  }

  function showApp() {
    els.gate.hidden = true;
    els.app.hidden = false;
    render();
  }

  function showGate() {
    els.app.hidden = true;
    els.gate.hidden = false;
    if (els.gateError) els.gateError.hidden = true;
    if (els.gatePass) els.gatePass.value = "";
  }

  function seed() {
    window.SlogBookings.seedDemo();
    state.filter = "new";
    render();
  }

  function onListClick(e) {
    var btn = e.target.closest("[data-action]");
    if (!btn || btn.tagName === "TEXTAREA") return;
    var article = btn.closest(".booking");
    if (!article) return;
    var id = article.getAttribute("data-id");
    var action = btn.getAttribute("data-action");
    var noteEl = article.querySelector('textarea[data-action="note"]');
    var note = noteEl ? noteEl.value : undefined;

    if (action === "confirm") {
      window.SlogBookings.updateStatus(id, "confirmed", note);
      render();
      return;
    }
    if (action === "reject") {
      var reason = window.prompt(
        "Причина отклонения (необязательно):",
        note || ""
      );
      if (reason === null) return;
      window.SlogBookings.updateStatus(id, "rejected", reason);
      render();
      return;
    }
    if (action === "done") {
      window.SlogBookings.updateStatus(id, "done", note);
      render();
      return;
    }
    if (action === "save-note") {
      window.SlogBookings.updateNote(id, note || "");
      btn.textContent = "Сохранено";
      window.setTimeout(function () {
        btn.textContent = "Сохранить заметку";
      }, 1200);
    }
  }

  function init() {
    if (els.gateForm) {
      els.gateForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var val = (els.gatePass.value || "").trim();
        if (val === PASSWORD) {
          setAuthed(true);
          showApp();
        } else {
          els.gateError.hidden = false;
          els.gatePass.focus();
        }
      });
    }

    if (els.filters) {
      els.filters.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-filter]");
        if (!btn) return;
        var f = btn.getAttribute("data-filter");
        if (FILTERS.indexOf(f) < 0) return;
        state.filter = f;
        render();
      });
    }

    if (els.list) {
      els.list.addEventListener("click", onListClick);
    }

    if (els.seedBtn) els.seedBtn.addEventListener("click", seed);
    if (els.seedEmptyBtn) els.seedEmptyBtn.addEventListener("click", seed);

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener("click", function () {
        setAuthed(false);
        showGate();
      });
    }

    if (isAuthed()) showApp();
    else showGate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
