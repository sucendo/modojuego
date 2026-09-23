"""Smoke test con loader real desde un servidor HTTP local (Playwright + Chromium)."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
        page=browser.new_page(viewport={'width':390,'height':750})
        errors=[]; page.on('pageerror',lambda e:errors.append(str(e)))
        page.route('https://translate.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='application/json',body='[[["hello", "hola"]]]'))
        try:
            page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
        except Exception as exc:
            if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
                print('SKIP: el entorno bloquea la navegación de Chromium a localhost; pruebas embebidas en test_browser.py.')
                browser.close()
                raise SystemExit(0)
            raise
        page.wait_for_function("document.querySelector('#botStatus').textContent.includes('3.0.1')",timeout=15000)
        assert page.locator('#quickActions button').count()>4,'El loader debe cargar los módulos y botones'
        page.locator('#userInput').fill('traduce al inglés: hola')
        page.locator('#enviar').click()
        page.wait_for_function('document.querySelectorAll(".mensaje-robot").length>=2 && !document.querySelector("#enviar").disabled')
        assert 'hello' in page.locator('.mensaje-robot').last.inner_text()
        assert not errors,errors
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),'Sin desbordamiento móvil'
        print('OK: loader real HTTP, respuesta traducida con API simulada y ancho móvil')
        browser.close()
finally:
    server.shutdown();server.server_close()
