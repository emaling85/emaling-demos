/**
 * Слог — shared bookings store (localStorage)
 * Used by book.html (create) and admin.html (list / status).
 *
 * Status: 'new' | 'confirmed' | 'rejected' | 'done'
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "slog_bookings";
  var STATUSES = ["new", "confirmed", "rejected", "done"];

  function uid() {
    return (
      "b_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeAll(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function normalize(partial) {
    var p = partial || {};
    var status = STATUSES.indexOf(p.status) >= 0 ? p.status : "new";
    var pkg = p.package === "trial" ? "trial" : "month";
    var days = Array.isArray(p.days) ? p.days.slice() : [];

    return {
      id: p.id || uid(),
      name: String(p.name || "").trim(),
      contact: String(p.contact || "").trim(),
      subject: String(p.subject || "").trim(),
      format: String(p.format || "").trim(),
      package: pkg,
      days: days,
      time: String(p.time || "").trim(),
      hoursPerWeek: Number(p.hoursPerWeek) || 0,
      priceMonth: Number(p.priceMonth) || 0,
      priceLesson: Number(p.priceLesson) || 0,
      comment: String(p.comment || "").trim(),
      status: status,
      createdAt: p.createdAt || new Date().toISOString(),
      adminNote: String(p.adminNote || "").trim(),
    };
  }

  function create(partial) {
    var booking = normalize(partial);
    booking.status = "new";
    booking.createdAt = new Date().toISOString();
    booking.adminNote = "";
    if (!booking.id) booking.id = uid();

    var list = readAll();
    list.push(booking);
    writeAll(list);
    return booking;
  }

  function list() {
    return readAll()
      .slice()
      .sort(function (a, b) {
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });
  }

  function get(id) {
    if (!id) return null;
    var found = readAll().filter(function (b) {
      return b.id === id;
    })[0];
    return found || null;
  }

  function updateStatus(id, status, adminNote) {
    if (!id || STATUSES.indexOf(status) < 0) return null;
    var list = readAll();
    var updated = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].status = status;
        if (typeof adminNote === "string") {
          list[i].adminNote = adminNote.trim();
        }
        updated = list[i];
        break;
      }
    }
    if (!updated) return null;
    writeAll(list);
    return updated;
  }

  function updateNote(id, adminNote) {
    if (!id) return null;
    var list = readAll();
    var updated = null;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list[i].adminNote = String(adminNote || "").trim();
        updated = list[i];
        break;
      }
    }
    if (!updated) return null;
    writeAll(list);
    return updated;
  }

  /** Insert 2–3 fake `new` bookings for empty demo. */
  function seedDemo() {
    var samples = [
      {
        name: "Анна К.",
        contact: "@anna_k",
        subject: "math",
        format: "online",
        package: "month",
        days: ["tue", "thu"],
        time: "17:00",
        hoursPerWeek: 2,
        priceMonth: 19800,
        priceLesson: 2475,
        comment: "Профиль, цель 70+ · ЕГЭ/ОГЭ",
      },
      {
        name: "Игорь М.",
        contact: "+7 900 123-45-67",
        subject: "russian",
        format: "offline",
        package: "trial",
        days: ["sat"],
        time: "11:30",
        hoursPerWeek: 1,
        priceMonth: 1800,
        priceLesson: 1800,
        comment: "Пробное — 10 класс",
      },
      {
        name: "Мария С.",
        contact: "@maria_eng",
        subject: "english",
        format: "online",
        package: "month",
        days: ["mon", "wed", "fri"],
        time: "19:00",
        hoursPerWeek: 3,
        priceMonth: 21600,
        priceLesson: 1800,
        comment: "",
      },
    ];

    var created = [];
    for (var i = 0; i < samples.length; i++) {
      created.push(create(samples[i]));
    }
    return created;
  }

  global.SlogBookings = {
    create: create,
    list: list,
    get: get,
    updateStatus: updateStatus,
    updateNote: updateNote,
    seedDemo: seedDemo,
    STORAGE_KEY: STORAGE_KEY,
    STATUSES: STATUSES.slice(),
  };
})(typeof window !== "undefined" ? window : this);
