/**
 * Линия — общее хранилище заявок (localStorage).
 * Используется book.html (создание записи) и admin/index.html (список, статусы).
 *
 * Запись хранится в двух совместимых видах одновременно:
 *  - "родной" формат сайта: name, phone, service, date, time, comment, status...
 *  - зеркальные поля старого формата бота: service_title, service_price,
 *    contact, comment, created_at — на случай, если админка/выгрузка ждут
 *    именно такие ключи (см. importLegacyJson).
 *
 * Status: 'new' | 'confirmed' | 'done' | 'cancelled'
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "linia_bookings";
  var STATUSES = ["new", "confirmed", "done", "cancelled"];

  var SERVICES = {
    consult: { title: "Консультация косметолога", price: 1500, priceLabel: "1\u00a0500\u00a0₽" },
    care: { title: "Уход за лицом", price: 2800, priceLabel: "от 2\u00a0800\u00a0₽" },
    hardware: { title: "Аппаратная процедура", price: 4500, priceLabel: "от 4\u00a0500\u00a0₽" },
    inject: { title: "Инъекционная процедура", price: 6900, priceLabel: "от 6\u00a0900\u00a0₽" },
    epil: { title: "Эпиляция (зона)", price: 1200, priceLabel: "от 1\u00a0200\u00a0₽" },
  };

  function uid() {
    return (
      "bk_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8)
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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      /* localStorage unavailable (private mode / quota) — fail silently, demo only */
    }
  }

  function serviceInfo(key) {
    return SERVICES[key] || { title: key || "Услуга", price: 0, priceLabel: "\u2014" };
  }

  function normalize(partial) {
    var p = partial || {};
    var status = STATUSES.indexOf(p.status) >= 0 ? p.status : "new";
    var svc = serviceInfo(p.service);
    var createdAt = p.createdAt || p.created_at || new Date().toISOString();

    return {
      id: p.id || uid(),
      status: status,
      source: p.source || "site",
      service: String(p.service || "").trim(),
      serviceTitle: p.serviceTitle || p.service_title || svc.title,
      servicePrice: p.servicePrice || p.service_price || svc.priceLabel,
      name: String(p.name || "").trim(),
      phone: String(p.phone || p.contact || "").trim(),
      date: String(p.date || "").trim(),
      time: String(p.time || "").trim(),
      comment: String(p.comment || "").trim(),
      adminNote: String(p.adminNote || "").trim(),
      createdAt: createdAt,
      username: p.username || null,
    };
  }

  function create(partial) {
    var booking = normalize(partial);
    booking.status = "new";
    booking.createdAt = new Date().toISOString();
    booking.adminNote = "";
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

  function updateStatus(id, status) {
    if (!id || STATUSES.indexOf(status) < 0) return null;
    var all = readAll();
    var updated = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        all[i].status = status;
        updated = all[i];
        break;
      }
    }
    if (!updated) return null;
    writeAll(all);
    return updated;
  }

  function updateNote(id, note) {
    if (!id) return null;
    var all = readAll();
    var updated = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        all[i].adminNote = String(note || "").trim();
        updated = all[i];
        break;
      }
    }
    if (!updated) return null;
    writeAll(all);
    return updated;
  }

  function remove(id) {
    var all = readAll();
    var next = all.filter(function (b) {
      return b.id !== id;
    });
    writeAll(next);
    return next.length !== all.length;
  }

  function clearAll() {
    writeAll([]);
  }

  /** Merge bookings from a legacy bot-exported JSON array (data/applications.json style). */
  function importLegacyJson(items) {
    if (!Array.isArray(items)) throw new Error("Ожидался массив заявок");
    var all = readAll();
    var existingIds = {};
    all.forEach(function (b) {
      existingIds[b.id] = true;
    });
    var added = 0;
    items.forEach(function (raw) {
      var candidateId = raw.id != null ? "bot_" + raw.id : uid();
      if (existingIds[candidateId]) return;
      var normalized = normalize({
        id: candidateId,
        status: "new",
        source: "bot-import",
        service: raw.service || "",
        service_title: raw.service_title,
        service_price: raw.service_price,
        name: raw.name || raw.username || "",
        contact: raw.contact,
        date: raw.date,
        comment: raw.comment,
        created_at: raw.created_at,
        username: raw.username,
      });
      all.push(normalized);
      existingIds[candidateId] = true;
      added++;
    });
    writeAll(all);
    return added;
  }

  /** Insert a handful of demo bookings so the admin view is never empty on first look. */
  function seedDemo() {
    var samples = [
      {
        service: "inject",
        name: "Марина К.",
        phone: "+7 900 123-45-67",
        date: nextDate(1),
        time: "15:00",
        comment: "Биоревитализация, была в марте — повтор курса",
      },
      {
        service: "hardware",
        name: "Ольга П.",
        phone: "@olga_p",
        date: nextDate(2),
        time: "12:30",
        comment: "RF-лифтинг, интересует курс из 5 процедур",
      },
      {
        service: "epil",
        name: "Ирина С.",
        phone: "+7 903 555-20-14",
        date: nextDate(0),
        time: "18:00",
        comment: "Лазерная эпиляция, зона — голени",
      },
    ];
    var created = samples.map(function (s) {
      return create(s);
    });
    return created;
  }

  function nextDate(daysAhead) {
    var d = new Date();
    d.setDate(d.getDate() + daysAhead);
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  global.LiniaBookings = {
    create: create,
    list: list,
    get: get,
    updateStatus: updateStatus,
    updateNote: updateNote,
    remove: remove,
    clearAll: clearAll,
    importLegacyJson: importLegacyJson,
    seedDemo: seedDemo,
    services: SERVICES,
    STORAGE_KEY: STORAGE_KEY,
    STATUSES: STATUSES.slice(),
  };
})(typeof window !== "undefined" ? window : this);
