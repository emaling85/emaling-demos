# Кейс 6 — репетитор «Слог»

Мультистраничный демо-сайт репетитора: пакет на месяц, современная запись и админка заявок.

Демо-бренд: **Слог** — спокойная системная подготовка (математика, русский, английский).

**Онлайн:** https://repetitoremaling.netlify.app/  
**Админка:** https://repetitoremaling.netlify.app/admin.html (пароль `slog`)

## Страницы (публичные)

| Файл | Содержание |
|------|------------|
| `index.html` | Главная: бренд, оффер пакета, ориентир цен |
| `about.html` | О занятиях + пометка, что это демо-кейс `@emaling_dev` |
| `works.html` | Подход и демо-результаты учеников |
| `book.html` | Запись: пакет / пробное, дни-чипы, слоты, живая цена |
| `styles.css` | Общие стили публичной части |
| `script.js` | Навигация, анимации появления, логика формы записи |
| `js/bookings.js` | Общее API заявок (`window.SlogBookings`) для сайта и админки |

Админка: `admin.html` (не входит в публичный редизайн) — читает те же заявки из `localStorage`.

## Админка

1. Откройте `admin.html`
2. Пароль: **`slog`**
3. Пусто — нажмите «Добавить демо-заявки» или сначала отправьте форму с `book.html`

Лучше через локальный сервер (один origin для `localStorage`):

```powershell
cd "c:\Кейсы для фриланса\кейс-6-репетитор"
npx --yes serve .
```

Затем откройте `http://localhost:3000/admin.html` (порт смотрите в выводе команды).

## Как открыть публичный сайт

```powershell
start "c:\Кейсы для фриланса\кейс-6-репетитор\index.html"
```

Или откройте любую страницу двойным кликом. Нужен интернет для Google Fonts и фото героя.

> Заявки пишутся в `localStorage` (`slog_bookings`). Сайт и админку открывайте **с одного origin** (лучше `npx serve`, не разные `file://`), иначе заявки не увидите.

## Запись → админка

1. На `book.html` ученик выбирает пакет (месяц или пробное), предмет, формат, дни недели (чипы), время (плитки).
2. Справа — живое резюме и цена.
3. По «Отправить заявку» вызывается `SlogBookings.create(...)` со статусом `new`.
4. Показывается успех: «Заявка отправлена — подтверждение придёт после проверки» + опциональная ссылка в Telegram `@emaling_dev` с текстом заявки.
5. В `admin.html` репетитор видит список, может менять статус (`confirmed` / `rejected` / `done`) через `SlogBookings.updateStatus`.

### API `window.SlogBookings`

```js
// localStorage key: 'slog_bookings'
SlogBookings.create(partial)           // → booking (status: new)
SlogBookings.list()                    // → booking[]
SlogBookings.get(id)                   // → booking | null
SlogBookings.updateStatus(id, status, adminNote?)  // → booking | null
```

Поля заявки: `id`, `name`, `contact`, `subject` (`math`|`russian`|`english`), `format` (`online`|`offline`), `package` (`month`|`trial`), `days[]`, `time`, `hoursPerWeek`, `priceMonth`, `priceLesson`, `comment`, `status`, `createdAt`, `adminNote`.

## Формула цены

```
baseHour = { math: 2200, russian: 1800, english: 2000 }  // ₽ / 60 мин
formatMul = online ? 0.9 : 1.0
examMul   = ЕГЭ/ОГЭ ? 1.25 : 1.0
perLesson = round(baseHour × formatMul × examMul)
month     = perLesson × дней_в_неделю × 4
trial     = perLesson
```

## Netlify

Уже задеплоено: https://repetitoremaling.netlify.app/

При правках — снова Drop папки `кейс-6-репетитор`. Ссылки в bio уже на этот URL.

Пометка в футере: **демо-кейс** · контакт `@emaling_dev` · «Вход для репетитора» → `admin.html`.
