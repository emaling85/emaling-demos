from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 1600})
    pg.goto("http://localhost:5183/index.html")
    pg.wait_for_timeout(500)
    pg.screenshot(path="_shot_hero.png")
    pg.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
    pg.wait_for_timeout(800)
    pg.screenshot(path="_shot_bottom.png", full_page=False)
    broken = pg.evaluate(
        "() => Array.from(document.querySelectorAll('img')).filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)"
    )
    print("broken images after scroll:", broken)
    pg.goto("http://localhost:5183/book.html")
    pg.wait_for_timeout(300)
    pg.screenshot(path="_shot_book.png")
    b.close()
