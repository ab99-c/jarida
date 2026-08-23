import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops, ImageStat

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


def install_mock(page):
    def handle_route(route):
        if "/api/trpc/jarida.getDailyEdition" in route.request.url:
            route.fulfill(status=200, content_type="application/json", body=json.dumps({"result": {"data": {"json": EDITION}}}))
        else:
            route.continue_()
    page.route("**/api/trpc/**", handle_route)


def wait_for_ready(page):
    page.goto(BASE_URL, wait_until="networkidle")
    page.get_by_text("عنوان الصفحة الأولى").wait_for(state="visible", timeout=15000)


def image_difference(first_path, second_path):
    first = Image.open(first_path).convert("RGB")
    second = Image.open(second_path).convert("RGB")
    diff = ImageChops.difference(first, second)
    return sum(ImageStat.Stat(diff).mean) / 3


def turn_and_capture(page, button_name, prefix):
    direction = "next" if button_name == "التالي" else "prev"
    before_path = OUT_DIR / f"{prefix}-before.png"
    during_path = OUT_DIR / f"{prefix}-during.png"
    after_path = OUT_DIR / f"{prefix}-after.png"
    page.screenshot(path=str(before_path))
    assert before_path.exists() and before_path.stat().st_size > 1024, f"{prefix}: before evidence missing"
    page.get_by_role("button", name=button_name).click()
    page.wait_for_timeout(260)
    overlay = page.locator(".jarida-turning-page.is-turning")
    assert overlay.count() == 1, f"{prefix}: overlay missing during turn"
    animation_name = overlay.evaluate("element => getComputedStyle(element).animationName")
    transform = overlay.evaluate("element => getComputedStyle(element).transform")
    assert transform.startswith("matrix3d(") and transform != "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)", f"{prefix}: motion snapped to identity"
    matrix = [float(value.strip()) for value in transform[9:-1].split(",")]
    assert len(matrix) == 16, f"{prefix}: invalid matrix3d"
    if direction == "next":
        assert matrix[2] > 0 and matrix[8] < 0, f"{prefix}: next direction is not right-to-left"
        expected_animation = "jarida-immersive-page-turn"
    else:
        assert matrix[2] < 0 and matrix[8] > 0, f"{prefix}: prev direction is not left-to-right"
        expected_animation = "jarida-immersive-page-turn-prev"
    assert animation_name == expected_animation, f"{prefix}: unexpected animation name"
    assert overlay.locator(".jarida-turning-front").evaluate("element => getComputedStyle(element).backfaceVisibility") == "hidden"
    assert overlay.locator(".jarida-turning-back").evaluate("element => getComputedStyle(element).backfaceVisibility") == "hidden"
    page.screenshot(path=str(during_path))
    assert during_path.exists() and during_path.stat().st_size > 1024, f"{prefix}: during evidence missing"
    page.wait_for_timeout(1260)
    assert page.locator(".jarida-turning-page").count() == 0, f"{prefix}: overlay remained after 1400ms"
    page.screenshot(path=str(after_path))
    assert after_path.exists() and after_path.stat().st_size > 1024, f"{prefix}: after evidence missing"
    before_during_diff = image_difference(before_path, during_path)
    during_after_diff = image_difference(during_path, after_path)
    assert before_during_diff > 0.5, f"{prefix}: during frame is too close to before frame"
    assert during_after_diff > 0.5, f"{prefix}: after frame is too close to during frame"
    return animation_name, transform, {"before": str(before_path), "during": str(during_path), "after": str(after_path), "beforeDuringDiff": round(before_during_diff, 3), "duringAfterDiff": round(during_after_diff, 3)}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True, executable_path="/usr/bin/google-chrome")

    desktop = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    install_mock(desktop)
    wait_for_ready(desktop)
    assert desktop.get_by_text("عنوان الصفحة الأولى").count() >= 1
    assert desktop.locator("button").filter(has_text="واتساب").count() >= 1
    assert desktop.locator("button").filter(has_text="فيسبوك").count() >= 1
    assert desktop.get_by_text("تعليقات القراء", exact=False).count() >= 1
    copy_buttons = desktop.locator("button").filter(has_text="نسخ الرابط")
    assert copy_buttons.count() >= 1
    copy_buttons.first.click()
    assert desktop.locator("input").first.is_disabled()
    assert desktop.locator("textarea").first.is_disabled()
    next_animation, next_transform, next_evidence = turn_and_capture(desktop, "التالي", "desktop-next")
    assert next_animation == "jarida-immersive-page-turn"
    assert "matrix3d" in next_transform
    assert desktop.get_by_text("عنوان الصفحة الثالثة").count() >= 1
    prev_animation, prev_transform, prev_evidence = turn_and_capture(desktop, "السابق", "desktop-prev")
    assert prev_animation == "jarida-immersive-page-turn-prev"
    assert "matrix3d" in prev_transform or "matrix" in prev_transform
    assert desktop.get_by_text("عنوان الصفحة الأولى").count() >= 1

    mobile_results = []
    for mobile_width, mobile_height in [(360, 800), (390, 844), (430, 932)]:
        mobile = browser.new_page(viewport={"width": mobile_width, "height": mobile_height}, device_scale_factor=1)
        install_mock(mobile)
        wait_for_ready(mobile)
        assert mobile.get_by_text("عنوان الصفحة الأولى").count() >= 1
        assert mobile.get_by_text("عنوان الصفحة الثانية").count() >= 1
        assert mobile.locator("button").filter(has_text="واتساب").count() >= 1
        assert mobile.locator("button").filter(has_text="فيسبوك").count() >= 1
        assert mobile.get_by_text("تعليقات القراء", exact=False).count() >= 1
        assert mobile.locator("textarea").first.is_disabled()
        mobile.get_by_role("button", name="نسخ الرابط").first.click()
        mobile_next_animation, mobile_next_transform, mobile_next_evidence = turn_and_capture(mobile, "التالي", f"mobile-{mobile_width}-next")
        assert mobile_next_animation == "jarida-immersive-page-turn"
        assert "matrix3d" in mobile_next_transform
        assert mobile.get_by_text("عنوان الصفحة الثالثة").count() >= 1
        mobile_prev_animation, mobile_prev_transform, mobile_prev_evidence = turn_and_capture(mobile, "السابق", f"mobile-{mobile_width}-prev")
        assert mobile_prev_animation == "jarida-immersive-page-turn-prev"
        assert "matrix3d" in mobile_prev_transform
        assert mobile.get_by_text("عنوان الصفحة الأولى").count() >= 1
        mobile_results.append({"width": mobile_width, "height": mobile_height, "next": mobile_next_evidence, "prev": mobile_prev_evidence})
        mobile.close()

    autoplay = browser.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    install_mock(autoplay)
    wait_for_ready(autoplay)
    autoplay.wait_for_timeout(11600)
    assert autoplay.get_by_text("عنوان الصفحة الثالثة").count() >= 1, "auto-flip did not advance after its first 10s interval"
    autoplay.screenshot(path=str(OUT_DIR / "desktop-autoflip-after.png"))

    print(json.dumps({
        "durationMs": 1400,
        "midpointMs": 700,
        "desktopNext": {"animation": next_animation, "transform": next_transform, "evidence": next_evidence},
        "desktopPrev": {"animation": prev_animation, "transform": prev_transform, "evidence": prev_evidence},
        "mobileSizes": mobile_results,
        "autoFlipAdvanced": True,
        "socialAndCommentsVisible": True,
        "evidenceDir": str(OUT_DIR),
    }, ensure_ascii=False))
    browser.close()
