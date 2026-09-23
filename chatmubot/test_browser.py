"""Pruebas de integración con navegador y servicios externos simulados.
Ejecutar: python tests/test_browser.py   (requiere Playwright y Chromium)
Las llamadas a proveedores externos NO son pruebas de sus APIs reales.
"""
from pathlib import Path
import re,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/chatmubot/chatbotrespuestas.json').read_text(encoding='utf-8'))
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
HTML=re.sub(r'<script[^>]*>.*?</script>', '', HTML, flags=re.S)
HTML=re.sub(r'<script[^>]*\s+src=[^>]*></script>', '', HTML, flags=re.S)
HTML=HTML.replace('<link rel="stylesheet" href="assets/css/chatmubot.css">', '<style>'+ (ROOT/'assets/css/chatmubot.css').read_text(encoding='utf-8')+'</style>')
MODULES=['assets/js/core/chatbotConfig.js','assets/js/modules/chatbotUtilidades.js','assets/js/modules/chatbotCorrector.js','assets/js/modules/chatbotLogicaConversacional.js','assets/js/modules/chatbotPedia.js','assets/js/modules/chatbotTranslate.js','assets/js/modules/chatbotJuegos.js','assets/js/core/chatbot.js']

def boot(page, storage_failure=False, session_seed=None):
    errs=[]
    page.on('pageerror',lambda e: errs.append(str(e)))
    page.goto('about:blank')
    page.set_content(HTML)
    if storage_failure:
        page.evaluate('''() => { Object.defineProperty(window, 'localStorage', {configurable:true, value: {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}});Object.defineProperty(window, 'sessionStorage', {configurable:true, value: {getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}}}) }''')
    else:
        page.evaluate('''() => { const ls = new Map(); const ss = new Map(); function store(m){return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i]??null,get length(){return m.size}}};Object.defineProperty(window,'localStorage',{configurable:true,value:store(ls)});Object.defineProperty(window,'sessionStorage',{configurable:true,value:store(ss)})}''')
    if session_seed is not None and not storage_failure:
        page.evaluate('(seed) => sessionStorage.setItem("chatbot_contexto_sesion_v301", seed)', session_seed)
    page.evaluate('''(dataset) => {
      window.requests={languageTool:0,translation:0,wikipedia:0};
      window.__DATA=dataset;
      window.fetch=async (url, options={}) => {
        url=String(url);
        if (url.includes('chatbotrespuestas.json')) return new Response(JSON.stringify(window.__DATA),{status:200});
        if (url.includes('languagetool')) {
          window.requests.languageTool++;
          if (window.blockCorrection) return new Promise(resolve => window.completeCorrection=()=>resolve(new Response(JSON.stringify({matches:[]}),{status:200})));
          return new Response(JSON.stringify({matches:[]}),{status:200});
        }
        if (url.includes('translate.googleapis.com')) {
          window.requests.translation++;
          const u=new URL(url);
          return new Response(JSON.stringify([[[`TR[${u.searchParams.get('tl')}]:${u.searchParams.get('q')}`]]]),{status:200});
        }
        if (url.includes('libretranslate')) return new Response(JSON.stringify({translatedText:'traducción simulada'}),{status:200});
        if (url.includes('wikipedia.org')) {window.requests.wikipedia++;return new Response('{}',{status:200});}
        throw Error('Unexpected fetch '+url);
      }
    }''',DATA)
    for script in MODULES:
        page.add_script_tag(content=(ROOT/script).read_text(encoding='utf-8'))
        if script.endswith('chatbotConfig.js'): page.evaluate('window.ChatmuConfig.testMode=true')
    page.evaluate('window.inicializarChatbot()')
    page.wait_for_function("document.querySelector('#botStatus').textContent.includes('3.0.1')")
    return errs

def send(page,msg):
    last=page.locator('.mensaje-robot').count()
    before=page.locator('.mensaje-robot').last.locator('div').first.inner_text() if last else ''
    page.locator('#userInput').fill(msg)
    page.locator('#enviar').click()
    page.wait_for_function('({last,before}) => {const r=document.querySelectorAll(".mensaje-robot");return !!r.length && !document.querySelector("#enviar").disabled && (r.length!==last || (r[r.length-1].querySelector("div")?.innerText||"")!==before)}',arg={'last':last,'before':before},timeout=9000)
    return page.locator('.mensaje-robot').last.locator('div').first.inner_text()

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1180,'height':780})
    errs=boot(page)
    assert not page.locator('#autoCorrect').is_checked()
    assert 'buenos días' in send(page,'traduce al inglés: buenos días')
    assert 'TR[en]' in page.locator('.mensaje-robot').last.inner_text()
    assert 'TR[fr]:buenos días' in send(page,'al francés')
    send(page,'salir')
    assert 'Vale' != send(page,'necesito ayuda')
    assert not send(page,'ahora').startswith('La hora actual'), 'Ahora no debe confundirse con hora'
    assert page.evaluate('window.requests.languageTool')==0,'LanguageTool no se llama sin consentimiento'
    page.evaluate('Math.random=()=>0')
    assert 'Adivinanza' in send(page,'adivinanza')
    assert 'No es eso' in send(page,'p')
    assert '¡Correcto!' in send(page,'plátano')
    assert 'duelo' in send(page,'duelo').lower()
    claves=page.evaluate('window.__CHATMUBOT_TEST__.contextoConversacion.duelo.actual.palabrasClave.join(" ")')
    assert '¡Buena réplica!' not in send(page,claves)
    correcta=page.evaluate('window.__CHATMUBOT_TEST__.contextoConversacion.duelo.actual.respuesta')
    assert '¡Buena réplica!' in send(page,correcta)
    assert 'El resultado es 7' in send(page,'calcula 3+4')
    assert 'El resultado es 12' in send(page,'+5')
    assert 'He guardado' in send(page,'guardar color azul')
    assert 'He limpiado' in send(page,'/limpiar')
    assert 'azul' in send(page,'mostrar color'),'Limpiar el chat no borra los datos guardados'
    assert 'He reiniciado' in send(page,'/reset')
    assert 'azul' in send(page,'mostrar color'),'Reset de contexto no borra la memoria'
    assert 'Revisión ortográfica:' in send(page,'corrige: ola ke ase')
    assert page.evaluate('window.requests.languageTool')==1,'Corrección explícita: una sola solicitud'
    send(page,'salir')
    page.locator('#autoCorrect').check()
    assert page.evaluate('window.Chatmu.memoria.obtenerPrefs().autoCorrect') is True
    page.evaluate('window.blockCorrection=true')
    prior=page.locator('.mensaje-usuario').count()
    page.locator('#userInput').fill('hola')
    page.locator('#enviar').click()
    page.wait_for_function('window.requests.languageTool===2')
    page.locator('#userInput').fill('mensaje escrito mientras se corrige')
    page.evaluate("window.__CHATMUBOT_TEST__.procesarEntrada('hola')")
    page.evaluate('window.completeCorrection()')
    page.wait_for_function('!document.querySelector("#enviar").disabled')
    assert page.locator('.mensaje-usuario').count()==prior+1,'Un envío pendiente no se duplica'
    assert page.locator('#userInput').input_value()=='mensaje escrito mientras se corrige','No se borra texto nuevo'
    assert page.evaluate('window.requests.languageTool')==2
    page.locator('#autoCorrect').uncheck()
    assert 'Traducción al inglés' in send(page,'traduce al inglés: buenos días')
    sesion=page.evaluate('sessionStorage.getItem("chatbot_contexto_sesion_v301")')
    recargada=browser.new_page(viewport={'width':390,'height':740})
    errs_recarga=boot(recargada,session_seed=sesion)
    assert recargada.evaluate('window.__CHATMUBOT_TEST__.contextoConversacion.modo')=='traduce'
    assert 'TR[fr]:buenos días' in send(recargada,'al francés'),'El modo de traducción debe recuperarse tras recarga'
    assert not errs_recarga,errs_recarga
    recargada.close()
    send(page,'salir')
    assert '¿Seguro?' in send(page,'borrar todos mis datos')
    assert 'he borrado' in send(page,'sí').lower()
    assert page.evaluate('window.Chatmu.memoria.cargar().length')==0
    assert page.evaluate('Object.keys(window.Chatmu.memoria.obtenerDatos()).length')==0
    assert page.evaluate('window.localStorage.length')==0
    assert page.evaluate('window.Chatmu.memoria.obtenerPrefs().autoCorrect') is None or page.evaluate('window.Chatmu.memoria.obtenerPrefs().autoCorrect') is False
    assert page.evaluate('window.sessionStorage.getItem("chatbot_contexto_sesion_v301")') is None
    page.set_viewport_size({'width':390,'height':740})
    dims=page.evaluate('({scroll:document.documentElement.scrollWidth,window:innerWidth})')
    assert dims['scroll']<=dims['window'],f'Desbordamiento horizontal {dims}'
    assert not errs,errs
    print('OK: integración: traducción y seguimiento, intenciones, juegos, cálculo, memoria, corrector explícito/opt-in, bloqueo de duplicados, borrado total, móvil y errores JS')
    blocked=browser.new_page(viewport={'width':390,'height':720})
    blocked_errs=boot(blocked,storage_failure=True)
    assert 'Sin almacenamiento persistente' in blocked.locator('#botStatus').inner_text()
    assert 'He guardado' in send(blocked,'guardar color verde')
    assert 'verde' in send(blocked,'mostrar color')
    assert not blocked_errs,blocked_errs
    print('OK: almacenamiento bloqueado: arranque, aviso y memoria temporal funcional')
    browser.close()
