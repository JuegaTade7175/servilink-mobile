# ServiLink Mobile

Aplicación móvil de ServiLink desarrollada con **React Native** y **Expo**. Esta aplicación permite conectar clientes con profesionales de servicios domésticos en Lima, Perú, ofreciendo una experiencia optimizada para dispositivos móviles.

Proyecto desarrollado para el curso CS 2031 Desarrollo Basado en Plataformas, UTEC 2026-1.

## Integrantes

| Nombre | Código |
|---|---|
| Tadeo Joaquín Cárdenas Soto | 202510004 |
| José Enrique Hilario Ruiz Lam | 202510050 |
| Sebastian Falvy Mendoza | 202510469 |
| Joel Rodrigo Eulogio Coquil | 202510112 |
| Miguel Adrian Espinoza Arnero | 202320031 |

---

## Stack técnico

- **React Native** (v0.81)
- **Expo** (v54)
- **TypeScript**
- **React Navigation** (v7) para navegación nativa.
- **React Native Paper** (v5) para componentes de UI.
- **Axios** para peticiones HTTP.
- **AsyncStorage** para persistencia de sesión local.
- **Lucide React Native** para iconografía.

## Funcionalidades principales

- **Autenticación completa:** Login y registro para clientes y profesionales.
- **Gestión de Sesión:** Persistencia segura mediante `AsyncStorage` y manejo global con `AuthContext`.
- **Navegación Dinámica:** Rutas protegidas y menús adaptados según el rol del usuario (Cliente o Profesional).
- **Dashboard de Cliente:** Visualización de profesionales y gestión de reservas activas.
- **Dashboard de Profesional:** Gestión de servicios, visualización de reservas recibidas y perfil profesional.
- **Integración con API:** Consumo de servicios REST mediante interceptores de Axios para manejo de tokens JWT.
- **Interfaz Nativa:** Componentes optimizados para Android e iOS con diseño responsivo.

## Requisitos

- **Node.js** 18 o superior.
- **npm** 9 o superior.
- **Expo Go** instalado en tu dispositivo móvil (disponible en Play Store y App Store) o un emulador de Android/iOS configurado.
- **Backend de ServiLink** ejecutándose (por defecto en `http://localhost:8081`).

## Instalación y ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto y define la URL de tu backend:
   ```env
   EXPO_PUBLIC_API_URL=http://tu-ip-local:8081
   ```
   *Nota: Usa tu IP local en lugar de `localhost` si estás probando en un dispositivo físico.*

3. **Iniciar el servidor de desarrollo de Expo:**
   ```bash
   npm start
   ```

4. **Ejecutar en dispositivo o emulador:**
   - Escanea el código QR con la app **Expo Go** (Android) o la cámara (iOS).
   - Presiona `a` para abrir en un emulador de Android.
   - Presiona `i` para abrir en el simulador de iOS (solo macOS).

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm start` | Inicia Expo Go y muestra el código QR. |
| `npm run android` | Intenta abrir la app directamente en un emulador Android conectado. |
| `npm run ios` | Intenta abrir la app directamente en el simulador iOS. |
| `npm run web` | Abre una versión web experimental de la app. |

## Estructura del proyecto

```text
servilink-mobile/
├── App.tsx             # Punto de entrada de la aplicación
├── app.json            # Configuración de Expo
├── package.json        # Dependencias y scripts
└── src/
    ├── api/            # Configuración de Axios y servicios de API
    ├── context/        # Contextos globales (AuthContext)
    ├── navigation/     # Configuración de React Navigation
    ├── screens/        # Pantallas de la aplicación
    │   ├── Auth/       # Login y Registro
    │   ├── Client/     # Vistas exclusivas para Clientes
    │   └── Professional/ # Vistas exclusivas para Profesionales
    └── types/          # Definiciones de TypeScript
```

## Arquitectura

La aplicación utiliza un patrón de **Context API** para el manejo del estado global de autenticación, asegurando que el token y los datos del usuario estén disponibles en toda la app. La navegación está dividida en pilas (stacks) de autenticación y de aplicación, cambiando dinámicamente según el estado de `isAuthenticated`.

### Integración API

La comunicación con el backend se centraliza en `src/api/index.ts`, donde se configura un interceptor que adjunta automáticamente el token JWT almacenado en `AsyncStorage` a cada petición saliente.

## Usuarios de prueba

| Email | Password | Rol |
| --- | --- | --- |
| `carlos@servilink.pe` | `password123` | CLIENT |
| `juan.rios@servilink.pe` | `password123` | PROFESSIONAL |

---

## Estado del proyecto

Versión funcional del cliente móvil conectada al backend de ServiLink. Soporta los flujos críticos de registro, inicio de sesión y visualización de dashboards para ambos roles.
