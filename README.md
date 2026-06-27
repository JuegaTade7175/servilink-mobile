# ServiLink Mobile

Aplicación móvil de **ServiLink** desarrollada con **React Native** y **Expo**. El proyecto permite conectar clientes con profesionales de servicios domésticos en Lima, Perú, con búsqueda por lista y mapa, reservas, chat, pagos, confirmación de citas, reseñas, notificaciones y gestión de disponibilidad.

Proyecto desarrollado para el curso **CS 2031 Desarrollo Basado en Plataformas, UTEC 2026-1**.

## Integrantes

| Nombre | Código |
| --- | --- |
| Tadeo Joaquín Cárdenas Soto | 202510004 |
| José Enrique Hilario Ruiz Lam | 202510050 |
| Sebastian Falvy Mendoza | 202510469 |
| Joel Rodrigo Eulogio Coquil | 202510112 |
| Miguel Adrian Espinoza Arnero | 202320031 |

## Usuarios de prueba

| Email | Password | Rol |
| --- | --- | --- |
| `carlos@servilink.pe` | `password123` | CLIENT |

## Stack técnico

- **React Native 0.81** y **React 19**.
- **Expo 54** con nueva arquitectura habilitada.
- **TypeScript** para tipado estático.
- **React Navigation 7** para navegación por stacks y tabs inferiores.
- **React Native Paper 5** para componentes Material Design.
- **Axios** para consumo de API REST.
- **AsyncStorage** para persistencia local de sesión.
- **React Native Maps** para vista de profesionales en mapa.
- **Expo Location** para permisos y ubicación del usuario.
- **Expo Image Picker** y **Expo Camera** para gestión de imágenes.
- **Expo Audio** y **Expo Sensors** como dependencias disponibles para flujos nativos.
- **Lucide React Native** y **Expo Vector Icons** para iconografía.
- **Jest Expo** para pruebas.

## Funcionalidades principales

- **Autenticación por roles:** registro e inicio de sesión para clientes y profesionales.
- **Sesión persistente:** almacenamiento de token JWT y datos del usuario con `AsyncStorage`.
- **Manejo automático de autorización:** interceptor de Axios que adjunta el token y cierra sesión ante respuestas `401`.
- **Dashboard de cliente:** búsqueda de profesionales, mapa, reservas, chats y perfil.
- **Dashboard de profesional:** reservas recibidas, disponibilidad semanal, perfil profesional y notificaciones.
- **Onboarding profesional:** creación del perfil profesional cuando el usuario aún no tiene uno.
- **Búsqueda de profesionales:** listado de profesionales cercanos con especialidad, tarifa, calificación, verificación y servicios.
- **Mapa de profesionales:** consulta de puntos geográficos y profesionales cercanos mediante endpoints de mapa.
- **Flujo de reserva:** selección de profesional, servicio, fecha, hora, dirección y descripción.
- **Detalle de reserva:** cambio de estado, pago, confirmación por código y reseña.
- **Chat por reserva:** conversaciones asociadas a reservas, mensajes no leídos y refresco manual.
- **Notificaciones:** conteo de no leídas, listado y marcado como leídas.
- **Pagos:** registro de pagos por tarjeta, Yape o transferencia bancaria.
- **Disponibilidad:** creación, edición y eliminación de horarios por día de semana.
- **Perfil:** visualización y actualización de datos del cliente o profesional, incluyendo foto.

## Requisitos

- **Node.js 18** o superior.
- **npm 9** o superior.
- **Expo Go** en un dispositivo físico o un emulador Android/iOS configurado.
- **Backend de ServiLink** ejecutándose y accesible desde el dispositivo.

## Instalación y ejecución

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Configurar variables de entorno en un archivo `.env` en la raíz del proyecto:

   ```env
   EXPO_PUBLIC_API_URL=http://tu-ip-local:8081
   ```

   Si pruebas desde un celular físico, usa la IP local de tu computadora en lugar de `localhost`.

3. Iniciar Expo:

   ```bash
   npm start
   ```

4. Ejecutar la app:

   - Escanea el código QR con **Expo Go**.
   - Presiona `a` para abrir Android.
   - Presiona `i` para abrir iOS, solo en macOS.
   - Presiona `w` para abrir la versión web experimental.

## Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo de Expo. |
| `npm run android` | Abre la app en un emulador o dispositivo Android. |
| `npm run ios` | Abre la app en el simulador iOS. |
| `npm run web` | Abre la app en navegador web. |
| `npm test` | Ejecuta Jest en modo watch. |
| `npm run lint` | Ejecuta el lint de Expo. |

## Estructura del proyecto

```text
servilink-mobile/
├── App.tsx
├── app.json
├── index.ts
├── package.json
├── tsconfig.json
└── src/
    ├── api/
    │   └── index.ts
    ├── context/
    │   └── AuthContext.tsx
    ├── navigation/
    │   └── AppNavigator.tsx
    ├── screens/
    │   ├── Auth/
    │   │   ├── LoginScreen.tsx
    │   │   └── RegisterScreen.tsx
    │   ├── Client/
    │   │   ├── ClientBookings.tsx
    │   │   ├── ClientDashboard.tsx
    │   │   ├── ClientProfessionalList.tsx
    │   │   └── ClientProfile.tsx
    │   ├── Professional/
    │   │   ├── ProfessionalBookings.tsx
    │   │   ├── ProfessionalDashboard.tsx
    │   │   ├── ProfessionalOnboardingScreen.tsx
    │   │   └── ProfessionalProfile.tsx
    │   └── Shared/
    │       ├── AvailabilityScreen.tsx
    │       ├── BookingDetailScreen.tsx
    │       ├── BookingWizard.tsx
    │       ├── ChatListScreen.tsx
    │       ├── ChatScreen.tsx
    │       ├── MapScreen.native.tsx
    │       ├── MapScreen.web.tsx
    │       ├── NotificationsScreen.tsx
    │       └── ProfessionalDetail.tsx
    └── types/
        └── index.ts
```

## Arquitectura

La aplicación usa `AuthContext` como estado global de autenticación. Al iniciar, carga desde `AsyncStorage` el token, id, nombre, correo y rol del usuario. La navegación principal en `AppNavigator` decide entre las pantallas de autenticación y el dashboard correspondiente al rol autenticado.

El cliente autenticado entra a `ClientDashboard`, que usa tabs inferiores para buscar profesionales, ver mapa, gestionar reservas, entrar a chats y administrar su perfil. El profesional entra a `ProfessionalDashboard`, que valida si ya existe un perfil profesional; si no existe, muestra el onboarding antes de permitir reservas, horarios y perfil.

La comunicación con el backend está centralizada en `src/api/index.ts`. Allí se configuran:

- `authApi` para login y registro.
- `usersApi` para perfil del usuario y foto.
- `professionalsApi` para profesionales cercanos, detalle y perfil profesional.
- `mapApi` para puntos de mapa, geocodificación y distancia.
- `categoriesApi` para categorías y servicios.
- `bookingsApi` para reservas y estados.
- `confirmationsApi` para códigos de confirmación.
- `messagesApi` para chat.
- `notificationsApi` para notificaciones.
- `paymentsApi` para pagos.
- `reviewsApi` para reseñas.
- `availabilityApi` para horarios disponibles.

## Configuración nativa

La app está configurada en `app.json` con orientación vertical, paquete Android `com.servilink.app` y permisos de ubicación:

- `ACCESS_COARSE_LOCATION`
- `ACCESS_FINE_LOCATION`

En iOS se declara `NSLocationWhenInUseUsageDescription` para explicar el uso de ubicación al usuario.

## Estado del proyecto

Versión funcional del cliente móvil de ServiLink conectada al backend. La app cubre autenticación, búsqueda de profesionales, mapa, reservas, confirmación de citas, pagos, reseñas, chat, notificaciones, perfiles y disponibilidad profesional.
