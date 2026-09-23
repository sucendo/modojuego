"""Smoke test del loader real (resuelve las rutas desde un origen simulado).
Evita usar un servidor localhost cuando Chromium tiene navegación local bloqueada.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':750})
    errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
    def local_route(route):
        path=route.request.url.split('chatmu.invalid/')[-1].split('?')[0]
        file=ROOT/path
        if not file.is_file(): return route.fulfill(status=404,body='No encontrado')
        type='text/html' if file.suffix=='.html' else 'application/javascript' if file.suffix=='.js' else 'text/css' if file.suffix=='.css' else 'application/json'
        return route.fulfill(status=200,body=file.read_bytes(),content_type=type)
    page.route('https://chatmu.invalid/**',local_route)
    page.route('https://translate.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='[[["hello", "hola"]]]'))
    try:
        page.goto('https://chatmu.invalid/index.html')
    except Exception as exc:
        if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
            print('SKIP: entorno impide probar el loader por URL; integración cubierta con scripts embebidos.')
            browser.close()
            raise SystemExit(0)
        raise
    page.wait_for_function("document.querySelector('#botStatus').textContent.includes('3.0.1')",timeout=15000)
    assert page.locator('#quickActions button').count()>4
    page.locator('#userInput').fill('traduce al inglés: hola')
    page.locator('#enviar').click()
    page.wait_for_function('document.querySelectorAll(".mensaje-robot").length>=2 && !document.querySelector("#enviar").disabled')
    assert 'hello' in page.locator('.mensaje-robot').last.inner_text()
    assert not errors,errors
    print('OK: loader real, orden de módulos y traducción simulada')
    browser.close()
