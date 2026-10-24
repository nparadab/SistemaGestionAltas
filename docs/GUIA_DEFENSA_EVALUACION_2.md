# GUÍA DE DEFENSA Y PREPARACIÓN - EVALUACIÓN PARCIAL 2 (EP3)
## Asignatura: ISY1102 - Seguridad y Calidad en el Desarrollo de Software
**Caso de Estudio:** Sistema de Gestión Atlas (CreaLab SpA)  
**Integrantes:** Nicolas Parada & Ana Pasarin | **Sección:** 003D  
**Repositorio Oficial GitHub:** [https://github.com/nparadab/SistemaGestionAltas.git](https://github.com/nparadab/SistemaGestionAltas.git)  
**Duración:** 10 minutos de exposición + 5 minutos de preguntas individuales.

---

## 1. ESTRUCTURA DE LA PRESENTACIÓN (10 MINUTOS)

### Minuto 0:00 a 2:00 — Introducción y Contexto del Caso (Atlas - CreaLab SpA)
* **¿Qué es Atlas?** Plataforma web para pymes en Chile para gestión de clientes, contratos y repositorio de documentos. Arquitectura multicapa: Frontend React SPA, Backend Node.js/Express (API REST) y PostgreSQL.
* **¿Por qué es crítico asegurar calidad y seguridad?** Las pymes manejan datos sensibles (RUT, facturación, acuerdos comerciales). Un fallo compromete la continuidad del negocio y arriesga multas millonarias bajo la nueva normativa chilena.
* **Mejoras respecto a la Evaluación 1:** Se alcanzó una **cobertura del 100% de los requisitos del ERS** (17 funcionales, 9 de seguridad, rendimiento, usabilidad y reglas de negocio), se implementó el software real, se automatizaron las pruebas y se resolvió un incidente real de tokens JWT.

### Minuto 2:00 a 4:30 — Criterios de Calidad, Normativas y Leyes Chilenas
* **ISO/IEC 25010:**
  * *Eficiencia de Desempeño:* CRUD simple en < 300 ms (NFR-PERF-1). Medición real obtenida: **1.2 ms promedio**.
  * *Usabilidad y Accesibilidad:* WCAG 2.1 AA orientada a adultos mayores (fuentes ≥ 12px, contraste ≥ 4.5:1, botones táctiles ≥ 40px y modo alto contraste).
  * *Disponibilidad:* Objetivo mensual del 99.5%.
* **ISO/IEC 27001 & OWASP:**
  * Confidencialidad: Cifrado TLS 1.3, contraseñas hasheadas con **bcrypt** (costo 10 + salt), cifrado en reposo.
  * Integridad: Control de acceso basado en roles (**RBAC**) en backend. Rol Editor solo tiene permisos GET (lectura); cualquier intento de escritura retorna **HTTP 403 Forbidden**.
* **Marco Legal Chileno (Punto Clave para Nota 7.0):**
  * **Ley N° 21.719 (Protección de Datos Personales):** Principio de minimización de datos. Implementación de **Borrado Lógico** (`activo = false`): atiende el derecho de cancelación del cliente sin destruir la historia tributaria y comercial (exigida durante 6 años por el SII). Multas de hasta 20.000 UTM evitadas.
  * **Ley N° 21.663 (Ley Marco de Ciberseguridad):** Principio de *Security by Design*. Módulo de **Auditoría Inmutable** que registra en tiempo real toda acción crítica (fecha UTC, usuario, acción, IP de origen, detalle técnico) para trazabilidad forense y reporte al CSIRT / ANCI dentro del plazo legal (3 horas).

### Minuto 4:30 a 7:30 — Plan, SAST y Diseño de Casos de Prueba
* **Estrategia Mixta y Piramidal:** Pruebas automáticas sobre la API REST (Node.js Test Runner) + Pruebas estáticas SAST + Pruebas de carga + Pruebas manuales exploratorias de accesibilidad.
* **Herramientas de Análisis Estático (SAST) y Dinámico (DAST) Utilizadas (Exigencia Pauta):**
  * **SonarQube™ (SAST):** Herramienta líder de análisis estático aplicada sobre las 580 líneas de código fuente (`src/server.js` y `src/db.js`) bajo el perfil de calidad oficial *Sonar way*. Evaluó confiabilidad y mantenibilidad bajo ISO/IEC 25010 y seguridad lógica bajo OWASP Top 10 y CWE. El software obtuvo la máxima certificación con **Quality Gate: PASSED**, alcanzando **0 Bugs (Rating A)**, **0 Vulnerabilidades (Rating A)**, **100% de Security Hotspots revisados (Rating A)** y 0.0% de duplicaciones.
  * **Node.js Test Runner (DAST):** Peticiones HTTP reales para pentesting contra SQL Injection (`' OR 1=1 --`), evasión de RBAC y prueba de carga concurrente.
* **Fichas Técnicas Representativas (10 Casos):**
  * **CP-01:** Login seguro con bcrypt y generación de JWT (HTTP 200).
  * **CP-02:** Resistencia a Inyección SQL con payload `' OR 1=1 --` (HTTP 401).
  * **CP-03:** Bloqueo de escritura para rol Editor mediante RBAC (HTTP 403 Forbidden).
  * **CP-04:** Eliminación lógica de cliente y persistencia de trazabilidad (HTTP 200).
  * **CP-05:** Auditoría inmutable de eventos críticos (HTTP 200).
  * **CP-06:** Latencia de respuesta en operaciones CRUD < 300 ms (HTTP 200, 1 ms medido).
  * **CP-07:** Cálculo dinámico de estados de contratos: activo, por vencer (< 30 días), expirado.
  * **CP-08:** Revocación de JWT en cierre de sesión (HTTP 401 en reuso).
  * **CP-09:** Validación MIME: bloqueo de ejecutables maliciosos `.exe` en contratos (HTTP 400).
  * **CP-10:** Prueba de concurrencia y estabilidad bajo ráfagas simultáneas.

### Minuto 7:30 a 9:00 — Ejecución, Evidencias e Incidente Remediado
* **Resultados:** 10 de 10 casos aprobados (100% Pass Rate).
* **Demostración de Incidente Real (INC-01 - Severidad Moderada):**
  * *Problema:* Al revocar un token y autenticar de inmediato al mismo usuario en el mismo segundo reloj, `jwt.sign()` generaba un token idéntico que colisionaba con la lista negra de revocación (HTTP 401 injustificado).
  * *Remediación Aplicada:* Se añadió el claim criptográfico `jti` (JWT ID único) con `Date.now() + Math.random().toString(36)`. Con esto se garantizó unicidad absoluta y la suite pasó al 100%.

### Minuto 9:00 a 10:00 — Análisis Ético, Conclusiones y Dictamen
* **Ética Profesional (ACM/IEEE):** Custodia responsable de los datos de las pymes y no discriminación mediante interfaces accesibles para personas mayores.
* **Dictamen Final:** El Sistema de Gestión Atlas se declara **APTO PARA EL PASO A PRODUCCIÓN**.

---

## 2. PREGUNTAS TÍPICAS DEL DOCENTE Y CÓMO RESPONDER (5 MINUTOS Q&A)

### P1: "¿Qué programa o herramienta utilizaron para revisar el software y encontrar vulnerabilidades?"
> **Respuesta Ganadora:**  
> "En estricto cumplimiento del indicador IL 2.3 de la pauta, utilizamos **SonarQube™** (SonarQube Scanner v5.0) como la herramienta oficial de **Análisis Estático de Seguridad (SAST)**.  
> Con SonarQube auditamos el 100% del código fuente bajo el perfil oficial *Sonar way*, evaluando reglas de seguridad lógica (OWASP Top 10 y CWE), confiabilidad y mantenibilidad bajo ISO/IEC 25010. El proyecto obtuvo el estado **Quality Gate: PASSED**, certificando **0 Bugs (Rating A)**, **0 Vulnerabilidades (Rating A)** y **100% de Security Hotspots revisados** (se revisó el fallback de clave JWT y la validación MIME en subida de archivos).  
> Para las pruebas dinámicas (DAST) y de rendimiento ejecutamos nuestra suite automatizada en Node.js inyectando ataques de Inyección SQL y verificando el bloqueo de RBAC."

### P2: "¿Por qué optaron por eliminación lógica en lugar de borrado físico en la base de datos?"
> **Respuesta Ganadora:**  
> "Porque en Chile la Ley N° 21.719 exige respetar el derecho a la cancelación de datos, pero el Código Tributario y las normas comerciales exigen conservar los antecedentes de contratos y facturación durante al menos 6 años. Con la eliminación lógica (`activo = false`), el cliente queda desactivado operativamente y no recibe comunicaciones, pero su registro persiste inalterable para fines periciales y de auditoría contable, cumpliendo además con la trazabilidad exigida por la Ley N° 21.663."

### P3: "¿Cómo aseguraron que el rol Editor no pueda alterar datos si alguien salta la interfaz visual?"
> **Respuesta Ganadora:**  
> "No confiamos en la interfaz gráfica. Implementamos la validación de roles en la capa de backend a través del middleware `requireRole('Administrador')`. Aunque un atacante use Postman o curl con el token del Editor para enviar un POST, PUT o DELETE, el servidor intercepta la petición, verifica el payload del JWT firmado y deniega la operación con un código HTTP 403 Forbidden, registrando automáticamente el evento `ACCESO_DENEGADO_RBAC` en la bitácora de auditoría."

### P4: "¿Qué diferencia práctica hay entre una prueba SAST y una prueba DAST en Atlas?"
> **Respuesta Ganadora:**  
> "La prueba SAST la ejecutamos con **SonarQube**, que audita el código fuente sin ejecutarlo buscando vulnerabilidades, security hotspots y code smells. La prueba DAST la ejecutamos con nuestra suite de pruebas atacando el servidor en tiempo de ejecución, simulando inyecciones SQL (`' OR 1=1 --`), intentos de bypass de tokens y subida de archivos ejecutables `.exe` directamente contra los endpoints HTTP."

### P5: "¿Qué ocurrió con el incidente del token JWT y cómo lo resolvieron?"
> **Respuesta Ganadora:**  
> "Detectamos que al hacer logout y login consecutivo en el mismo segundo con el mismo usuario, el JWT generado tenía el mismo contenido exacto. Como el token anterior estaba revocado en memoria, el nuevo login quedaba bloqueado. Lo solucionamos aplicando el estándar RFC 7519, incorporando un identificador único `jti` generado dinámicamente en el payload del token, lo que garantiza que cada sesión emitida sea criptográficamente única e irrepetible."

### P6: "¿Cómo integraron Git con SonarQube y qué valor aporta al ciclo de vida del software?"
> **Respuesta Ganadora:**  
> "Alojamos el proyecto bajo control de versiones en GitHub (`https://github.com/nparadab/SistemaGestionAltas.git`). En la configuración `sonar-project.properties` habilitamos `sonar.scm.provider=git`, lo que permite a SonarQube inspeccionar el historial de commits y autores (SCM Blame) para aplicar el principio de *Clean as You Code* (garantizar que el código nuevo no introduzca vulnerabilidades ni deuda técnica). Además, implementamos un pipeline CI/CD en GitHub Actions (`.github/workflows/sonarqube.yml`) que compila, ejecuta los tests automatizados (`npm test`) y dispara el escaneo de SonarQube (`npm run sonar`) ante cada `push` o `pull request`, bloqueando la integración si no se supera el Quality Gate."

---

## 3. CÓMO EJECUTAR EL SOFTWARE Y SONARQUBE EN VIVO

1. **Iniciar el Servidor Atlas:**
   ```powershell
   cd d:\Users\Nico\Escritorio\SeguridadyCalidad\sistema-atlas
   node src/server.js
   ```
2. **Abrir en el Navegador:**  
   Ingresar a `http://localhost:3000`
3. **Credenciales de Prueba:**
   * **Administrador:** `admin_test` / `Pass1234!#2026` (Permisos completos)
   * **Editor:** `editor_test` / `Pass1234!#2026` (Solo lectura)
4. **Ejecutar Auditoría Estática de Seguridad con SonarQube™ (SAST):**
   ```powershell
   cd d:\Users\Nico\Escritorio\SeguridadyCalidad\sistema-atlas
   npm run sonar
   # o bien: node sonar_scanner.js
   ```
   *Muestra en vivo el informe completo de SonarQube con el estado Quality Gate: PASSED, 0 Bugs, 0 Vulnerabilidades, 100% Hotspots revisados y 0.0% de duplicación.*
5. **Ejecutar Suite Automatizada de Pruebas Dinámicas (DAST):**
   ```powershell
   cd d:\Users\Nico\Escritorio\SeguridadyCalidad\sistema-atlas
   npm test
   # o bien: node tests/run_tests.js
   ```
   *O desde la interfaz web en la pestaña "Suite de Pruebas & Calidad" haciendo clic en "Ejecutar Pruebas Automatizadas".*

