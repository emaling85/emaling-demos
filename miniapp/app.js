(() => {
  const ITEMS = [
    { id: "espresso", title: "Эспрессо", price: 180, hint: "Двойной по желанию" },
    { id: "flat", title: "Флэт уайт", price: 290, hint: "Молоко / oat" },
    { id: "filter", title: "Фильтр дня", price: 250, hint: "Светлая обжарка" },
    { id: "matcha", title: "Матча латте", price: 340, hint: "Без сиропа по умолчанию" },
    { id: "croissant", title: "Круассан", price: 220, hint: "Сливочное масло" },
  ];

  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor("#1a1410");
      tg.setBackgroundColor("#1a1410");
    } catch (_) {}
  }

  const cart = new Map();
  const menuEl = document.getElementById("menu");
  const cartList = document.getElementById("cartList");
  const totalEl = document.getElementById("total");
  const sendBtn = document.getElementById("sendBtn");
  const hint = document.getElementById("hint");
  const noteEl = document.getElementById("note");

  function renderMenu() {
    menuEl.innerHTML = ITEMS.map(
      (item) => `
      <article class="item" data-id="${item.id}">
        <h3>${item.title}</h3>
        <span class="price">${item.price} ₽</span>
        <p>${item.hint}</p>
        <button type="button" data-add="${item.id}">В заказ</button>
      </article>`
    ).join("");
  }

  function renderCart() {
    const rows = [];
    let sum = 0;
    for (const [id, qty] of cart) {
      const item = ITEMS.find((x) => x.id === id);
      if (!item) continue;
      sum += item.price * qty;
      rows.push(`<li><span>${item.title} × ${qty}</span><span>${item.price * qty} ₽</span></li>`);
    }
    cartList.innerHTML = rows.length ? rows.join("") : "<li>Пока пусто</li>";
    totalEl.textContent = `${sum} ₽`;
    sendBtn.disabled = sum === 0;
    hint.textContent = sum ? "Можно отправить заказ" : "Добавьте позиции из меню";
    hint.classList.remove("ok");
  }

  function buildPayload() {
    const lines = [];
    let sum = 0;
    for (const [id, qty] of cart) {
      const item = ITEMS.find((x) => x.id === id);
      if (!item) continue;
      sum += item.price * qty;
      lines.push(`${item.title} × ${qty} = ${item.price * qty} ₽`);
    }
    const note = (noteEl.value || "").trim();
    return {
      text:
        "Заказ Mini App «Сажа»\n" +
        lines.join("\n") +
        `\nИтого: ${sum} ₽` +
        (note ? `\nКомментарий: ${note}` : ""),
      sum,
      note,
      items: Object.fromEntries(cart),
    };
  }

  menuEl.addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-add");
    if (!id) return;
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
  });

  sendBtn.addEventListener("click", () => {
    if (sendBtn.disabled) return;
    const payload = buildPayload();

    if (tg && tg.initData) {
      try {
        tg.sendData(JSON.stringify(payload));
        hint.textContent = "Заказ отправлен в бота";
        hint.classList.add("ok");
        return;
      } catch (_) {}
    }

    const share = encodeURIComponent(payload.text);
    window.open(`https://t.me/emaling_dev?text=${share}`, "_blank");
    hint.textContent = "Открыл Telegram с текстом заказа (браузерный режим)";
    hint.classList.add("ok");
  });

  renderMenu();
  renderCart();
})();
