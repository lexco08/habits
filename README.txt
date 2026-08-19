Brain Gym Tracker v3 (multi-página)

1) Copia TODOS estos archivos a la misma carpeta:
   index.html, vision.html, journal.html, settings.html
   styles.css, core.js, app.js, vision.js, journal.js, settings.js

2) Ábrelo en VS Code y usa Live Server (recomendado).
   Si lo abres como file:// (doble click), puede funcionar,
   pero para multi-página es más estable con http://localhost.

3) Guardado:
   - Auto-guardado con localStorage del navegador.
   - Exportar es backup opcional (JSON).


v4 agrega: Reto del día (+10), Bonus del mes (+20 c/u), Skills page, puntos y recompensas configurables (incluye canje 1).

v5 agrega: PWA (manifest.json + sw.js + iconos). Ahora se puede "instalar"
en celular y laptop desde el navegador, sin pasar por App Store/Play Store,
y funciona offline una vez cargada la primera vez.

CÓMO INSTALARLA (IMPORTANTE — necesitas https, NO sirve con doble click):

Opción recomendada, gratis, 5 minutos: GitHub Pages
1) Crea un repo en GitHub, sube TODOS los archivos de esta carpeta.
2) Settings -> Pages -> Branch: main -> Save.
3) Te da una URL tipo https://tuusuario.github.io/brain-gym-tracker/
4) Abre esa URL en el celular (Chrome/Safari) -> menú -> "Agregar a
   pantalla de inicio" / "Instalar app".
5) Abre la MISMA URL en tu laptop -> Chrome te va a ofrecer instalarla
   (ícono de instalar en la barra de direcciones) o Menú -> "Instalar
   Brain Gym Tracker".

AVISO IMPORTANTE — sincronización entre dispositivos:
Los datos se guardan con localStorage, es decir, DENTRO del navegador
de cada dispositivo. El celular y la laptop NO comparten datos en
automático — son dos copias separadas. Para mantenerlas iguales:
- Usa "Exportar" en el celular y "Importar" en la laptop (o viceversa)
  cada vez que quieras sincronizar manualmente, o
- Decide UN dispositivo como el "oficial" donde marcas todo el día,
  y usa el otro solo para consultar.
Si más adelante quieres sync automático real (sin exportar/importar a
mano), eso requiere una base de datos en la nube (Firebase/Supabase) —
es otro proyecto, dilo cuando quieras y lo armamos.