/**
 * Слог — public site interactions + booking form
 *
 * Pricing:
 *   baseHour = { math: 2200, russian: 1800, english: 2000 }
 *   formatMul = online ? 0.9 : 1
 *   examMul   = ЕГЭ/ОГЭ ? 1.25 : 1
 *   perLesson = round(baseHour × formatMul × examMul)
 *   month     = perLesson × daysPerWeek × 4
 *   trial     = perLesson (one lesson)
 */
(function () {
  "use strict";

  var TG_USER = "emaling_dev";

  var BASE = { math: 2200, russian: 1800, english: 2000 };

  var SUBJECT_LABELS = {
    math: "Математика",
    russian: "Русский",
    english: "Английский",
  };

  var DAY_LABELS = {
    mon: "Пн",
    tue: "Вт",
    wed: "Ср",
    thu: "Чт",
    fri: "Пт",
    sat: "Сб",
    sun: "Вс",
  };

  var DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  /* —— Shared UI —— */
  function initNav() {
    var nav = document.querySelector("[data-nav]");
    var toggle = document.querySelector("[data-nav-toggle]");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (toggle) {
      toggle.addEventListener("click", function () {
        document.body.classList.toggle("nav-open");
      });
    }

    document.querySelectorAll(".nav-links a").forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
      });
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
    );

    nodes.forEach(function (el) {
      io.observe(el);
    });
  }

  function formatRub(n) {
    return (
      Math.round(n).toLocaleString("ru-RU").replace(/\u00a0/g, "\u00a0") +
      "\u00a0₽"
    );
  }

  function pluralHours(n) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return "час";
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "часа";
    return "часов";
  }

  /* —— Booking —— */
  function initBooking() {
    var form = document.getElementById("book-form");
    if (!form) return;

    var shell = document.getElementById("book-shell");
    var success = document.getElementById("book-success");
    var errEl = document.getElementById("form-error");
    var priceEl = document.getElementById("sum-price");
    var dayHint = document.getElementById("day-hint");
    var bookTitle = document.getElementById("book-title");
    var bookLead = document.getElementById("book-lead");
    var sumHoursLabel = document.getElementById("sum-hours-label");
    var againBtn = document.getElementById("book-again");
    var lastPrice = null;

    function getPackage() {
      var pkgEl = form.querySelector('input[name="package"]:checked');
      return pkgEl ? pkgEl.value : "month";
    }

    function selectedDays() {
      return Array.prototype.slice
        .call(form.querySelectorAll('input[name="days"]:checked'))
        .map(function (el) {
          return el.value;
        })
        .sort(function (a, b) {
          return DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b);
        });
    }

    /** Trial: keep at most one day (first in week order). */
    function clampDaysForTrial() {
      var checked = form.querySelectorAll('input[name="days"]:checked');
      if (checked.length <= 1) return;
      var keep = null;
      var ordered = selectedDays();
      if (ordered.length) keep = ordered[0];
      Array.prototype.forEach.call(
        form.querySelectorAll('input[name="days"]'),
        function (el) {
          el.checked = keep ? el.value === keep : false;
        }
      );
    }

    function applyPackageMode() {
      var isTrial = getPackage() === "trial";

      if (isTrial) {
        clampDaysForTrial();
        if (dayHint) {
          dayHint.textContent =
            "Для пробного выберите ровно один день. Время — один слот на 60 минут.";
        }
        if (bookTitle) bookTitle.textContent = "Пробное занятие";
        if (bookLead) {
          bookLead.textContent =
            "Один урок, чтобы познакомиться с форматом. Выберите предмет, день и время — цена за занятие справа.";
        }
      } else {
        if (dayHint) {
          dayHint.textContent =
            "Нажмите нужные дни — можно несколько. Для пакета это и есть интенсивность.";
        }
        if (bookTitle) bookTitle.textContent = "Пакет на месяц";
        if (bookLead) {
          bookLead.textContent =
            "Выберите предмет, дни и слот — стоимость обновится сразу. После отправки заявку проверит репетитор.";
        }
      }
    }

    function readState() {
      var subjectEl = form.querySelector('input[name="subject"]:checked');
      var formatEl = form.querySelector('input[name="format"]:checked');
      var pkgEl = form.querySelector('input[name="package"]:checked');
      var timeEl = form.querySelector('input[name="time"]:checked');
      var examEl = document.getElementById("exam");
      var exam = examEl ? examEl.checked : false;

      var subject = subjectEl ? subjectEl.value : "math";
      var format = formatEl ? formatEl.value : "online";
      var pkg = pkgEl ? pkgEl.value : "month";
      var time = timeEl ? timeEl.value : "";
      var days = selectedDays();

      if (pkg === "trial" && days.length > 1) {
        days = days.slice(0, 1);
      }

      var hoursPerWeek = pkg === "trial" ? (days.length ? 1 : 0) : days.length;

      var base = BASE[subject] || 2000;
      var formatMul = format === "online" ? 0.9 : 1;
      var examMul = exam ? 1.25 : 1;
      var perLesson = Math.round(base * formatMul * examMul);
      var priceMonth =
        pkg === "trial"
          ? perLesson
          : perLesson * Math.max(hoursPerWeek, 0) * 4;

      return {
        subject: subject,
        subjectLabel: SUBJECT_LABELS[subject] || subject,
        format: format,
        formatLabel: format === "online" ? "Онлайн" : "Очно",
        package: pkg,
        packageLabel: pkg === "trial" ? "Пробное" : "На месяц",
        days: days,
        daysLabel: days.length
          ? days
              .map(function (d) {
                return DAY_LABELS[d] || d;
              })
              .join(", ")
          : "—",
        time: time,
        exam: exam,
        hoursPerWeek: hoursPerWeek,
        priceLesson: perLesson,
        priceMonth: priceMonth,
      };
    }

    function flashPrice() {
      if (!priceEl) return;
      priceEl.classList.remove("is-flash");
      void priceEl.offsetWidth;
      priceEl.classList.add("is-flash");
      window.setTimeout(function () {
        priceEl.classList.remove("is-flash");
      }, 220);
    }

    function updateSummary() {
      var s = readState();

      if (lastPrice !== s.priceMonth) {
        flashPrice();
        lastPrice = s.priceMonth;
      }

      document.getElementById("sum-package").textContent = s.packageLabel;
      document.getElementById("sum-subject").textContent =
        s.subjectLabel + (s.exam ? " · ЕГЭ/ОГЭ" : "");
      document.getElementById("sum-format").textContent = s.formatLabel;
      document.getElementById("sum-days").textContent = s.daysLabel;
      document.getElementById("sum-time").textContent = s.time || "—";

      if (sumHoursLabel) {
        sumHoursLabel.textContent =
          s.package === "trial" ? "Объём" : "В неделю";
      }
      if (s.package === "trial") {
        document.getElementById("sum-hours").textContent = s.days.length
          ? "1 занятие"
          : "—";
      } else {
        document.getElementById("sum-hours").textContent =
          s.hoursPerWeek + "\u00a0" + pluralHours(s.hoursPerWeek);
      }

      var label = document.getElementById("sum-price-label");
      if (s.package === "trial") {
        label.textContent = "Пробное занятие";
      } else {
        label.textContent =
          "Пакет на месяц" +
          (s.hoursPerWeek ? " · " + s.hoursPerWeek * 4 + " занят." : "");
      }

      priceEl.textContent = formatRub(s.priceMonth);
      document.getElementById("sum-lesson").textContent =
        "За занятие: " + formatRub(s.priceLesson);
    }

    function showError(msg) {
      errEl.textContent = msg;
      errEl.classList.add("is-visible");
      errEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function clearError() {
      errEl.textContent = "";
      errEl.classList.remove("is-visible");
    }

    function buildTelegramText(s, name, contact, comment) {
      var lines = [
        "Заявка со сайта «Слог» (демо)",
        "",
        "Имя: " + name,
        "Контакт: " + contact,
        "",
        "Пакет: " + s.packageLabel,
        "Предмет: " + s.subjectLabel + (s.exam ? " (ЕГЭ/ОГЭ)" : ""),
        "Формат: " + s.formatLabel,
        "Дни: " + s.daysLabel,
        "Время: " + (s.time || "—"),
        s.package === "trial"
          ? "Объём: 1 занятие (60 мин)"
          : "Часов в неделю: " + s.hoursPerWeek,
        "",
        "За занятие: " + formatRub(s.priceLesson),
        (s.package === "trial" ? "Итого: " : "Пакет (~4 нед.): ") +
          formatRub(s.priceMonth),
      ];
      if (comment) lines.push("", "Комментарий: " + comment);
      return lines.join("\n");
    }

    function resetFormView() {
      form.reset();
      lastPrice = null;
      if (shell) shell.classList.remove("is-done");
      if (success) {
        success.hidden = true;
        success.classList.remove("is-visible");
      }
      clearError();
      applyPackageMode();
      updateSummary();
      if (shell) {
        shell.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    form.addEventListener("change", function (e) {
      var t = e.target;
      if (!t) return;

      if (t.name === "package") {
        applyPackageMode();
      }

      /* Trial: selecting a day clears other days (radio-like). */
      if (t.name === "days" && t.checked && getPackage() === "trial") {
        Array.prototype.forEach.call(
          form.querySelectorAll('input[name="days"]'),
          function (el) {
            if (el !== t) el.checked = false;
          }
        );
      }

      clearError();
      updateSummary();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearError();

      var s = readState();
      var name = document.getElementById("name").value.trim();
      var contact = document.getElementById("contact").value.trim();
      var comment = document.getElementById("comment").value.trim();

      if (!name || !contact) {
        showError(
          "Укажите имя и контакт — так с вами свяжутся после проверки."
        );
        return;
      }
      if (s.package === "trial") {
        if (s.days.length !== 1) {
          showError("Для пробного занятия выберите ровно один день.");
          return;
        }
      } else if (!s.days.length) {
        showError("Выберите хотя бы один день недели.");
        return;
      }
      if (!s.time) {
        showError("Выберите удобное время.");
        return;
      }
      if (typeof window.SlogBookings === "undefined") {
        showError(
          "Не удалось сохранить заявку. Обновите страницу и попробуйте ещё раз."
        );
        return;
      }

      var booking = window.SlogBookings.create({
        name: name,
        contact: contact,
        subject: s.subject,
        format: s.format,
        package: s.package,
        days: s.days,
        time: s.time,
        hoursPerWeek: s.hoursPerWeek,
        priceMonth: s.priceMonth,
        priceLesson: s.priceLesson,
        comment: comment + (s.exam ? (comment ? " · " : "") + "ЕГЭ/ОГЭ" : ""),
        status: "new",
      });

      var tgText = buildTelegramText(s, name, contact, comment);
      var tgLink = document.getElementById("tg-backup");
      if (tgLink) {
        tgLink.href =
          "https://t.me/" + TG_USER + "?text=" + encodeURIComponent(tgText);
      }

      if (shell) shell.classList.add("is-done");
      if (success) {
        success.hidden = false;
        success.classList.add("is-visible");
        success.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      void booking;
    });

    if (againBtn) {
      againBtn.addEventListener("click", resetFormView);
    }

    applyPackageMode();
    updateSummary();
  }

  function initStickyCta() {
    var bar = document.getElementById("sticky-cta");
    if (!bar) return;
    bar.hidden = false;
    var hero = document.querySelector(".hero");
    function update() {
      if (window.matchMedia("(min-width: 761px)").matches) {
        bar.classList.remove("is-visible");
        document.body.classList.remove("has-sticky-cta");
        return;
      }
      var past = !hero || window.scrollY > (hero.offsetHeight || 320) * 0.5;
      var nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 160;
      var show = past && !nearBottom;
      bar.classList.toggle("is-visible", show);
      document.body.classList.toggle("has-sticky-cta", show);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  initNav();
  initReveal();
  initStickyCta();
  initBooking();
})();
