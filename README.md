# Student Manager

Una aplicación de escritorio para la gestión de estudiantes y préstamos de ayudas técnicas. Permite administrar inventario de equipos, registro de estudiantes y seguimiento completo de préstamos.

## Características

- **Gestión de Estudiantes**: Registro completo de información de estudiantes con NIE y número de estudiante.
- **Inventario de Equipos**: Control de equipos disponibles con seguimiento de stock.
- **Gestión de Préstamos**:
  - Registro de préstamos de ayudas técnicas a estudiantes
  - Control de devoluciones
  - Seguimiento por curso escolar
  - Filtros avanzados por estado, curso y búsqueda
- **Base de Datos Local**: Almacenamiento persistente de datos con SQLite.
- **Interfaz Intuitiva**: Diseñada con React y Ant Design para una experiencia de usuario óptima.

## Capturas de pantalla

_(Añadir capturas de pantalla aquí cuando estén disponibles)_

## Requisitos previos

- Node.js (v14.0.0 o superior)
- npm (v6.0.0 o superior)

## Instalación

1. Clona este repositorio:

   ```
   git clone https://github.com/tuusuario/student-manager.git
   cd student-manager
   ```
2. Instala las dependencias:

   ```
   cd student-manager-app
   npm install
   ```
3. Inicia la aplicación en modo desarrollo:

   ```
   npm start
   ```
4. Para crear una versión distribuible:

   ```
   npm run make
   ```

   Los archivos de instalación se generarán en la carpeta `out`.

## Estructura del proyecto

```
student-manager-app/
├── src/                     # Código fuente
│   ├── main.js              # Proceso principal de Electron
│   ├── preload.js           # Script de precarga
│   ├── renderer.js          # Punto de entrada del renderizador
│   ├── pages/               # Componentes de páginas
│   ├── components/          # Componentes reutilizables
│   └── assets/              # Recursos estáticos
├── package.json             # Dependencias y scripts
└── ...
```

## Uso

### Gestión de Estudiantes

La sección de Estudiantes permite añadir, editar y eliminar registros de estudiantes con su información personal.

### Inventario de Equipos

El módulo de equipos facilita el registro y seguimiento del inventario disponible para préstamos.

### Ayudas Técnicas

Esta sección gestiona los préstamos de equipos a estudiantes, permitiendo:

- Registro de nuevos préstamos
- Devolución de equipos
- Filtrado por estado (pendiente/devuelto)
- Filtrado por curso escolar
- Búsqueda rápida

## Tecnologías utilizadas

- **Electron**: Framework para crear aplicaciones de escritorio multiplataforma
- **React**: Biblioteca para construir interfaces de usuario
- **SQLite**: Base de datos relacional integrada
- **Ant Design**: Sistema de diseño para interfaces gráficas
- **Node.js**: Entorno de ejecución para JavaScript

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
