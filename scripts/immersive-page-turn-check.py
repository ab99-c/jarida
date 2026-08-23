import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://127.0.0.1:3000"
OUT_DIR = Path("/tmp/jarida-immersive-evidence")
OUT_DIR.mkdir(parents=True, exist_ok=True)

EDITION = {
    "date": "2026-08-23T00:00:00.000Z",
    "articles": [
        {"id": "mock-1", "title": "عنوان الصفحة الأولى", "summary": "محتوى الصفحة الأولى للتحقق.", "content": "تفاصيل الصفحة الأولى.", "source": "اختبار", "publishedAt": "2026-08-23T08:00:00.000Z", "imageUrl": None},
        {"id": "mock-2", "title": "عنوان الصفحة الثانية", "summary": "محتوى الصفحة الثانية للتحقق.", "content": "تفاصيل الصفحة الثانية.", "source": "اختبار", "publishedAt": "2026-08-23T09:00:00.000Z", "imageUrl": None},
        {"id": "mock-3", "title": "عنوان الصفحة الثالثة", "summary": "محتوى الصفحة الثالثة للتحقق.", "content": "تفاصيل الصفحة الثالثة.", "source": "اختبار", "publishedAt": "2026-08-23T10:00:00.000Z", "imageUrl": None},
    ],
}

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/google-chrome")
    page = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)

    def handle_route(route):
        if "/api/trpc/jarida.getDailyEdition" in route.request.url:
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({"result": {"data": {"json": EDITION}}}),
            )
        else:
            route.continue_()

    page.route("**/api/trpc/**", handle_route)
    page.goto(BASE_URL, wait_until="networkidle")
    page.get_by_text("عنوان الصفحة الأولى").wait_for(state="visible", timeout=15000)
    assert page.locator(".jarida-turning-page").count() == 0
    page.screenshot(path=str(OUT_DIR / "before.png"))

    page.get_by_role("button", name="التالي").click()
    page.wait_for_timeout(140)
    during = page.locator(".jarida-turning-page.is-turning")
    during_sheet_count_at_140ms = during.count()
    assert during_sheet_count_at_140ms == 1, "sheet overlay is not active during the turn"
    animation_name_at_140ms = during.evaluate("element => getComputedStyle(element).animationName")
    transform_at_140ms = during.evaluate("element => getComputedStyle(element).transform")
    page.screenshot(path=str(OUT_DIR / "during.png"))

    page.wait_for_timeout(420)
    assert page.locator(".jarida-static-spread-content").get_by_text("عنوان الصفحة الثالثة").count() == 1
    assert page.locator(".jarida-turning-page.is-turning").count() == 1

    page.wait_for_timeout(500)
    assert page.locator(".jarida-turning-page").count() == 0
    assert page.get_by_text("عنوان الصفحة الثالثة").count() >= 1
    page.screenshot(path=str(OUT_DIR / "after.png"))

    print(json.dumps({
        "before": str(OUT_DIR / "before.png"),
        "during": str(OUT_DIR / "during.png"),
        "after": str(OUT_DIR / "after.png"),
        "duringSheetCountAt140ms": during_sheet_count_at_140ms,
        "duringAnimationAt140ms": animation_name_at_140ms,
        "duringTransformAt140ms": transform_at_140ms,
        "midpointContentVisible": True,
        "overlayRemovedAtEnd": True,
    }, ensure_ascii=False))
    browser.close()
