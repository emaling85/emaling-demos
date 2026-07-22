# Credits — фото «Сажа»

Все файлы локально в `images/` и `images/menu/`. Источник: [Unsplash License](https://unsplash.com/license) (свободное использование, в т.ч. коммерческое). Подпись фотографов не обязательна по лицензии, но указана для порядка.

Единый стиль подборки: тёмный specialty (тёмный/угольный фон, тёплый свет), чашка/еда крупно в кадре. Для позиций меню — единый квадратный crop (1000×1000, `fit=crop&crop=entropy`), чтобы карточки в списке смотрелись однородно.

## Главная / «О месте» / интерьер

| Файл | Тема | URL |
|------|------|-----|
| `hero.jpg` | Зал, барные стойки, тёплый свет (hero) | https://images.unsplash.com/photo-1770739539412-d9e1021429cf |
| `about.jpg` | Интерьер, стойка бариста, деревянные детали | https://images.unsplash.com/photo-1752757257738-9a4f136b3f87 |
| `drinks.jpg` | Капучино на столе (направление «Напитки») | https://images.unsplash.com/photo-1735132619395-a8f675a2dc66 |
| `food.jpg` | Банановый хлеб на доске (направление «Завтраки») | https://images.unsplash.com/photo-1778410137178-cdafcaf0f848 |
| `pastry.jpg` | Выпечка на стойке, тёмный интерьер (направление «Выпечка») | https://images.unsplash.com/photo-1746133948297-c052150a6544 |
| `gallery-1.jpg` | Зал, посадка, тёплый свет | https://images.unsplash.com/photo-1768051424304-e1f2422c3356 |
| `gallery-2.jpg` | Стойка бариста | https://images.unsplash.com/photo-1751956066306-c5684cbcf385 |
| `gallery-3.jpg` | Столики, растения | https://images.unsplash.com/photo-1755163412328-df3b4c2b172e |
| `gallery-4.jpg` | Чашка эспрессо на блюдце | https://images.unsplash.com/photo-1755284489925-d19df2884899 |
| `beans.jpg` | Зерно крупным планом (обжарка, для «О месте») | https://images.unsplash.com/photo-1774801935511-27e25187f12d |
| `beans-pack.jpg` | Зерно в мешке (обжарка, для «О месте») | https://images.unsplash.com/photo-1562051036-e0eea191d42f |

## Меню (`images/menu/`) — единый crop, кофе видно крупно

| Файл | Позиция | URL |
|------|---------|-----|
| `espresso.jpg` | Эспрессо — крема крупным планом | https://images.unsplash.com/photo-1755602693904-29d1369709cc |
| `americano.jpg` | Американо — тёмная чашка, чёрный кофе | https://images.unsplash.com/photo-1753572736794-1c6d1199aa50 |
| `flat-white.jpg` | Флэт уайт — латте-арт, тёмный камень | https://images.unsplash.com/photo-1770494347735-4a6b50086124 |
| `cappuccino.jpg` | Капучино — латте-арт, чёрный фон | https://images.unsplash.com/photo-1770494347729-891046add494 |
| `filter.jpg` | Фильтр дня — пуровер/кемекс, пар | https://images.unsplash.com/photo-1442512595331-e89e73853f31 |
| `croissant.jpg` | Круассан — крупно, тёмный фон | https://images.unsplash.com/photo-1677740929724-1aa2dc110721 |
| `banana-bread.jpg` | Банановый хлеб — срез, тёмный фон | https://images.unsplash.com/photo-1767065887475-e7c38fa44ee9 |
| `cheesecake.jpg` | Чизкейк — тёмная тарелка, ягоды | архив (уже был в проекте) |
| `beans-250.jpg` | Текстура зёрен (визуал «Сегодня в зёрнах») | архив (уже был в проекте) |

Неиспользуемые архивные файлы (остались от старой версии меню, ссылок на них в коде нет): `beans-1kg.jpg` (виден чужой бренд на пачке — не используем), `matcha.jpg`, `cocoa.jpg`, `sandwich.jpg`, `granola.jpg` — стиль не совпадает с текущей подборкой, оставлены как есть, без ссылок в HTML/CSS/JS.

CDN в разметке не используется — только локальные пути вида `images/{file}.jpg` и `images/menu/{file}.jpg`.
