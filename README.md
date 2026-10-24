# 🛡️ Sistema de Gestión Atlas — CreaLab SpA
### Plataforma de Gestión de Clientes, Contratos y Repositorio Documental con Seguridad y Calidad Integral

[![SonarQube Quality Gate](https://img.shields.io/badge/SonarQube%20Quality%20Gate-PASSED-brightgreen.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Security Rating](https://img.shields.io/badge/Security%20Rating-A-brightgreen.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Reliability Rating](https://img.shields.io/badge/Reliability%20Rating-A-brightgreen.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Maintainability Rating](https://img.shields.io/badge/Maintainability%20Rating-A-brightgreen.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Test Pass Rate](https://img.shields.io/badge/Tests-10%2F10%20PASSED%20(100%25)-success.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Standards](https://img.shields.io/badge/Normas-ISO%2FIEC%2025010%20%7C%2027001-blue.svg)](https://github.com/nparadab/SistemaGestionAltas)
[![Chilean Laws](https://img.shields.io/badge/Leyes%20Chile-Ley%2021.663%20%7C%20Ley%2021.719-blue.svg)](https://github.com/nparadab/SistemaGestionAltas)

---

## 📋 Información Académica e Institucional
* **Institución:** Duoc UC — Escuela de Informática y Telecomunicaciones
* **Asignatura:** Seguridad y Calidad en el Desarrollo de Software (ISY1102)
* **Evaluación:** Evaluación Parcial Nº 2 (EP3) — Encargo y Defensa Técnica
* **Caso Semestral:** Sistema de Gestión Atlas — CreaLab SpA
* **Integrantes del Equipo:**
  * Nicolás Fabián Parada Bahamondes (`n.paradab@duocuc.cl`)
  * Ana Pasarín
* **Sección:** 003D
* **Repositorio Oficial:** [https://github.com/nparadab/SistemaGestionAltas.git](https://github.com/nparadab/SistemaGestionAltas.git)

---

## 🎯 Descripción del Caso de Estudio

El **Sistema de Gestión Atlas** es una solución integral desarrollada por **CreaLab SpA** orientada a la administración de empresas clientes, contratos de prestación de servicios y repositorio centralizado de documentos para pequeñas y medianas empresas (pymes) en Chile. 

El sistema responde a una arquitectura multicapa desacoplada y robusta:
1. **Frontend:** Single Page Application (SPA) responsiva y accesible bajo estándar **WCAG 2.1 AA** (orientada a personas mayores, con contraste ≥ 4.5:1, tamaño tipográfico base ≥ 12px, áreas táctiles ≥ 40px y modo de alto contraste).
2. **Backend API REST:** Desarrollado sobre **Node.js y Express 5**, con control de acceso basado en roles (**RBAC**), autenticación sin estado mediante **JWT**, protección contra inyecciones SQL y sanitización de entradas.
3. **Capa de Persistencia y Trazabilidad:** Base de datos con soporte para **borrado lógico** (`activo = false`) y **bitácora de auditoría inmutable** para trazabilidad de eventos forenses.

---

## ⚖️ Marco Legal y Normativo Chileno

El software fue diseñado bajo los principios de *Security by Design* y *Privacy by Default*, garantizando estricta conformidad con el marco regulatorio vigente:

* **Ley N° 21.663 (Ley Marco de Ciberseguridad):**
  * Registro inmutable de eventos críticos (inicio de sesión, bloqueos de seguridad, creación, edición y desactivación de clientes).
  * Cada registro almacena timestamp UTC, identificador de usuario, acción ejecutada, recurso objetivo, IP de origen y detalle forense.
  * Facilita el cumplimiento de la obligación de notificación de incidentes de ciberseguridad ante el CSIRT Nacional y la Agencia Nacional de Ciberseguridad (ANCI) en un plazo menor a 3 horas.

* **Ley N° 21.719 (Protección de Datos Personales):**
  * Mecanismo de **Borrado Lógico**: Resuelve la dualidad entre el derecho a la cancelación/supresión del titular y la obligación legal de conservar antecedentes comerciales y tributarios durante 6 años (exigencia del Servicio de Impuestos Internos - SII).
  * Los registros desactivados son excluidos de la vista operativa y comercial, pero conservan su integridad para auditorías contables y tributarias.

---

## 🔍 Auditoría de Seguridad SAST con SonarQube™ & Git CI/CD

Para dar cumplimiento riguroso al **Indicador de Logro IL 2.3**, se utilizó **SonarQube™ Community Scanner v5.0** como herramienta oficial y exclusiva de Análisis Estático de Seguridad (SAST).

### Configuración de SonarQube y Git SCM
El archivo [`sonar-project.properties`](sonar-project.properties) establece las directrices de análisis del proyecto:
* **Project Key:** `sistema-atlas-crealab`
* **Perfil de Calidad:** *Sonar way* (JavaScript / Node.js)
* **SCM Provider:** `git` (`sonar.scm.provider=git`), permitiendo correlacionar cada hallazgo con el autor y commit correspondiente bajo el paradigma *Clean as You Code*.
* **Reglas de Seguridad Auditadas:** CWE, OWASP Top 10 (A01: Broken Access Control, A02: Cryptographic Failures, A03: Injection, A05: Security Misconfiguration).

### Resultados Oficiales del Quality Gate
```
================================================================================
             SONARQUBE™ COMMUNITY SCANNER - ANÁLISIS ESTÁTICO (SAST)
================================================================================
 Proyecto:           Sistema de Gestión Atlas (CreaLab SpA)
 Repositorio Git:    https://github.com/nparadab/SistemaGestionAltas.git
 Integración SCM:    Git SCM Provider (Clean as You Code)
 Estado Quality Gate: [ PASSED ]
--------------------------------------------------------------------------------
 [A] Confiabilidad (Reliability):       0 Bugs              (Rating: A)
 [A] Seguridad (Security):              0 Vulnerabilidades  (Rating: A)
 [A] Revisión de Seguridad (Hotspots):  100% Revisados      (Rating: A - 2/2 Safe)
 [A] Mantenibilidad (Maintainability):  2 Code Smells       (Rating: A - 10m Deuda)
 [✓] Duplicación de Código:             0.0% Duplicación
================================================================================
```

### Pipeline de Integración Continua (GitHub Actions)
Se implementó el flujo automatizado en [`.github/workflows/sonarqube.yml`](.github/workflows/sonarqube.yml) que se ejecuta en cada `push` y `pull request` hacia la rama principal:
1. Clonado del repositorio con historial Git completo (`fetch-depth: 0`).
2. Configuración del entorno Node.js v20 LTS.
3. Instalación de dependencias del proyecto.
4. Ejecución de la suite automatizada de pruebas dinámicas (`npm test`).
5. Ejecución del escáner estático SonarQube (`npm run sonar`).
6. Validación obligatoria del Quality Gate: si no cumple el estado `PASSED`, el pipeline falla automáticamente.

---

## 🧪 Resumen de la Suite Automatizada de Pruebas

Se diseñaron e implementaron 10 casos de prueba técnicos cubriendo el **100% de los requerimientos del ERS**, integrando validaciones dinámicas (DAST), pruebas de inyección, control de roles y rendimiento:

| ID Caso | Requisito ERS | Tipo de Prueba | Descripción del Caso | Resultado | Tiempo |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **CP-01** | RF-1.1 / NFR-SEG-9 | Funcional / Seguridad | Autenticación válida de usuario y generación de token JWT | **PASÓ** | 63 ms |
| **CP-02** | RF-1.1 / NFR-SEG-5 | Seguridad (Inyección SQL) | Bloqueo de ataque SQLi con payload `' OR 1=1 --` (HTTP 401) | **PASÓ** | 5 ms |
| **CP-03** | RF-3.2 / RB-4 / NFR-SEG-4 | Seguridad / RBAC | Restricción de escritura a rol Editor en endpoint de clientes (HTTP 403) | **PASÓ** | 7 ms |
| **CP-04** | RF-4.2 / NFR-SEG-8 / Ley 21.719 | Legal / Normativo | Eliminación lógica de cliente y persistencia de trazabilidad forense | **PASÓ** | 7 ms |
| **CP-05** | RF-6.1 / Ley 21.663 | Seguridad / Auditoría | Registro inmutable en bitácora de eventos para notificación CSIRT | **PASÓ** | 1 ms |
| **CP-06** | NFR-PERF-1 / ISO 25010 | Rendimiento | Latencia de respuesta en operaciones CRUD < 300 ms (Medido: ~1.2 ms) | **PASÓ** | 1 ms |
| **CP-07** | RF-5.4 | Regla de Negocio | Cálculo dinámico de estados de contratos (activo, por vencer, expirado) | **PASÓ** | 1 ms |
| **CP-08** | RF-1.2 / NFR-SEG-9 | Seguridad | Revocación efectiva de token JWT tras Logout (HTTP 401 en reuso) | **PASÓ** | 1 ms |
| **CP-09** | RF-5.2 / NFR-SEG-5 | Seguridad / Validación MIME | Rechazo de archivos ejecutables maliciosos (`.exe`) en adjuntos (HTTP 400) | **PASÓ** | 1 ms |
| **CP-10** | NFR-PERF-3 / ISO 25010 | Rendimiento / Concurrencia | Estabilidad y latencia bajo ráfaga de peticiones concurrentes | **PASÓ** | 10 ms |

**Tasa de Aprobación:** **100% (10 de 10 casos superados exitosamente).**

---

## 🛠️ Incidente Real Detectado y Remediado (INC-01)

* **Identificador:** `INC-01`
* **Severidad:** Moderada (Seguridad de Sesiones / RFC 7519)
* **Descripción del Fallo:** Durante las pruebas de re-autenticación consecutiva, al cerrar sesión y volver a autenticarse con el mismo usuario en el mismo segundo reloj, `jsonwebtoken` generaba un token idéntico al revocado en la lista negra, denegando el acceso legítimo del usuario (falso positivo de seguridad).
* **Solución Técnica Aplicada:** Se incorporó el claim de entropía criptográfica `jti` (JWT ID único) en `src/server.js`, garantizando unicidad irrepetible para cada sesión emitida mediante `Date.now() + Math.random().toString(36)`. La suite fue re-ejecutada con éxito absoluto.

---

## 🚀 Puesta en Marcha y Ejecución Local

### Prerrequisitos
* **Node.js** v18 o superior instalado.
* **Git** instalado.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/nparadab/SistemaGestionAltas.git
cd SistemaGestionAltas
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Iniciar el Servidor Web y API
```bash
npm start
```
El sistema estará disponible en [http://localhost:3000](http://localhost:3000).

### 4. Ejecutar la Auditoría Estática de SonarQube™ (SAST)
```bash
npm run sonar
```
Genera la auditoría completa en consola y exporta el archivo `sonarqube_report.json`.

### 5. Ejecutar la Suite de Pruebas Automatizadas (DAST)
```bash
npm test
```

---

## 🔑 Credenciales de Acceso para Demostración

| Usuario | Contraseña | Rol Asignado | Alcance de Permisos |
| :--- | :--- | :---: | :--- |
| `admin_test` | `Pass1234!#2026` | **Administrador** | Acceso total: creación, edición, eliminación lógica, auditoría y pruebas |
| `editor_test` | `Pass1234!#2026` | **Editor** | Solo lectura: visualización de clientes y contratos (escritura bloqueada con HTTP 403) |

---

## 📁 Documentos de Entrega Oficial (Carpeta `docs/`)

Los entregables oficiales exigidos por la pauta se encuentran disponibles para descarga directa:
* 📄 [**Informe Formal en PDF (22 Páginas):** `docs/Informe_Seguridad_y_Calidad_Atlas_EP2.pdf`](docs/Informe_Seguridad_y_Calidad_Atlas_EP2.pdf)
* 📑 [**Guía de Defensa y Preparación (10 min + 5 min Q&A):** `docs/GUIA_DEFENSA_EVALUACION_2.md`](docs/GUIA_DEFENSA_EVALUACION_2.md)
