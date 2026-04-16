VIDEMON
=======

Acceso:
- usuario: mon
- contraseña: Monchita

Notas:
- Las credenciales se leen desde users.json y están ofuscadas en Base64.
- Se incluyen 38 vídeos únicos.
- Los títulos se han cargado desde YouTube salvo un caso en el que la consulta falló y se dejó el identificador como nombre provisional.
- La última fecha de reproducción se guarda en el navegador mediante localStorage.
- Incluye modo oscuro y modo día con tonos blancos y rosa pastel.

Uso:
- Abre index.html en un servidor local o súbelo al hosting.
- Si el navegador bloquea fetch sobre JSON al abrirlo como archivo local, usa un servidor simple.
- Ejemplo con Python:
  python -m http.server 8000
