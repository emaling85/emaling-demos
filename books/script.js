(function () {
  "use strict";

  var STORAGE_KEY = "forzats-cart";
  var TG_LINK = "https://t.me/emaling_dev";
  var catalogFilter = "all";

  function getCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(data)) return [];

      // Санация: битые/дублирующиеся записи (ручное редактирование localStorage,
      // старые версии корзины) не должны портить счётчик и сумму — сливаем
      // повторяющиеся id и отбрасываем записи с некорректным количеством.
      var order = [];
      var qtyById = {};
      data.forEach(function (item) {
        if (!item || typeof item.id !== "string" || !item.id) return;
        var qty = Math.floor(Number(item.qty));
        if (!isFinite(qty) || qty <= 0) return;
        if (!Object.prototype.hasOwnProperty.call(qtyById, item.id)) {
          order.push(item.id);
          qtyById[item.id] = 0;
        }
        qtyById[item.id] += qty;
      });
      return order.map(function (id) {
        return { id: id, qty: qtyById[id] };
      });
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updateCartCount();
  }

  function getBook(id) {
    if (!window.BOOKS) return null;
    for (var i = 0; i < window.BOOKS.length; i++) {
      if (window.BOOKS[i].id === id) return window.BOOKS[i];
    }
    return null;
  }

  function formatPrice(n) {
    return n.toLocaleString("ru-RU") + "\u00a0₽";
  }

  function cartCount() {
    return getCart().reduce(function (sum, item) {
      // Книги, снятые с витрины (нет в текущем data/books.js), не считаем —
      // иначе бейдж в шапке разойдётся с тем, что видно в самой корзине.
      return sum + (getBook(item.id) ? item.qty : 0);
    }, 0);
  }

  function updateCartCount() {
    var nodes = document.querySelectorAll("[data-cart-count]");
    var n = cartCount();
    nodes.forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
    });
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    var book = getBook(id);
    if (book && book.inStock === false) {
      flashToast("Пока нет на полке");
      return;
    }
    var items = getCart();
    var found = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        found = items[i];
        break;
      }
    }
    if (found) {
      found.qty += qty;
    } else {
      items.push({ id: id, qty: qty });
    }
    saveCart(items);
    flashToast("На полке в корзине");
  }

  function setQty(id, qty) {
    var items = getCart();
    if (qty <= 0) {
      items = items.filter(function (item) {
        return item.id !== id;
      });
    } else {
      items.forEach(function (item) {
        if (item.id === id) item.qty = qty;
      });
    }
    saveCart(items);
  }

  function removeFromCart(id) {
    setQty(id, 0);
  }

  function cartTotal() {
    return getCart().reduce(function (sum, item) {
      var book = getBook(item.id);
      return sum + (book ? book.price * item.qty : 0);
    }, 0);
  }

  function flashToast(text) {
    var existing = document.querySelector(".toast");
    if (existing) existing.remove();
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    setTimeout(function () {
      el.classList.remove("is-visible");
      setTimeout(function () {
        el.remove();
      }, 300);
    }, 1800);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badgeLabel(badge) {
    if (badge === "new") return "Новинка";
    if (badge === "pick") return "Выбор лавки";
    return "";
  }

  function badgeHtml(book, extraClass) {
    var label = badgeLabel(book.badge);
    if (!label) return "";
    return (
      '<span class="book-badge book-badge--' +
      escapeHtml(book.badge) +
      (extraClass ? " " + extraClass : "") +
      '">' +
      label +
      "</span>"
    );
  }

  function stockHtml(book) {
    if (book.inStock === false) {
      return '<span class="stock-pill stock-pill--out">Нет на полке · спросим</span>';
    }
    return '<span class="stock-pill stock-pill--in">На полке · можно забрать</span>';
  }

  function coverHtml(book, size) {
    size = size || "md";
    var series = book.series || "Открытая классика";
    var hasPhoto = !!book.cover;
    var classes = "cover cover--" + size + (hasPhoto ? " cover--photo" : "");
    var styleAttr = book.color
      ? ' style="--cover:' + escapeHtml(book.color) + ";--cover-accent:" + escapeHtml(book.accent || "#fff") + '"'
      : "";
    // Если файл обложки не загрузится (см. onerror), .cover помечается
    // классом cover--fallback и превращается в единый рисованный "корешок" —
    // та же рамка/тень/пропорции, что и у остальных книг серии на полке.
    var imgHtml = hasPhoto
      ? '<img class="cover__img" src="' +
        escapeHtml(book.cover) +
        '" alt="" loading="lazy" width="280" height="420" onerror="this.closest(\'.cover\').classList.add(\'cover--fallback\')" />'
      : "";
    return (
      '<div class="' +
      classes +
      '"' +
      styleAttr +
      ' aria-hidden="true">' +
      '<span class="cover__series">' +
      escapeHtml(series) +
      "</span>" +
      imgHtml +
      '<span class="cover__spine"></span>' +
      '<span class="cover__title">' +
      escapeHtml(book.title) +
      "</span>" +
      '<span class="cover__author">' +
      escapeHtml(book.author) +
      "</span>" +
      '<span class="cover__edge"></span>' +
      "</div>"
    );
  }

  function bookCardMeta(book, titleTag) {
    titleTag = titleTag || "h3";
    return (
      '<div class="book-card__meta">' +
      badgeHtml(book, "book-badge--inline") +
      "<" +
      titleTag +
      ' class="book-card__title">' +
      escapeHtml(book.title) +
      "</" +
      titleTag +
      ">" +
      '<p class="book-card__author">' +
      escapeHtml(book.author) +
      "</p>" +
      '<p class="book-card__genre">' +
      escapeHtml(book.genre) +
      "</p>" +
      '<p class="book-card__price">' +
      formatPrice(book.price) +
      "</p>" +
      "</div>"
    );
  }

  function renderHits(container) {
    if (!container || !window.BOOKS) return;
    var hits = window.BOOKS.filter(function (b) {
      return b.badge === "pick";
    }).slice(0, 4);
    if (hits.length < 4) {
      hits = window.BOOKS.slice(0, 4);
    }
    container.innerHTML = hits
      .map(function (book) {
        return (
          '<a class="book-card reveal" href="book.html?id=' +
          encodeURIComponent(book.id) +
          '">' +
          '<div class="book-card__cover-wrap">' +
          badgeHtml(book) +
          coverHtml(book, "md") +
          "</div>" +
          bookCardMeta(book, "h3") +
          "</a>"
        );
      })
      .join("");
  }

  function renderShelf(container) {
    if (!container || !window.BOOKS) return;
    var shelfBooks = window.BOOKS.slice();
    container.innerHTML =
      '<div class="shelf" role="list">' +
      '<div class="shelf__ledge" aria-hidden="true"></div>' +
      '<div class="shelf__track">' +
      shelfBooks
        .map(function (book) {
          return (
            '<a class="shelf__item" role="listitem" href="book.html?id=' +
            encodeURIComponent(book.id) +
            '" title="' +
            escapeHtml(book.title) +
            ' — ' +
            escapeHtml(book.author) +
            '">' +
            coverHtml(book, "shelf") +
            '<span class="shelf__caption">' +
            escapeHtml(book.title) +
            "</span>" +
            "</a>"
          );
        })
        .join("") +
      "</div></div>";
  }

  function renderAboutShelf(container) {
    if (!container || !window.BOOKS) return;
    var picks = window.BOOKS.filter(function (b) {
      return b.badge === "pick";
    });
    window.BOOKS.forEach(function (b) {
      if (picks.length >= 6) return;
      if (picks.indexOf(b) === -1) picks.push(b);
    });
    picks = picks.slice(0, 6);
    container.innerHTML = picks
      .map(function (book) {
        return (
          '<a class="shelf__item" href="book.html?id=' +
          encodeURIComponent(book.id) +
          '" title="' +
          escapeHtml(book.title) +
          ' — ' +
          escapeHtml(book.author) +
          '">' +
          coverHtml(book, "shelf") +
          "</a>"
        );
      })
      .join("");
  }

  function uniqueGenres() {
    var seen = {};
    var list = [];
    (window.BOOKS || []).forEach(function (book) {
      if (!seen[book.genre]) {
        seen[book.genre] = true;
        list.push(book.genre);
      }
    });
    return list;
  }

  function matchesFilter(book, filter) {
    if (filter === "all") return true;
    if (filter === "new") return book.badge === "new";
    if (filter === "pick") return book.badge === "pick";
    return book.genre === filter;
  }

  function renderCatalogChips(container) {
    if (!container || !window.BOOKS) return;
    var chips = [
      { id: "all", label: "Все" },
      { id: "new", label: "Новинки" },
      { id: "pick", label: "Выбор лавки" },
    ].concat(
      uniqueGenres().map(function (g) {
        return { id: g, label: g };
      })
    );

    container.innerHTML = chips
      .map(function (chip) {
        var active = catalogFilter === chip.id ? " is-active" : "";
        return (
          '<button type="button" class="chip' +
          active +
          '" data-filter="' +
          escapeHtml(chip.id) +
          '" aria-pressed="' +
          (catalogFilter === chip.id ? "true" : "false") +
          '">' +
          escapeHtml(chip.label) +
          "</button>"
        );
      })
      .join("");

    container.querySelectorAll("[data-filter]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        catalogFilter = btn.getAttribute("data-filter");
        renderCatalogChips(container);
        renderCatalog(document.getElementById("catalog-grid"));
      });
    });
  }

  function renderCatalog(container) {
    if (!container || !window.BOOKS) return;
    var books = window.BOOKS.filter(function (book) {
      return matchesFilter(book, catalogFilter);
    });

    var countEl = document.getElementById("catalog-count");
    if (countEl) {
      var total = window.BOOKS.length;
      var word =
        books.length % 10 === 1 && books.length % 100 !== 11
          ? "книга"
          : books.length % 10 >= 2 &&
              books.length % 10 <= 4 &&
              (books.length % 100 < 10 || books.length % 100 >= 20)
            ? "книги"
            : "книг";
      if (books.length === total) {
        countEl.innerHTML =
          'Найдено <span class="catalog-count__num">' +
          books.length +
          "</span> " +
          word;
      } else {
        countEl.innerHTML =
          'Найдено <span class="catalog-count__num">' +
          books.length +
          "</span> " +
          word +
          '<span class="catalog-count__hint">из ' +
          total +
          " на полке</span>";
      }
    }

    if (books.length === 0) {
      container.innerHTML =
        '<div class="empty empty--inline">' +
        '<p class="empty__mark" aria-hidden="true">∅</p>' +
        "<h2>На этой полке пусто</h2>" +
        "<p>Снимите фильтр или загляните в «Все» — полка ждёт другой ярлык.</p>" +
        "</div>";
      return;
    }

    container.innerHTML = books
      .map(function (book) {
        var addDisabled = book.inStock === false;
        return (
          '<article class="book-card reveal">' +
          '<a class="book-card__link" href="book.html?id=' +
          encodeURIComponent(book.id) +
          '">' +
          '<div class="book-card__cover-wrap">' +
          badgeHtml(book) +
          coverHtml(book, "md") +
          "</div>" +
          bookCardMeta(book, "h2") +
          "</a>" +
          '<button type="button" class="btn btn--small"' +
          (addDisabled ? " disabled" : "") +
          ' data-add="' +
          escapeHtml(book.id) +
          '">' +
          (addDisabled ? "Нет на полке" : "В корзину") +
          "</button>" +
          "</article>"
        );
      })
      .join("");

    container.querySelectorAll("[data-add]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        addToCart(btn.getAttribute("data-add"), 1);
      });
    });

    initReveal();
  }

  function renderBookPage() {
    var root = document.getElementById("book-page");
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");
    var book = getBook(id);

    if (!book) {
      root.innerHTML =
        '<div class="empty">' +
        '<p class="empty__mark" aria-hidden="true">∅</p>' +
        "<h1>Книга не найдена</h1>" +
        "<p>Возможно, ссылка устарела — как вырванный лист из чужого тома. Загляните в каталог.</p>" +
        '<a class="btn" href="catalog.html">К каталогу</a>' +
        "</div>";
      return;
    }

    document.title = book.title + " — Форзац";
    var canBuy = book.inStock !== false;

    root.innerHTML =
      '<nav class="breadcrumbs" aria-label="Навигация">' +
      '<a href="index.html">Форзац</a>' +
      '<span class="breadcrumbs__sep" aria-hidden="true">/</span>' +
      '<a href="catalog.html">Каталог</a>' +
      '<span class="breadcrumbs__sep" aria-hidden="true">/</span>' +
      '<span class="breadcrumbs__current">' +
      escapeHtml(book.title) +
      "</span>" +
      "</nav>" +
      '<div class="book-detail reveal">' +
      '<div class="book-detail__cover">' +
      '<div class="book-card__cover-wrap book-card__cover-wrap--lg">' +
      badgeHtml(book) +
      coverHtml(book, "lg") +
      "</div>" +
      "</div>" +
      '<div class="book-detail__body">' +
      '<p class="eyebrow">' +
      escapeHtml(book.series || "Открытая классика") +
      " · " +
      escapeHtml(book.genre) +
      " · " +
      book.year +
      "</p>" +
      "<h1>" +
      escapeHtml(book.title) +
      "</h1>" +
      '<p class="book-detail__author">' +
      escapeHtml(book.author) +
      "</p>" +
      '<div class="book-detail__buy">' +
      '<p class="book-detail__price">' +
      formatPrice(book.price) +
      "</p>" +
      stockHtml(book) +
      "</div>" +
      (book.audience
        ? '<div class="for-whom"><p class="for-whom__label">Для кого</p><p class="for-whom__text">' +
          escapeHtml(book.audience) +
          "</p></div>"
        : "") +
      (book.blurb
        ? '<p class="book-detail__blurb">' + escapeHtml(book.blurb) + "</p>"
        : "") +
      (book.summary
        ? '<section class="book-summary" aria-labelledby="book-summary-heading">' +
          '<p class="book-summary__eyebrow" id="book-summary-heading">Краткое содержание</p>' +
          '<p class="book-summary__text">' +
          escapeHtml(book.summary) +
          "</p></section>"
        : "") +
      '<div class="book-detail__pub">' +
      '<p class="book-detail__pub-label">Об издании</p>' +
      "<p>" +
      escapeHtml(book.description) +
      "</p></div>" +
      '<ul class="book-detail__facts">' +
      "<li><span>Страниц</span><span>" +
      book.pages +
      "</span></li>" +
      "<li><span>Жанр</span><span>" +
      escapeHtml(book.genre) +
      "</span></li>" +
      "<li><span>Год</span><span>" +
      book.year +
      "</span></li>" +
      "</ul>" +
      '<div class="book-detail__actions">' +
      '<button type="button" class="btn"' +
      (canBuy ? "" : " disabled") +
      ' data-add="' +
      escapeHtml(book.id) +
      '">' +
      (canBuy ? "В корзину" : "Нет на полке") +
      "</button>" +
      '<a class="btn btn--ghost" href="catalog.html">В каталог</a>' +
      "</div>" +
      '<div class="fulfill-note">' +
      "<p><strong>Самовывоз</strong> — после сообщения в Telegram.</p>" +
      "<p><strong>Доставка</strong> — курьер / почта / СДЭК, срок в переписке.</p>" +
      "</div>" +
      "</div></div>" +
      '<div class="book-sticky" data-book-sticky>' +
      '<div class="book-sticky__info">' +
      "<strong>" +
      escapeHtml(book.title) +
      "</strong>" +
      "<span>" +
      formatPrice(book.price) +
      "</span>" +
      "</div>" +
      '<button type="button" class="btn btn--brass"' +
      (canBuy ? "" : " disabled") +
      ' data-add-sticky="' +
      escapeHtml(book.id) +
      '">' +
      (canBuy ? "В корзину" : "Нет") +
      "</button>" +
      "</div>";

    root.querySelectorAll("[data-add], [data-add-sticky]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        addToCart(book.id, 1);
      });
    });

    document.body.classList.add("has-book-sticky");
  }

  function renderCartPage() {
    var list = document.getElementById("cart-list");
    var summary = document.getElementById("cart-summary");
    var form = document.getElementById("order-form");
    var empty = document.getElementById("cart-empty");
    var filled = document.getElementById("cart-filled");
    if (!list) return;

    function draw() {
      // Позиции, чьи книги пропали из каталога (устаревшая ссылка в localStorage),
      // не должны портить счётчики и сумму заказа — тихо игнорируем их при отрисовке.
      var items = getCart().filter(function (item) {
        return !!getBook(item.id);
      });
      if (items.length === 0) {
        if (empty) empty.hidden = false;
        if (filled) filled.hidden = true;
        return;
      }
      if (empty) empty.hidden = true;
      if (filled) filled.hidden = false;

      list.innerHTML = items
        .map(function (item) {
          var book = getBook(item.id);
          if (!book) return "";
          return (
            '<li class="cart-row" data-id="' +
            escapeHtml(book.id) +
            '">' +
            coverHtml(book, "sm") +
            '<div class="cart-row__info">' +
            '<a href="book.html?id=' +
            encodeURIComponent(book.id) +
            '"><strong>' +
            escapeHtml(book.title) +
            "</strong></a>" +
            "<span>" +
            escapeHtml(book.author) +
            "</span>" +
            '<span class="cart-row__price">' +
            formatPrice(book.price) +
            "</span>" +
            "</div>" +
            '<div class="cart-row__qty">' +
            '<button type="button" class="qty-btn" data-dec aria-label="Меньше"' +
            (item.qty <= 1 ? " disabled" : "") +
            ">−</button>" +
            '<span class="qty-val">' +
            item.qty +
            "</span>" +
            '<button type="button" class="qty-btn" data-inc aria-label="Больше">+</button>' +
            "</div>" +
            '<button type="button" class="cart-row__remove" data-remove aria-label="Удалить">×</button>' +
            "</li>"
          );
        })
        .join("");

      if (summary) {
        var totalBooks = items.reduce(function (sum, item) {
          return sum + item.qty;
        }, 0);
        var totalSum = items.reduce(function (sum, item) {
          var book = getBook(item.id);
          return sum + (book ? book.price * item.qty : 0);
        }, 0);
        summary.innerHTML =
          "<div><span>Позиций</span><strong>" +
          items.length +
          "</strong></div>" +
          "<div><span>Книг</span><strong>" +
          totalBooks +
          "</strong></div>" +
          '<div class="cart-summary__total"><span>Сумма</span><strong>' +
          formatPrice(totalSum) +
          "</strong></div>";
      }

      list.querySelectorAll(".cart-row").forEach(function (row) {
        var rowId = row.getAttribute("data-id");
        var item = getCart().find(function (x) {
          return x.id === rowId;
        });
        row.querySelector("[data-dec]").addEventListener("click", function () {
          // "-" уменьшает количество, но не удаляет книгу из корзины —
          // удаление есть отдельная явная кнопка "×" (см. data-remove).
          var current = item ? item.qty : 1;
          if (current <= 1) return;
          setQty(rowId, current - 1);
          draw();
        });
        row.querySelector("[data-inc]").addEventListener("click", function () {
          setQty(rowId, (item ? item.qty : 0) + 1);
          draw();
        });
        row.querySelector("[data-remove]").addEventListener("click", function () {
          removeFromCart(rowId);
          draw();
        });
      });
    }

    draw();

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = (form.elements.name.value || "").trim();
        var phone = (form.elements.phone.value || "").trim();
        var comment = (form.elements.comment.value || "").trim();
        var nameErr = form.querySelector('[data-error="name"]');
        var phoneErr = form.querySelector('[data-error="phone"]');
        var ok = true;

        if (nameErr) nameErr.textContent = "";
        if (phoneErr) phoneErr.textContent = "";

        if (name.length < 2) {
          if (nameErr) nameErr.textContent = "Укажите имя (минимум 2 символа)";
          ok = false;
        }

        var phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length < 10 || phoneDigits.length > 12) {
          if (phoneErr)
            phoneErr.textContent = "Телефон: 10–12 цифр, например +7 900 123-45-67";
          ok = false;
        }

        if (!ok) return;

        var items = getCart().filter(function (item) {
          return !!getBook(item.id);
        });
        if (items.length === 0) {
          flashToast("Корзина ещё пуста");
          return;
        }

        var lines = [
          "Заказ из магазина «Форзац»",
          "",
          "Имя: " + name,
          "Телефон: " + phone,
        ];
        if (comment) lines.push("Комментарий: " + comment);
        lines.push("", "Состав:");

        items.forEach(function (item) {
          var book = getBook(item.id);
          if (!book) return;
          lines.push(
            "• " +
              book.title +
              " — " +
              item.qty +
              " шт. × " +
              formatPrice(book.price) +
              " = " +
              formatPrice(book.price * item.qty)
          );
        });
        var orderTotal = items.reduce(function (sum, item) {
          var book = getBook(item.id);
          return sum + (book ? book.price * item.qty : 0);
        }, 0);
        lines.push("", "Итого: " + formatPrice(orderTotal));

        var text = lines.join("\n");
        var preview = document.getElementById("order-preview");
        if (preview) {
          preview.hidden = false;
          preview.querySelector("pre").textContent = text;
        }

        window.open(TG_LINK + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      });
    }
  }

  function initNavToggle() {
    var btn = document.querySelector("[data-nav-toggle]");
    var panel = document.querySelector("[data-nav-panel]");
    var header = document.querySelector(".site-header");
    if (!btn || !panel) return;
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      // На hero-шапке фон обычно полупрозрачный/градиентный — при открытом
      // мобильном меню делаем его сплошным, иначе пункты меню читаются
      // на фоне фото и превращаются в тот же "текст на тексте".
      if (header) header.classList.toggle("nav-is-open", open);
    });
  }

  function initReveal() {
    var nodes = document.querySelectorAll(".reveal:not(.is-in)");
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
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

  // Если корзину поменяли в другой вкладке (или через localStorage напрямую),
  // счётчик в шапке должен обновиться без перезагрузки страницы.
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) updateCartCount();
  });

  document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    initNavToggle();
    renderHits(document.getElementById("hits"));
    renderShelf(document.getElementById("shelf-rail"));
    renderAboutShelf(document.getElementById("about-shelf"));
    renderCatalogChips(document.getElementById("catalog-chips"));
    renderCatalog(document.getElementById("catalog-grid"));
    renderBookPage();
    renderCartPage();
    initReveal();

    document.querySelectorAll("[data-add-home]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addToCart(btn.getAttribute("data-add-home"), 1);
      });
    });
  });

  window.Forzats = {
    addToCart: addToCart,
    formatPrice: formatPrice,
    getBook: getBook,
    coverHtml: coverHtml,
  };
})();
