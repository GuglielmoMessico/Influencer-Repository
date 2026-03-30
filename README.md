# Yefer Showw Media Kit

Este es el repositorio oficial del Media Kit interactivo de **Yefer Showw**. Una plataforma diseñada para la gestión de campañas, visualización de métricas en tiempo real y CRM para creadores de contenido.

## 🚀 Tecnologías Principales

- **Frontend**: React 18 + Vite + TypeScript
- **Estilos**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Gráficas**: Recharts
- **Animaciones**: Framer Motion

## 🛠️ Configuración Local

Para correr este proyecto localmente, asegúrate de tener [Node.js](https://nodejs.org/) instalado.

1. **Clonar el repositorio**:
   ```sh
   git clone <URL_DEL_REPO>
   cd Influencer-Repository-main
   ```

2. **Instalar dependencias**:
   ```sh
   npm install
   ```

3. **Variables de Entorno**:
   Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

4. **Correr servidor de desarrollo**:
   ```sh
   npm run dev
   ```

## 🏗️ Estructura del Proyecto

- `src/components`: Componentes de UI reutilizables.
- `src/hooks`: Lógica de estado y fetching de datos.
- `src/lib`: Capa de servicios y clientes (Supabase).
- `src/pages`: Vistas principales de la aplicación.
- `Coloca los documentos aqui/`: Documentación técnica detallada.

## 📄 Despliegue

El proyecto está diseñado para ser desplegado como una SPA estática en plataformas como Vercel, Netlify o GitHub Pages.
