# Password Security Simulator

Simulador educativo de ataques de fuerza bruta a contraseñas, desarrollado en React + TypeScript + Flask. Muestra en tiempo real cómo un atacante cracks contraseñas usando tres fases: **diccionario → reglas → fuerza bruta**.

## Características

- **3 fases de ataque**: diccionario (200 contraseñas comunes), reglas (leet, sufijos, capitalización, reverso), fuerza bruta (combinatoria sistemática)
- **Comparación en vivo**: columna teórica (cálculo instantáneo) vs columna en tiempo real (animación paso a paso)
- **Selector de hardware**: PC Básica (500K/s), PC Gamer (5M/s), RTX 4090 (800M/s), Botnet (5B/s)
- **Selector de modo de ataque**: todas las fases, solo diccionario, solo reglas, solo fuerza bruta
- **Bilingüe**: español e inglés intercambiables
- **6 pantallas**: Inicio, Laboratorio, Ataque, Dashboard, Resultados, Código
- **Modo oscuro/claro**
- **Demo integrada** con 9 cuentas de distinta complejidad

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS, shadcn/ui |
| Backend | Python 3, Flask, Flask-CORS |
| Gráficos | Recharts, Victory |
| Despliegue | Render (servicio unificado) |

## Ejecutar en local

```bash
# Backend (puerto 5001)
cd backend
pip install -r requirements.txt
python api_server.py

# Frontend (puerto 5173, con proxy a backend)
cd frontend
pnpm install
pnpm run dev
```

## Despliegue

El proyecto está configurado para desplegarse en **Render** como un solo servicio web. El backend Flask sirve tanto la API como los archivos estáticos del frontend compilado.

1. Crear cuenta en [render.com](https://render.com) (login con GitHub)
2. "New +" → "Web Service" → conectar repositorio
3. Render detecta `render.yaml` automáticamente
4. Elegir región y plan Free
5. Crear servicio

## Licencia

Proyecto académico — todas las credenciales son ficticias.
