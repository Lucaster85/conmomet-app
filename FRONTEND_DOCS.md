# Conmomet App - Frontend

## 📋 Descripción
Sistema de gestión empresarial desarrollado con Next.js, TypeScript y Material-UI.

## 🚀 Tecnologías
- **Frontend**: Next.js 15.1.0 + TypeScript
- **UI Library**: Material-UI (@mui/material)
- **Estilos**: Material-UI + TailwindCSS
- **Autenticación**: JWT + localStorage
- **Backend**: Node.js (puerto 4000)

## 📁 Estructura del Proyecto
```
src/
├── app/
│   ├── page.tsx              # Landing page con sliders
│   ├── login/page.tsx        # Formulario de login
│   ├── dashboard/            # Sistema privado
│   │   ├── layout.tsx        # Layout con menú lateral
│   │   └── page.tsx          # Dashboard principal
│   ├── layout.tsx            # Layout principal con Material-UI
│   └── theme.ts              # Configuración del tema
├── components/
│   ├── ImageSlider.tsx       # Slider de imágenes para hero
│   ├── CardSlider.tsx        # Slider de tarjetas de noticias
│   └── ProtectedRoute.tsx    # Componente para rutas privadas
└── utils/
    └── auth.ts               # Sistema de autenticación JWT
```

## 🔐 Sistema de Autenticación

### Configuración
- **Backend URL**: `http://localhost:4000`
- **Endpoint Login**: `/auth/login`
- **Método**: POST con `{ email, password }`

### Credenciales de Prueba
- **Email**: `admin@mail.com`
- **Password**: `123456`

### Funcionalidades
- ✅ Login con JWT
- ✅ Verificación de tokens
- ✅ Protección de rutas privadas
- ✅ Logout automático en expiración
- ✅ Manejo de errores del backend

## 🎨 Componentes Implementados

### Landing Page
- ✅ Navigation bar fija
- ✅ Hero section con slider de imágenes
- ✅ Sección de características (3 cards)
- ✅ Slider de noticias/artículos
- ✅ Footer completo

### Dashboard
- ✅ Menú lateral responsive
- ✅ Header con información del usuario
- ✅ Protección por autenticación
- ✅ Cards de estadísticas
- ✅ Actividad reciente
- ✅ Estado del sistema

## 🔧 Scripts Disponibles
```bash
npm run dev     # Servidor de desarrollo
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # Linter
```

## 🌐 Variables de Entorno
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

## 📝 Próximos Pasos Sugeridos
1. [ ] Agregar más páginas al dashboard (usuarios, productos, etc.)
2. [ ] Implementar CRUD operations con el backend
3. [ ] Agregar sistema de refresh tokens
4. [ ] Implementar notificaciones
5. [ ] Agregar tests unitarios
6. [ ] Optimizar imágenes y performance

## 🐛 Resolución de Problemas

### Error de CORS
Si hay problemas de CORS, verificar configuración en el backend.

### Token Expirado
El sistema maneja automáticamente la expiración y redirige al login.

### Variables de Entorno
Asegúrate de que las variables empiecen con `NEXT_PUBLIC_` para uso en frontend.

## 📞 Contacto del Proyecto
- **Desarrollador**: Lucas Castro
- **Repositorio**: conmomet-app
- **Rama**: main

---
*Documentación actualizada: 22 de Octubre, 2025*