(function () {
  "use strict";

  var TG_LINK = "https://t.me/emaling_dev";
  var STORAGE_TABLE = "sazha_table";
  var STORAGE_CART = "sazha_cart";
  var STORAGE_ORDERS = "sazha_orders";
  var STORAGE_LAST = "sazha_last_order";
  var TABLE_MIN = 1;
  var TABLE_MAX = 12;
  var STATUS_LABELS = {
    new: "Новый",
    making: "Готовим",
    cooking: "Готовим", /* legacy alias */
    ready: "Можно забирать",
    done: "Закрыт",
  };
  var STATUS_FLOW = ["new", "making", "ready", "done"];
  var STATUS_ACTIONS = {
    new: { to: "making", label: "В работу" },
    making: { to: "ready", label: "К выдаче" },
    cooking: { to: "ready", label: "К выдаче" },
    ready: { to: "done", label: "Закрыть" },
  };
  var GUEST_STATUS_COPY = {
    new: "Заказ принят. Скоро поставим на бар.",
    making: "Готовим ваш заказ. Оставайтесь у стола — принесём или позовём.",
    cooking: "Готовим ваш заказ. Оставайтесь у стола — принесём или позовём.",
    ready: "Можно забирать у бара. Покажите номер заказа бариста.",
    done: "Заказ закрыт. Спасибо! Можно оформить новый со стола.",
  };

  function normalizeStatus(status) {
    if (status === "cooking") return "making";
    if (STATUS_FLOW.indexOf(status) !== -1) return status;
    return "new";
  }

  function isActiveStatus(status) {
    return normalizeStatus(status) !== "done";
  }

  var STORAGE_FAV = "sazha_favorites";
  var menuFilter = "all";
  var menuSearch = "";
  var favOnly = false;
  /** @type {Record<string, number>} selected size ml per menu item id */
  var selectedSizes = {};

  /* ——— helpers ——— */

  function formatPrice(n) {
    return Number(n).toLocaleString("ru-RU") + "\u00a0₽";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getItem(id) {
    if (!window.MENU) return null;
    for (var i = 0; i < window.MENU.length; i++) {
      if (window.MENU[i].id === id) return window.MENU[i];
    }
    return null;
  }

  function itemImage(item) {
    if (!item) return null;
    return item.image || item.photo || item.img || null;
  }

  function itemHasSizes(item) {
    return !!(item && item.sizes && item.sizes.length);
  }

  function defaultSizeMl(item) {
    if (!itemHasSizes(item)) return null;
    var mid = Math.floor((item.sizes.length - 1) / 2);
    return item.sizes[mid].ml;
  }

  function getSelectedSizeMl(item) {
    if (!itemHasSizes(item)) return null;
    var ml = selectedSizes[item.id];
    if (ml != null) {
      for (var i = 0; i < item.sizes.length; i++) {
        if (item.sizes[i].ml === ml) return ml;
      }
    }
    ml = defaultSizeMl(item);
    selectedSizes[item.id] = ml;
    return ml;
  }

  function getSizeOption(item, sizeMl) {
    if (!itemHasSizes(item)) return null;
    for (var i = 0; i < item.sizes.length; i++) {
      if (item.sizes[i].ml === sizeMl) return item.sizes[i];
    }
    return item.sizes[0] || null;
  }

  function linePrice(item, sizeMl) {
    if (!item) return 0;
    var opt = getSizeOption(item, sizeMl);
    return opt ? opt.price : item.price;
  }

  function lineDisplayName(item, sizeMl) {
    if (!item) return "";
    var opt = getSizeOption(item, sizeMl);
    if (opt) return item.name + " · " + opt.label;
    return item.name;
  }

  function lineKey(id, sizeMl) {
    return sizeMl != null ? id + "__" + sizeMl : id;
  }

  function parseLineKey(key) {
    var parts = String(key).split("__");
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      return { id: parts[0], sizeMl: parseInt(parts[1], 10) };
    }
    return { id: key, sizeMl: null };
  }

  function normalizeCartLine(line) {
    if (!line || !line.id) return null;
    var id = line.id;
    var sizeMl = line.sizeMl != null ? Number(line.sizeMl) : null;
    if (sizeMl == null && String(id).indexOf("__") !== -1) {
      var parsed = parseLineKey(id);
      id = parsed.id;
      sizeMl = parsed.sizeMl;
    }
    var item = getItem(id);
    if (!item) return null;
    if (itemHasSizes(item)) {
      if (sizeMl == null) sizeMl = defaultSizeMl(item);
      if (!getSizeOption(item, sizeMl)) sizeMl = defaultSizeMl(item);
    } else {
      sizeMl = null;
    }
    return {
      id: id,
      sizeMl: sizeMl,
      qty: Math.max(0, parseInt(line.qty, 10) || 0),
      key: lineKey(id, sizeMl),
    };
  }

  /** Demitasse (espresso) vs tumbler; scale by ml so 200<<300<<400 is obvious */
  function cupSvgHtml(item, sizeOpt, sizeIndex, selected) {
    var isEspresso = item.id === "espresso";
    var ml = sizeOpt.ml;
    var sizes = item.sizes;
    var minMl = sizes[0].ml;
    var maxMl = sizes[sizes.length - 1].ml;
    var t =
      maxMl === minMl
        ? 0.5
        : Math.max(0, Math.min(1, (ml - minMl) / (maxMl - minMl)));
    var cls = "size-cup" + (selected ? " is-selected" : "");
    var stroke = selected ? "var(--saffron)" : "currentColor";
    var ceramic = selected
      ? "rgba(201, 162, 74, 0.2)"
      : "rgba(239, 233, 224, 0.1)";
    var ceramicInner = selected
      ? "rgba(201, 162, 74, 0.08)"
      : "rgba(239, 233, 224, 0.04)";
    var liquid = selected
      ? "rgba(168, 134, 53, 0.72)"
      : "rgba(24, 22, 20, 0.94)";
    var liquidTop = selected
      ? "rgba(232, 200, 120, 0.78)"
      : "rgba(58, 52, 44, 0.98)";
    var rimFill = selected
      ? "rgba(239, 233, 224, 0.22)"
      : "rgba(239, 233, 224, 0.12)";
    var shadow = selected
      ? "rgba(201, 162, 74, 0.32)"
      : "rgba(0, 0, 0, 0.4)";

    var body;
    if (isEspresso) {
      /* demitasse + saucer; 30 ml smaller than 60 ml */
      var s = 0.78 + t * 0.22;
      var cx = 22;
      var rimRy = 2.4 * s;
      var rimRx = 9.2 * s;
      var cupH = 16 + t * 5;
      var rimY = 50 - 8 - cupH;
      var baseY = rimY + cupH;
      var wallInset = 1.6 * s;
      var liqY = rimY + 3.2 * s;
      var liqRx = rimRx - 1.8;
      var liqRy = rimRy * 0.85;
      var handleX = cx + rimRx;
      var saucerRx = 13.5 * s;
      body =
        '<ellipse class="size-cup__shadow" cx="' +
        cx +
        '" cy="52.5" rx="' +
        (saucerRx * 0.92) +
        '" ry="2.1" fill="' +
        shadow +
        '"/>' +
        '<ellipse class="size-cup__saucer" cx="' +
        cx +
        '" cy="50.2" rx="' +
        saucerRx +
        '" ry="2.6" fill="' +
        ceramic +
        '" stroke="' +
        stroke +
        '" stroke-width="1.15"/>' +
        '<ellipse cx="' +
        cx +
        '" cy="49.4" rx="' +
        (saucerRx * 0.72) +
        '" ry="1.6" fill="none" stroke="' +
        stroke +
        '" stroke-width="0.7" opacity="0.45"/>' +
        '<path class="size-cup__body" d="M' +
        (cx - rimRx) +
        ' ' +
        rimY +
        ' C' +
        (cx - rimRx - 0.4) +
        ' ' +
        (rimY + cupH * 0.45) +
        ' ' +
        (cx - rimRx + wallInset) +
        ' ' +
        (baseY - 1.2) +
        ' ' +
        (cx - rimRx + wallInset * 1.4) +
        ' ' +
        baseY +
        ' L' +
        (cx + rimRx - wallInset * 1.4) +
        ' ' +
        baseY +
        ' C' +
        (cx + rimRx - wallInset) +
        ' ' +
        (baseY - 1.2) +
        ' ' +
        (cx + rimRx + 0.4) +
        ' ' +
        (rimY + cupH * 0.45) +
        ' ' +
        (cx + rimRx) +
        ' ' +
        rimY +
        ' Z" fill="' +
        ceramic +
        '" stroke="' +
        stroke +
        '" stroke-width="1.25" stroke-linejoin="round"/>' +
        '<path d="M' +
        (cx - liqRx) +
        ' ' +
        liqY +
        ' C' +
        (cx - liqRx + 0.3) +
        ' ' +
        (liqY + cupH * 0.35) +
        ' ' +
        (cx - rimRx + wallInset * 1.8) +
        ' ' +
        (baseY - 2.4) +
        ' ' +
        (cx - rimRx + wallInset * 2) +
        ' ' +
        (baseY - 2) +
        ' L' +
        (cx + rimRx - wallInset * 2) +
        ' ' +
        (baseY - 2) +
        ' C' +
        (cx + rimRx - wallInset * 1.8) +
        ' ' +
        (baseY - 2.4) +
        ' ' +
        (cx + liqRx - 0.3) +
        ' ' +
        (liqY + cupH * 0.35) +
        ' ' +
        (cx + liqRx) +
        ' ' +
        liqY +
        ' Z" fill="' +
        liquid +
        '"/>' +
        '<ellipse cx="' +
        cx +
        '" cy="' +
        liqY +
        '" rx="' +
        liqRx +
        '" ry="' +
        liqRy +
        '" fill="' +
        liquidTop +
        '"/>' +
        '<ellipse class="size-cup__rim" cx="' +
        cx +
        '" cy="' +
        rimY +
        '" rx="' +
        rimRx +
        '" ry="' +
        rimRy +
        '" fill="' +
        rimFill +
        '" stroke="' +
        stroke +
        '" stroke-width="1.35"/>' +
        '<ellipse cx="' +
        cx +
        '" cy="' +
        rimY +
        '" rx="' +
        (rimRx - 1.5) +
        '" ry="' +
        (rimRy * 0.7) +
        '" fill="' +
        ceramicInner +
        '"/>' +
        '<path class="size-cup__handle" d="M' +
        handleX +
        ' ' +
        (rimY + 2.2) +
        ' C' +
        (handleX + 7.2 * s) +
        ' ' +
        (rimY + 2) +
        ' ' +
        (handleX + 7.4 * s) +
        ' ' +
        (rimY + cupH * 0.62) +
        ' ' +
        handleX +
        ' ' +
        (rimY + cupH * 0.68) +
        '" fill="none" stroke="' +
        stroke +
        '" stroke-width="' +
        (1.45 * s) +
        '" stroke-linecap="round"/>';
    } else {
      /* conical tumbler: height/width grow with ml (200 < 300 < 400) */
      var h = 24 + t * 20;
      var topW = 16 + t * 11;
      var botW = 12 + t * 7;
      var cx2 = 24;
      var topX = cx2 - topW / 2;
      var botX = cx2 - botW / 2;
      var y = 50 - h;
      var liqLevel = 0.42 + t * 0.06;
      var midY = y + h * liqLevel;
      var midW = topW + (botW - topW) * liqLevel;
      var midX = cx2 - midW / 2;
      var rimRy2 = 2.1 + t * 0.55;
      var liqRy2 = 1.7 + t * 0.4;
      var pad = 1.6;
      body =
        '<ellipse class="size-cup__shadow" cx="' +
        cx2 +
        '" cy="52.2" rx="' +
        (botW * 0.58 + 2) +
        '" ry="2.2" fill="' +
        shadow +
        '"/>' +
        '<path class="size-cup__body" d="M' +
        topX +
        ' ' +
        y +
        ' L' +
        (topX + topW) +
        ' ' +
        y +
        ' L' +
        (botX + botW) +
        ' ' +
        (y + h) +
        ' L' +
        botX +
        ' ' +
        (y + h) +
        ' Z" fill="' +
        ceramic +
        '" stroke="' +
        stroke +
        '" stroke-width="1.3" stroke-linejoin="round"/>' +
        '<path class="size-cup__liquid" d="M' +
        (midX + pad * 0.35) +
        ' ' +
        midY +
        ' L' +
        (midX + midW - pad * 0.35) +
        ' ' +
        midY +
        ' L' +
        (botX + botW - pad) +
        ' ' +
        (y + h - 1.2) +
        ' L' +
        (botX + pad) +
        ' ' +
        (y + h - 1.2) +
        ' Z" fill="' +
        liquid +
        '"/>' +
        '<ellipse cx="' +
        cx2 +
        '" cy="' +
        midY +
        '" rx="' +
        (midW / 2 - pad * 0.2) +
        '" ry="' +
        liqRy2 +
        '" fill="' +
        liquidTop +
        '"/>' +
        '<ellipse class="size-cup__rim" cx="' +
        cx2 +
        '" cy="' +
        y +
        '" rx="' +
        topW / 2 +
        '" ry="' +
        rimRy2 +
        '" fill="' +
        rimFill +
        '" stroke="' +
        stroke +
        '" stroke-width="1.4"/>' +
        '<ellipse cx="' +
        cx2 +
        '" cy="' +
        y +
        '" rx="' +
        (topW / 2 - 1.8) +
        '" ry="' +
        (rimRy2 * 0.65) +
        '" fill="' +
        ceramicInner +
        '"/>' +
        '<path d="M' +
        (botX + 0.6) +
        ' ' +
        (y + h) +
        ' Q' +
        cx2 +
        ' ' +
        (y + h + 1.6) +
        ' ' +
        (botX + botW - 0.6) +
        ' ' +
        (y + h) +
        '" fill="none" stroke="' +
        stroke +
        '" stroke-width="1" opacity="0.45"/>';
    }

    return (
      '<svg class="' +
      cls +
      '" viewBox="0 0 48 56" width="44" height="52" aria-hidden="true">' +
      body +
      '</svg>'
    );
  }

  /** S / M / L codes for cup row (2 sizes → S/L) */
  function sizeLetter(item, idx) {
    var n = item.sizes.length;
    if (n === 2) return idx === 0 ? "S" : "L";
    if (n === 3) return ["S", "M", "L"][idx];
    if (n === 4) return ["S", "M", "L", "XL"][idx];
    return String(idx + 1);
  }

  function sizePickerHtml(item) {
    if (!itemHasSizes(item)) return "";
    var selected = getSelectedSizeMl(item);
    var buttons = item.sizes
      .map(function (opt, idx) {
        var isOn = opt.ml === selected;
        var letter = sizeLetter(item, idx);
        return (
          '<button type="button" class="size-option' +
          (isOn ? " is-selected" : "") +
          '" data-size-item="' +
          escapeHtml(item.id) +
          '" data-size-ml="' +
          opt.ml +
          '" aria-pressed="' +
          (isOn ? "true" : "false") +
          '" aria-label="' +
          letter +
          ", " +
          escapeHtml(opt.label) +
          ", " +
          formatPrice(opt.price) +
          '">' +
          cupSvgHtml(item, opt, idx, isOn) +
          '<span class="size-option__code">' +
          letter +
          "</span>" +
          '<span class="size-option__label">' +
          escapeHtml(opt.label) +
          "</span>" +
          '<span class="size-option__price">' +
          formatPrice(opt.price) +
          "</span></button>"
        );
      })
      .join("");
    return (
      '<div class="size-picker" role="group" aria-label="Выберите объём">' +
      '<p class="size-picker__hint">Объём · цена рядом с чашкой</p>' +
      '<div class="size-picker__row">' +
      buttons +
      "</div></div>"
    );
  }

  function clampTable(n) {
    var t = parseInt(n, 10);
    if (isNaN(t) || t < TABLE_MIN) return 1;
    if (t > TABLE_MAX) return TABLE_MAX;
    return t;
  }

  /* URL ?table= читается один раз при init; дальше источник истины — localStorage */
  function getTable() {
    try {
      var saved = localStorage.getItem(STORAGE_TABLE);
      if (saved) return clampTable(saved);
    } catch (e) {}
    return 1;
  }

  function setTable(n) {
    var t = clampTable(n);
    try {
      localStorage.setItem(STORAGE_TABLE, String(t));
    } catch (e) {}
    return t;
  }

  function absorbTableFromUrl() {
    var params = new URLSearchParams(window.location.search);
    if (!params.has("table")) return getTable();
    return setTable(params.get("table"));
  }

  function replaceTableQuery(t) {
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("table", String(t));
      history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function syncTableLinks(table) {
    table = table == null ? getTable() : table;
    var qrMenu = document.getElementById("qr-menu-link");
    if (qrMenu) qrMenu.href = "menu.html?table=" + table;
    document.querySelectorAll("[data-cart-link]").forEach(function (a) {
      a.href = "order.html?table=" + table;
    });
    document.querySelectorAll("[data-table-link]").forEach(function (a) {
      var page = a.getAttribute("data-table-link");
      if (page) a.href = page + (page.indexOf("?") >= 0 ? "&" : "?") + "table=" + table;
    });
    var homeCta = document.querySelector("[data-home-order]");
    if (homeCta) homeCta.href = "qr.html?table=" + table;
  }

  function applyTable(n) {
    var t = setTable(n);
    replaceTableQuery(t);
    paintTableBadges();
    syncTableLinks(t);
    initStepBar();
    updateCartBar();
    var select = document.getElementById("table-select");
    if (select && select.value !== String(t)) select.value = String(t);
    return t;
  }

  function fillTableSelect(select, current) {
    if (!select) return;
    select.innerHTML = "";
    for (var i = TABLE_MIN; i <= TABLE_MAX; i++) {
      var opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = "Стол " + i;
      if (i === current) opt.selected = true;
      select.appendChild(opt);
    }
  }

  function bindTableSelect(select) {
    if (!select || select.getAttribute("data-bound") === "1") return;
    select.setAttribute("data-bound", "1");
    select.addEventListener("change", function () {
      applyTable(select.value);
    });
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_CART);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data
        .map(normalizeCartLine)
        .filter(function (line) {
          return line && line.qty > 0;
        });
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      var slim = cart.map(function (line) {
        var row = { id: line.id, qty: line.qty };
        if (line.sizeMl != null) row.sizeMl = line.sizeMl;
        return row;
      });
      localStorage.setItem(STORAGE_CART, JSON.stringify(slim));
    } catch (e) {}
  }

  function sameLine(a, id, sizeMl) {
    if (a.id !== id) return false;
    var aMl = a.sizeMl != null ? a.sizeMl : null;
    var bMl = sizeMl != null ? sizeMl : null;
    return aMl === bMl;
  }

  function cartQty(cart, id, sizeMl) {
    for (var i = 0; i < cart.length; i++) {
      if (sameLine(cart[i], id, sizeMl)) return cart[i].qty;
    }
    return 0;
  }

  function cartCount(cart) {
    return cart.reduce(function (s, line) {
      return s + line.qty;
    }, 0);
  }

  function cartTotal(cart) {
    return cart.reduce(function (s, line) {
      var item = getItem(line.id);
      return s + linePrice(item, line.sizeMl) * line.qty;
    }, 0);
  }

  function addToCart(id, delta, sizeMl) {
    delta = delta || 1;
    var item = getItem(id);
    if (itemHasSizes(item) && sizeMl == null) {
      sizeMl = getSelectedSizeMl(item);
    }
    if (!itemHasSizes(item)) sizeMl = null;
    var cart = loadCart();
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (sameLine(cart[i], id, sizeMl)) {
        cart[i].qty += delta;
        if (cart[i].qty <= 0) cart.splice(i, 1);
        found = true;
        break;
      }
    }
    if (!found && delta > 0) {
      cart.push({
        id: id,
        sizeMl: sizeMl,
        qty: delta,
        key: lineKey(id, sizeMl),
      });
    }
    saveCart(cart);
    return cart;
  }

  function setCartQty(id, qty, sizeMl) {
    var item = getItem(id);
    if (itemHasSizes(item) && sizeMl == null) {
      sizeMl = getSelectedSizeMl(item);
    }
    if (!itemHasSizes(item)) sizeMl = null;
    var cart = loadCart();
    var n = Math.max(0, parseInt(qty, 10) || 0);
    var found = false;
    for (var i = 0; i < cart.length; i++) {
      if (sameLine(cart[i], id, sizeMl)) {
        if (n <= 0) cart.splice(i, 1);
        else cart[i].qty = n;
        found = true;
        break;
      }
    }
    if (!found && n > 0) {
      cart.push({
        id: id,
        sizeMl: sizeMl,
        qty: n,
        key: lineKey(id, sizeMl),
      });
    }
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function loadFavorites() {
    try {
      var raw = localStorage.getItem(STORAGE_FAV);
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites(list) {
    try {
      localStorage.setItem(STORAGE_FAV, JSON.stringify(list));
    } catch (e) {}
  }

  function isFavorite(id) {
    return loadFavorites().indexOf(id) !== -1;
  }

  function toggleFavorite(id) {
    var list = loadFavorites();
    var idx = list.indexOf(id);
    if (idx === -1) list.push(id);
    else list.splice(idx, 1);
    saveFavorites(list);
    return idx === -1;
  }

  function loadOrders() {
    try {
      var raw = localStorage.getItem(STORAGE_ORDERS);
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];
      return data.map(function (o) {
        if (!o || typeof o !== "object") return o;
        var status = normalizeStatus(o.status);
        if (status !== o.status) o.status = status;
        return o;
      });
    } catch (e) {
      return [];
    }
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch (e) {}
  }

  function formatOrderTime(ts) {
    var d = new Date(ts || Date.now());
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  function formatElapsed(ts) {
    var elapsed = Math.max(0, Math.floor((Date.now() - (ts || Date.now())) / 1000));
    var m = Math.floor(elapsed / 60);
    var s = elapsed % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function orderItemsHtml(items) {
    return (items || [])
      .map(function (line) {
        var name = escapeHtml(line.name || "");
        /* name уже с объёмом («Латте · 300 мл»); sizeMl — запасной показ */
        var hasVolInName = /мл/i.test(line.name || "");
        var vol =
          !hasVolInName && line.sizeMl != null
            ? ' <span class="admin-card__vol">' + line.sizeMl + "&nbsp;мл</span>"
            : "";
        return (
          "<li><span>" +
          name +
          vol +
          " ×" +
          line.qty +
          "</span><span>" +
          formatPrice(line.price * line.qty) +
          "</span></li>"
        );
      })
      .join("");
  }

  function nextOrderNumber() {
    var orders = loadOrders();
    var max = 100;
    orders.forEach(function (o) {
      if (o.number > max) max = o.number;
    });
    return max + 1;
  }

  function createOrder(opts) {
    var cart = loadCart();
    var items = cart
      .map(function (line) {
        var item = getItem(line.id);
        if (!item) return null;
        return {
          id: item.id,
          sizeMl: line.sizeMl != null ? line.sizeMl : null,
          name: lineDisplayName(item, line.sizeMl),
          price: linePrice(item, line.sizeMl),
          qty: line.qty,
        };
      })
      .filter(Boolean);

    var order = {
      id: "o-" + Date.now().toString(36),
      number: nextOrderNumber(),
      table: getTable(),
      items: items,
      total: cartTotal(cart),
      comment: (opts && opts.comment) || "",
      payMethod: (opts && opts.payMethod) || "card",
      status: "new",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    var orders = loadOrders();
    orders.unshift(order);
    saveOrders(orders);
    try {
      localStorage.setItem(STORAGE_LAST, order.id);
    } catch (e) {}
    clearCart();
    return order;
  }

  function getOrder(id) {
    var orders = loadOrders();
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === id) return orders[i];
    }
    return null;
  }

  function updateOrderStatus(id, status) {
    var orders = loadOrders();
    var next = normalizeStatus(status);
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === id) {
        orders[i].status = next;
        orders[i].updatedAt = Date.now();
        saveOrders(orders);
        return orders[i];
      }
    }
    return null;
  }

  function prefersReducedMotion() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function flashToast(text) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.body.appendChild(el);
    if (prefersReducedMotion()) {
      el.classList.add("is-visible");
      setTimeout(function () {
        el.remove();
      }, 1200);
      return;
    }
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        el.remove();
      }, 200);
    }, 1400);
  }

  function pulseCartBadge() {
    if (prefersReducedMotion()) return;
    var el = document.querySelector("[data-cart-count]");
    if (!el) return;
    el.classList.remove("is-pulse");
    void el.offsetWidth;
    el.classList.add("is-pulse");
  }

  function buildTelegramText(order) {
    var lines = [
      "Заказ «Сажа» #" + order.number,
      "Стол: " + order.table,
      "Статус: " +
        (STATUS_LABELS[normalizeStatus(order.status)] || order.status),
      "",
    ];
    order.items.forEach(function (line) {
      lines.push(line.name + " ×" + line.qty + " — " + formatPrice(line.price * line.qty));
    });
    lines.push("", "Итого: " + formatPrice(order.total));
    if (order.comment) lines.push("Комментарий: " + order.comment);
    return lines.join("\n");
  }

  /* ——— UI shared ——— */

  function initNavToggle() {
    var btn = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal:not(.is-in)");
    if (!nodes.length) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) {
        n.classList.add("is-in");
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  function paintTableBadges() {
    var table = getTable();
    document.querySelectorAll("[data-table-num]").forEach(function (el) {
      el.textContent = String(table);
    });
  }

  function updateCartBar() {
    var bar = document.getElementById("cart-bar");
    if (!bar) return;
    var cart = loadCart();
    var count = cartCount(cart);
    var total = cartTotal(cart);
    var countEl = bar.querySelector("[data-cart-count]");
    var totalEl = bar.querySelector("[data-cart-total]");
    var tableEl = bar.querySelector("[data-cart-table]");
    if (countEl) countEl.textContent = String(count);
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (tableEl) tableEl.textContent = String(getTable());
    var wasHidden = bar.hidden;
    bar.hidden = count === 0;
    document.body.classList.toggle("has-cart-bar", count > 0);
    if (count > 0 && wasHidden) {
      bar.classList.remove("cart-bar--pulse");
      void bar.offsetWidth;
      bar.classList.add("cart-bar--pulse");
    }
  }

  function menuItemMediaHtml(item) {
    var src = itemImage(item);
    if (src) {
      return (
        '<div class="menu-item__media">' +
        '<img src="' +
        escapeHtml(src) +
        '" alt="" loading="lazy" width="96" height="96" />' +
        "</div>"
      );
    }
    return (
      '<div class="menu-item__media menu-item__media--placeholder" aria-hidden="true"></div>'
    );
  }

  function itemMetaHtml(item) {
    var bits = [];
    if (itemHasSizes(item)) {
      /* volume shown via size picker */
    } else if (item.volume) {
      bits.push(escapeHtml(item.volume));
    }
    if (item.prepMin) bits.push("~" + item.prepMin + "&nbsp;мин");
    if (!bits.length) return "";
    return (
      '<p class="menu-item__meta">' + bits.join(" · ") + "</p>"
    );
  }

  function initStickyChips() {
    var sticky = document.getElementById("chips-sticky");
    if (!sticky) return;
    var sentinel = document.createElement("div");
    sentinel.className = "chips-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    sticky.parentNode.insertBefore(sentinel, sticky);
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          sticky.classList.toggle("is-stuck", !entry.isIntersecting);
        });
      },
      { rootMargin: "-1px 0px 0px 0px", threshold: 0 }
    );
    io.observe(sentinel);
  }

  /* ——— pages ——— */

  function initQrPage() {
    var root = document.querySelector("[data-page='qr']");
    if (!root) return;
    var table = getTable();
    paintTableBadges();
    syncTableLinks(table);

    var select = document.getElementById("table-select");
    fillTableSelect(select, table);
    bindTableSelect(select);
  }

  function matchesFilter(item, filter) {
    if (filter === "all") return true;
    return item.category === filter;
  }

  function itemVisible(item) {
    if (!matchesFilter(item, menuFilter)) return false;
    if (favOnly && !isFavorite(item.id)) return false;
    if (menuSearch) {
      var hay = (item.name + " " + (item.desc || "")).toLowerCase();
      if (hay.indexOf(menuSearch) === -1) return false;
    }
    return true;
  }

  function renderMenuChips(container) {
    if (!container || !window.MENU_CATEGORIES) return;
    container.innerHTML = window.MENU_CATEGORIES.map(function (chip) {
      var active = menuFilter === chip.id ? " is-active" : "";
      return (
        '<button type="button" class="chip' +
        active +
        '" data-filter="' +
        escapeHtml(chip.id) +
        '" aria-pressed="' +
        (menuFilter === chip.id ? "true" : "false") +
        '">' +
        escapeHtml(chip.label) +
        "</button>"
      );
    }).join("");

    container.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        menuFilter = btn.getAttribute("data-filter");
        renderMenuChips(container);
        renderOrderMenu(document.getElementById("menu-list"));
      });
    });
  }

  function renderOrderMenu(container) {
    if (!container || !window.MENU) return;
    var cart = loadCart();
    var items = window.MENU.filter(itemVisible);

    var countEl = document.getElementById("menu-count");
    if (countEl) {
      countEl.innerHTML =
        'Показано <span class="menu-count__num">' +
        items.length +
        "</span> из " +
        window.MENU.length;
    }

    if (!items.length) {
      var emptyTitle = "Здесь пока пусто";
      var emptyText = "В этой категории нет позиций. Выберите другой чип сверху — или «Все».";
      if (favOnly) {
        emptyTitle = "Пока без избранного";
        emptyText = "Нажмите ★ на карточке напитка или блюда — он появится здесь.";
      } else if (menuSearch) {
        emptyTitle = "Ничего не нашли";
        emptyText = "Попробуйте другое слово или сбросьте поиск.";
      }
      container.innerHTML =
        '<div class="empty empty--menu">' +
        '<div class="empty__mark" aria-hidden="true"><span class="empty__glyph">∅</span></div>' +
        '<p class="empty__eyebrow">' + (favOnly ? "Избранное" : "Категория") + "</p>" +
        "<h2>" + emptyTitle + "</h2>" +
        "<p>" + emptyText + "</p>" +
        "</div>";
      return;
    }

    container.innerHTML = items
      .map(function (item) {
        var sizeMl = getSelectedSizeMl(item);
        var price = linePrice(item, sizeMl);
        var qty = cartQty(cart, item.id, sizeMl);
        var key = lineKey(item.id, sizeMl);
        var fav = isFavorite(item.id);
        return (
          '<article class="menu-item menu-item--cart menu-item--with-media menu-card' +
          (itemHasSizes(item) ? " menu-item--sized" : "") +
          '">' +
          '<button type="button" class="fav-btn' +
          (fav ? " is-fav" : "") +
          '" data-fav="' +
          escapeHtml(item.id) +
          '" aria-pressed="' +
          (fav ? "true" : "false") +
          '" aria-label="' +
          (fav ? "Убрать из избранного" : "В избранное") +
          '">★</button>' +
          menuItemMediaHtml(item) +
          '<div class="menu-item__body">' +
          '<p class="menu-item__name">' +
          escapeHtml(item.name) +
          "</p>" +
          '<p class="menu-item__price" data-price-for="' +
          escapeHtml(item.id) +
          '">' +
          formatPrice(price) +
          "</p>" +
          '<p class="menu-item__desc">' +
          escapeHtml(item.desc) +
          (item.tag
            ? ' <span class="menu-item__tag">' + escapeHtml(item.tag) + "</span>"
            : "") +
          "</p>" +
          itemMetaHtml(item) +
          sizePickerHtml(item) +
          '<div class="qty-controls" data-item-id="' +
          escapeHtml(item.id) +
          '" data-line-key="' +
          escapeHtml(key) +
          '">' +
          (qty === 0
            ? '<button type="button" class="btn btn--small btn--moss" data-add="' +
              escapeHtml(item.id) +
              '" data-size-ml="' +
              (sizeMl != null ? sizeMl : "") +
              '">В заказ</button>'
            : '<button type="button" class="qty-btn" data-dec="' +
              escapeHtml(item.id) +
              '" data-size-ml="' +
              (sizeMl != null ? sizeMl : "") +
              '" aria-label="Убрать">−</button>' +
              '<span class="qty-val">' +
              qty +
              "</span>" +
              '<button type="button" class="qty-btn" data-inc="' +
              escapeHtml(item.id) +
              '" data-size-ml="' +
              (sizeMl != null ? sizeMl : "") +
              '" aria-label="Добавить">+</button>') +
          "</div></div></article>"
        );
      })
      .join("");

    container.querySelectorAll("[data-fav]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isOn = toggleFavorite(btn.getAttribute("data-fav"));
        btn.classList.toggle("is-fav", isOn);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
        btn.setAttribute("aria-label", isOn ? "Убрать из избранного" : "В избранное");
        if (favOnly && !isOn) renderOrderMenu(container);
      });
    });

    function sizeFromBtn(btn) {
      var raw = btn.getAttribute("data-size-ml");
      if (raw === "" || raw == null) return null;
      var n = parseInt(raw, 10);
      return isNaN(n) ? null : n;
    }

    container.querySelectorAll("[data-size-item]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-size-item");
        var ml = parseInt(btn.getAttribute("data-size-ml"), 10);
        selectedSizes[id] = ml;
        renderOrderMenu(container);
        updateCartBar();
      });
    });

    container.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(btn.getAttribute("data-add"), 1, sizeFromBtn(btn));
        flashToast("В заказе · стол " + getTable());
        renderOrderMenu(container);
        updateCartBar();
        pulseCartBadge();
      });
    });
    container.querySelectorAll("[data-inc]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(btn.getAttribute("data-inc"), 1, sizeFromBtn(btn));
        flashToast("Добавлено");
        renderOrderMenu(container);
        updateCartBar();
        pulseCartBadge();
      });
    });
    container.querySelectorAll("[data-dec]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(btn.getAttribute("data-dec"), -1, sizeFromBtn(btn));
        renderOrderMenu(container);
        updateCartBar();
      });
    });
  }

  function initMenuPage() {
    if (!document.getElementById("menu-list")) return;
    var table = getTable();
    paintTableBadges();
    syncTableLinks(table);

    var select = document.getElementById("table-select");
    fillTableSelect(select, table);
    bindTableSelect(select);

    initStickyChips();
    renderMenuChips(document.getElementById("menu-chips"));

    var params = new URLSearchParams(window.location.search);
    var catParam = params.get("cat");
    if (catParam && window.MENU_CATEGORIES) {
      var known = window.MENU_CATEGORIES.some(function (c) {
        return c.id === catParam;
      });
      if (known) {
        menuFilter = catParam;
        renderMenuChips(document.getElementById("menu-chips"));
      }
    }

    var menuList = document.getElementById("menu-list");
    renderOrderMenu(menuList);
    updateCartBar();

    var searchInput = document.getElementById("menu-search");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        menuSearch = searchInput.value.trim().toLowerCase();
        renderOrderMenu(menuList);
      });
    }

    var favToggle = document.getElementById("menu-fav-toggle");
    if (favToggle) {
      favToggle.addEventListener("click", function () {
        favOnly = !favOnly;
        favToggle.classList.toggle("is-active", favOnly);
        favToggle.setAttribute("aria-pressed", favOnly ? "true" : "false");
        renderOrderMenu(menuList);
      });
    }
  }

  function renderTodayBean(container) {
    if (!container || !window.TODAY_BEAN) return;
    var b = window.TODAY_BEAN;
    var compact = container.classList.contains("bean-block--compact");
    var visualHtml = b.image
      ? '<img src="' +
        escapeHtml(b.image) +
        '" alt="Зерно: ' +
        escapeHtml(b.name) +
        '" loading="lazy" />'
      : '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
        '<ellipse cx="90" cy="120" rx="38" ry="22" fill="#2a2621" transform="rotate(-35 90 120)"/>' +
        '<ellipse cx="90" cy="120" rx="38" ry="22" fill="none" stroke="#c9a24a" stroke-width="1.2" transform="rotate(-35 90 120)" opacity="0.5"/>' +
        '<path d="M70 108 Q90 120 110 132" fill="none" stroke="#a88635" stroke-width="1.5" opacity="0.6"/>' +
        '<ellipse cx="180" cy="80" rx="42" ry="24" fill="#221f1b" transform="rotate(20 180 80)"/>' +
        '<ellipse cx="280" cy="140" rx="48" ry="28" fill="#2a2621" transform="rotate(-15 280 140)"/>' +
        '<path d="M250 128 Q280 140 310 152" fill="none" stroke="#a88635" stroke-width="1.5" opacity="0.55"/>' +
        "</svg>";
    container.innerHTML =
      '<div class="bean-block__visual" aria-hidden="true">' +
      visualHtml +
      "</div>" +
      "<div>" +
      '<p class="eyebrow">Сегодня в зёрнах</p>' +
      '<p class="bean-block__name">' +
      escapeHtml(b.name) +
      "</p>" +
      '<p class="bean-block__meta">' +
      escapeHtml(b.origin) +
      "</p>" +
      '<p class="bean-block__notes">' +
      escapeHtml(b.notes) +
      "</p>" +
      (compact
        ? ""
        : '<ul class="bean-facts">' +
          "<li><span>Обжарка</span><span>" +
          escapeHtml(b.roast) +
          "</span></li>" +
          "<li><span>Процесс</span><span>" +
          escapeHtml(b.process) +
          "</span></li>" +
          (b.brew
            ? "<li><span>Готовим</span><span>" + escapeHtml(b.brew) + "</span></li>"
            : "") +
          "</ul>") +
      "</div>";
  }

  function renderHomeHits(container) {
    if (!container || !window.MENU) return;
    var hits = window.MENU.filter(function (item) {
      return item.tag === "хит" || item.tag === "specialty" || item.tag === "сегодня";
    }).slice(0, 4);
    if (hits.length < 3) hits = window.MENU.slice(0, 4);
    var table = getTable();
    container.innerHTML = hits
      .map(function (item) {
        var price = linePrice(item, defaultSizeMl(item));
        return (
          '<a class="menu-item menu-item--with-media menu-card menu-card--link reveal" href="qr.html?table=' +
          table +
          '" aria-label="' +
          escapeHtml(item.name) +
          ' — демо: заказ со стола">' +
          menuItemMediaHtml(item) +
          '<div class="menu-item__body">' +
          '<p class="menu-item__name">' +
          escapeHtml(item.name) +
          "</p>" +
          '<p class="menu-item__price">' +
          formatPrice(price) +
          "</p>" +
          '<p class="menu-item__desc">' +
          escapeHtml(item.desc) +
          "</p>" +
          itemMetaHtml(item) +
          "</div></a>"
        );
      })
      .join("");
    var cta = document.querySelector("[data-home-order]");
    if (cta) cta.href = "qr.html?table=" + table;
  }

  /** Пройденные шаги step-bar — кликабельны; текущий и будущие — нет */
  function initStepBar() {
    var bar = document.querySelector(".step-bar");
    if (!bar) return;
    var table = getTable();
    var routes = [
      "qr.html?table=" + table,
      "menu.html?table=" + table,
      "order.html?table=" + table,
      "pay.html?table=" + table,
    ];
    bar.querySelectorAll("ol > li").forEach(function (li, i) {
      if (!li.classList.contains("is-done")) return;
      var href = routes[i];
      if (!href) return;
      if (i === 3 && !loadCart().length) return;
      var existing = li.querySelector("a.step-bar__link");
      if (existing) {
        existing.href = href;
        return;
      }
      var labelEl = li.querySelector(".step-bar__label");
      var a = document.createElement("a");
      a.className = "step-bar__link";
      a.href = href;
      a.setAttribute(
        "aria-label",
        "К шагу: " + (labelEl ? labelEl.textContent : String(i + 1))
      );
      while (li.firstChild) a.appendChild(li.firstChild);
      li.appendChild(a);
    });
  }

  function initCartPage() {
    var root = document.querySelector("[data-page='cart']");
    if (!root) return;
    paintTableBadges();
    syncTableLinks(getTable());

    function render() {
      var cart = loadCart();
      var list = document.getElementById("cart-list");
      var empty = document.getElementById("cart-empty");
      var form = document.getElementById("cart-form");
      var totalEl = document.getElementById("cart-total");

      if (!cart.length) {
        if (empty) empty.hidden = false;
        if (form) form.hidden = true;
        if (list) list.innerHTML = "";
        return;
      }
      if (empty) empty.hidden = true;
      if (form) form.hidden = false;

      list.innerHTML = cart
        .map(function (line) {
          var item = getItem(line.id);
          if (!item) return "";
          var unit = linePrice(item, line.sizeMl);
          var lineTotal = unit * line.qty;
          var media = menuItemMediaHtml(item);
          var key = lineKey(line.id, line.sizeMl);
          var sizeAttr =
            line.sizeMl != null ? ' data-size-ml="' + line.sizeMl + '"' : "";
          return (
            '<div class="cart-line' +
            (media ? " cart-line--media" : "") +
            '" data-id="' +
            escapeHtml(item.id) +
            '" data-line-key="' +
            escapeHtml(key) +
            '"' +
            sizeAttr +
            ">" +
            media +
            '<div class="cart-line__info">' +
            "<strong>" +
            escapeHtml(lineDisplayName(item, line.sizeMl)) +
            "</strong>" +
            "<span>" +
            formatPrice(unit) +
            "</span>" +
            "</div>" +
            '<div class="qty-controls">' +
            '<button type="button" class="qty-btn" data-dec="' +
            escapeHtml(item.id) +
            '"' +
            sizeAttr +
            ">−</button>" +
            '<span class="qty-val">' +
            line.qty +
            "</span>" +
            '<button type="button" class="qty-btn" data-inc="' +
            escapeHtml(item.id) +
            '"' +
            sizeAttr +
            ">+</button>" +
            "</div>" +
            '<p class="cart-line__sum">' +
            formatPrice(lineTotal) +
            "</p></div>"
          );
        })
        .join("");

      if (totalEl) totalEl.textContent = formatPrice(cartTotal(cart));

      function sizeFromBtn(btn) {
        var raw = btn.getAttribute("data-size-ml");
        if (raw === "" || raw == null) return null;
        var n = parseInt(raw, 10);
        return isNaN(n) ? null : n;
      }

      list.querySelectorAll("[data-inc]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          addToCart(btn.getAttribute("data-inc"), 1, sizeFromBtn(btn));
          render();
        });
      });
      list.querySelectorAll("[data-dec]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          addToCart(btn.getAttribute("data-dec"), -1, sizeFromBtn(btn));
          render();
        });
      });
    }

    render();

    var form = document.getElementById("cart-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!loadCart().length) return;
        var comment = form.elements.comment
          ? (form.elements.comment.value || "").trim()
          : "";
        try {
          sessionStorage.setItem("sazha_comment", comment);
        } catch (err) {}
        window.location.href = "pay.html?table=" + getTable();
      });
    }
  }

  function initPayPage() {
    var root = document.querySelector("[data-page='pay']");
    if (!root) return;
    paintTableBadges();
    syncTableLinks(getTable());

    var cart = loadCart();
    if (!cart.length) {
      window.location.replace("menu.html?table=" + getTable());
      return;
    }

    var totalEl = document.getElementById("pay-total");
    if (totalEl) totalEl.textContent = formatPrice(cartTotal(cart));

    var summary = document.getElementById("pay-summary");
    if (summary) {
      summary.innerHTML = cart
        .map(function (line) {
          var item = getItem(line.id);
          if (!item) return "";
          var unit = linePrice(item, line.sizeMl);
          return (
            "<li><span>" +
            escapeHtml(lineDisplayName(item, line.sizeMl)) +
            " ×" +
            line.qty +
            "</span><span>" +
            formatPrice(unit * line.qty) +
            "</span></li>"
          );
        })
        .join("");
    }

    var overlay = document.getElementById("pay-loader");
    var buttons = document.querySelectorAll("[data-pay]");

    function runDemoPay(method) {
      buttons.forEach(function (b) {
        b.disabled = true;
      });
      if (overlay) overlay.hidden = false;

      setTimeout(function () {
        var comment = "";
        try {
          comment = sessionStorage.getItem("sazha_comment") || "";
          sessionStorage.removeItem("sazha_comment");
        } catch (e) {}
        var order = createOrder({ comment: comment, payMethod: method });
        // briefly mark as making so guest sees «Готовим»; дальше ведёт бариста в admin
        setTimeout(function () {
          updateOrderStatus(order.id, "making");
        }, 400);
        window.location.href = "status.html?id=" + encodeURIComponent(order.id);
      }, 1400);
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        runDemoPay(btn.getAttribute("data-pay") || "card");
      });
    });
  }

  function initStatusPage() {
    var root = document.querySelector("[data-page='status']");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    if (!id) {
      try {
        id = localStorage.getItem(STORAGE_LAST);
      } catch (e) {}
    }
    var order = id ? getOrder(id) : null;
    if (!order) {
      var miss = document.getElementById("status-missing");
      var card = document.getElementById("status-card");
      if (miss) miss.hidden = false;
      if (card) card.hidden = true;
      return;
    }

    function paint(o) {
      var statusKey = normalizeStatus(o.status);
      var num = document.getElementById("status-number");
      var table = document.getElementById("status-table");
      var status = document.getElementById("status-label");
      var total = document.getElementById("status-total");
      var list = document.getElementById("status-items");
      var comment = document.getElementById("status-comment");
      var timer = document.getElementById("status-timer");
      var badge = document.getElementById("status-badge");
      var lead = document.getElementById("status-lead");
      var hint = document.getElementById("status-label-hint");

      if (num) num.textContent = "#" + o.number;
      if (table) table.textContent = String(o.table);
      var tableLead = document.getElementById("status-table-lead");
      if (tableLead) tableLead.textContent = String(o.table);
      if (status) status.textContent = STATUS_LABELS[statusKey] || statusKey;
      if (badge) {
        badge.className = "status-badge status-badge--" + statusKey;
        badge.textContent = STATUS_LABELS[statusKey] || statusKey;
      }
      if (lead) {
        lead.textContent =
          GUEST_STATUS_COPY[statusKey] ||
          "Заказ на стол " + o.table + ".";
      }
      if (hint) {
        hint.hidden = statusKey === "done";
      }
      if (total) total.textContent = formatPrice(o.total);
      if (list) {
        list.innerHTML = o.items
          .map(function (line) {
            return (
              "<li><span>" +
              escapeHtml(line.name) +
              " ×" +
              line.qty +
              "</span><span>" +
              formatPrice(line.price * line.qty) +
              "</span></li>"
            );
          })
          .join("");
      }
      if (comment) {
        if (o.comment) {
          comment.hidden = false;
          comment.textContent = o.comment;
        } else {
          comment.hidden = true;
        }
      }

      if (timer) timer.textContent = formatElapsed(o.createdAt);

      var tg = document.getElementById("status-tg");
      if (tg) {
        tg.href =
          TG_LINK + "?text=" + encodeURIComponent(buildTelegramText(o));
      }
    }

    paint(order);

    // poll for barista updates; only soft-advance new → making for demo
    var tick = setInterval(function () {
      var fresh = getOrder(order.id);
      if (!fresh) {
        clearInterval(tick);
        return;
      }
      var age = Date.now() - fresh.createdAt;
      if (normalizeStatus(fresh.status) === "new" && age > 3000) {
        fresh = updateOrderStatus(fresh.id, "making") || fresh;
      }
      paint(fresh);
    }, 1000);
  }

  function initAdminPage() {
    var root = document.querySelector("[data-page='admin']");
    if (!root) return;

    var filter = "active";

    function setFilter(next) {
      filter = next === "all" ? "all" : "active";
      root.querySelectorAll("[data-filter]").forEach(function (btn) {
        var on = btn.getAttribute("data-filter") === filter;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
      render();
    }

    function render() {
      var list = document.getElementById("admin-list");
      var empty = document.getElementById("admin-empty");
      var countEl = document.getElementById("admin-count");
      if (!list) return;

      var all = loadOrders();
      var activeCount = all.filter(function (o) {
        return isActiveStatus(o.status);
      }).length;
      if (countEl) {
        countEl.textContent = activeCount + " активных";
      }

      var orders =
        filter === "all"
          ? all.slice()
          : all.filter(function (o) {
              return isActiveStatus(o.status);
            });

      if (!orders.length) {
        list.innerHTML = "";
        if (empty) {
          empty.hidden = false;
          var emptyTitle = empty.querySelector("h2");
          var emptyText = empty.querySelector("p:not(.empty__eyebrow)");
          if (filter === "all") {
            if (emptyTitle) emptyTitle.textContent = "Заказов нет";
            if (emptyText)
              emptyText.textContent =
                "Оформите демо-заказ со стола — история появится здесь.";
          } else {
            if (emptyTitle) emptyTitle.textContent = "Пока тихо";
            if (emptyText)
              emptyText.textContent =
                "Оформите заказ с телефона гостя — он появится здесь.";
          }
        }
        return;
      }
      if (empty) empty.hidden = true;

      list.innerHTML = orders
        .map(function (o) {
          var statusKey = normalizeStatus(o.status);
          var action = STATUS_ACTIONS[statusKey];
          var actionHtml = action
            ? '<button type="button" class="btn btn--moss btn--block admin-card__action" data-advance="' +
              escapeHtml(o.id) +
              '" data-to="' +
              action.to +
              '">' +
              escapeHtml(action.label) +
              "</button>"
            : '<p class="admin-card__done-note">Заказ закрыт</p>';

          return (
            '<article class="admin-card admin-card--' +
            escapeHtml(statusKey) +
            '">' +
            '<div class="admin-card__head">' +
            "<div>" +
            '<p class="admin-card__meta">Стол ' +
            o.table +
            " · " +
            formatOrderTime(o.createdAt) +
            " · " +
            formatElapsed(o.createdAt) +
            "</p>" +
            "<strong>#" +
            o.number +
            "</strong>" +
            "</div>" +
            '<span class="status-badge status-badge--' +
            escapeHtml(statusKey) +
            '">' +
            escapeHtml(STATUS_LABELS[statusKey] || statusKey) +
            "</span>" +
            "</div>" +
            '<ul class="admin-card__items">' +
            orderItemsHtml(o.items) +
            "</ul>" +
            (o.comment
              ? '<p class="admin-card__comment">' +
                escapeHtml(o.comment) +
                "</p>"
              : "") +
            '<div class="admin-card__foot">' +
            '<span class="admin-card__total">' +
            formatPrice(o.total) +
            "</span>" +
            actionHtml +
            "</div></article>"
          );
        })
        .join("");

      list.querySelectorAll("[data-advance]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          updateOrderStatus(
            btn.getAttribute("data-advance"),
            btn.getAttribute("data-to")
          );
          render();
        });
      });
    }

    root.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setFilter(btn.getAttribute("data-filter"));
      });
    });

    render();
    setInterval(render, 2000);

    var clearBtn = document.getElementById("admin-clear-all");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (confirm("Очистить все демо-заказы?")) {
          saveOrders([]);
          render();
        }
      });
    }
  }

  function initStickyOrder() {
    var bar = document.getElementById("sticky-order");
    if (!bar) return;
    bar.hidden = false;
    var btn = bar.querySelector(".sticky-order__btn");
    if (btn) btn.href = "qr.html?table=" + getTable();
    var hero = document.querySelector(".hero");
    var ctaBand = document.querySelector(".cta-band");
    function update() {
      var pastHero = !hero || window.scrollY > (hero.offsetHeight * 0.55);
      var nearEnd = false;
      if (ctaBand) {
        var rect = ctaBand.getBoundingClientRect();
        nearEnd = rect.top < window.innerHeight * 0.92;
      }
      var show = pastHero && !nearEnd;
      bar.classList.toggle("is-visible", show);
      document.body.classList.toggle("has-sticky-order", show);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  document.addEventListener("DOMContentLoaded", function () {
    absorbTableFromUrl();
    initNavToggle();
    paintTableBadges();
    syncTableLinks(getTable());
    initStepBar();
    initQrPage();
    initMenuPage();
    initCartPage();
    initPayPage();
    initStatusPage();
    initAdminPage();
    renderTodayBean(document.getElementById("today-bean"));
    renderHomeHits(document.getElementById("home-hits"));
    initReveal();
    initStickyOrder();

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
