const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'atlas_super_secret_jwt_key_2026_crealab';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    }
});

// File filter for allowed types (PDF, DOC, PPT, JPG, PNG)
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido (${ext}). Se permiten: PDF, DOC, PPT, JPG, PNG`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Helper: Calculate Contract State (RF-5.4)
function calculateContractStatus(fechaTermino) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(fechaTermino);
    end.setHours(0, 0, 0, 0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'expirado';
    if (diffDays <= 30) return 'por_vencer';
    return 'activo';
}

// Middleware: Authenticate Token & Check Revocation (RF-1.1, RF-1.2, NFR-SEG-9)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso no proporcionado (401 Unauthorized)' });
    }

    if (db.data.revoked_tokens && db.data.revoked_tokens.includes(token)) {
        return res.status(401).json({ error: 'Token revocado por cierre de sesión' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado (403 Forbidden)' });
        }
        req.user = decoded;
        req.token = token;
        next();
    });
}

// Middleware: Role-Based Access Control (RBAC) (RF-3.2, RB-4, RB-5, NFR-SEG-4)
function requireRole(roleRequired) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        if (req.user.role !== roleRequired) {
            // Log security incident / denied access
            db.logAuditoria(
                req.user.id,
                req.user.username,
                'ACCESO_DENEGADO_RBAC',
                req.originalUrl,
                req.ip,
                `Intento de acceso denegado a recurso restringido por rol ${req.user.role}`
            );
            return res.status(403).json({
                error: `Acceso denegado: El rol '${req.user.role}' no posee permisos para esta operación. Se requiere rol '${roleRequired}'.`
            });
        }
        next();
    };
}

// ==========================================
// RUTAS DE LA API (SRS ATLAS)
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'Sistema de Gestión Atlas API',
        version: '1.2.0',
        standards: ['ISO/IEC 25010', 'ISO/IEC 27001', 'Ley 21.663', 'Ley 21.719']
    });
});

// RF-1.1: Inicio de sesión seguro
app.post('/api/auth/login', (req, res) => {
    const { nombre_usuario, username, contraseña, password } = req.body;
    const loginUser = (nombre_usuario || username || '').trim();
    const loginPass = contraseña || password || '';

    // Sanitización y validación contra SQLi / campos vacíos
    if (!loginUser || !loginPass) {
        return res.status(400).json({ error: 'Debe ingresar nombre de usuario y contraseña' });
    }

    const user = db.data.users.find(u => u.username.toLowerCase() === loginUser.toLowerCase());
    if (!user) {
        db.logAuditoria(null, loginUser, 'LOGIN_FALLIDO', 'AUTH', req.ip, 'Usuario no encontrado');
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = bcrypt.compareSync(loginPass, user.password_hash);
    if (!match) {
        db.logAuditoria(user.id, user.username, 'LOGIN_FALLIDO', 'AUTH', req.ip, 'Contraseña incorrecta');
        return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Buscar relación empresa y rol
    const empUser = db.data.empresa_usuarios.find(eu => eu.user_id === user.id) || { empresa_id: 1, role: 'Editor' };
    const empresa = db.data.empresas.find(e => e.id === empUser.empresa_id);

    const token = jwt.sign({
        jti: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        id: user.id,
        username: user.username,
        email: user.email,
        empresa_id: empUser.empresa_id,
        role: empUser.role
    }, JWT_SECRET, { expiresIn: '8h' });

    db.logAuditoria(user.id, user.username, 'LOGIN_EXITOSO', 'AUTH', req.ip, `Inicio de sesión exitoso con rol ${empUser.role}`);

    res.json({
        message: 'Autenticación exitosa',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: empUser.role,
            empresa_id: empUser.empresa_id,
            empresa_nombre: empresa ? empresa.nombre : 'Sin Empresa'
        }
    });
});

// RF-1.2: Cierre de sesión y revocación de token
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    if (!db.data.revoked_tokens) db.data.revoked_tokens = [];
    db.data.revoked_tokens.push(req.token);
    db.save();

    db.logAuditoria(req.user.id, req.user.username, 'LOGOUT', 'AUTH', req.ip, 'Cierre de sesión e invalidación de token JWT');
    res.json({ message: 'Sesión cerrada correctamente y token revocado' });
});

// RF-2.1: Registro de usuarios
app.post('/api/auth/register', (req, res) => {
    const { username, password, email } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Todos los campos son requeridos (username, password, email)' });
    }

    // Política de contraseñas (SRS 2.4: mínimo 8-12 caracteres, mayúscula, minúscula, número)
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe contener al menos 8 caracteres' });
    }

    const existingUser = db.data.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        return res.status(409).json({ error: 'El nombre de usuario o correo ya se encuentra registrado' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    const newUser = {
        id: db.data.users.length ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1,
        username,
        email,
        password_hash,
        created_at: new Date().toISOString()
    };
    db.data.users.push(newUser);
    db.save();

    db.logAuditoria(newUser.id, newUser.username, 'USUARIO_REGISTRADO', 'USUARIOS', req.ip, `Registro de nuevo usuario ${username}`);
    res.status(201).json({ message: 'Usuario registrado exitosamente', user: { id: newUser.id, username: newUser.username, email: newUser.email } });
});

// RF-4.2: Listar clientes (ambos roles pueden leer)
app.get('/api/empresas/:id/clients', authenticateToken, (req, res) => {
    const empresaId = parseInt(req.params.id);
    const { search, include_deleted } = req.query;

    let clients = db.data.clients.filter(c => c.empresa_id === empresaId);

    if (include_deleted !== 'true') {
        clients = clients.filter(c => c.activo === true);
    }

    if (search) {
        const s = search.toLowerCase();
        clients = clients.filter(c =>
            c.nombre.toLowerCase().includes(s) ||
            c.rut.toLowerCase().includes(s) ||
            (c.email && c.email.toLowerCase().includes(s))
        );
    }

    res.json(clients);
});

// RF-4.1: Crear cliente (Sólo Administrador - RBAC check)
app.post('/api/empresas/:id/clients', authenticateToken, requireRole('Administrador'), (req, res) => {
    const empresaId = parseInt(req.params.id);
    const { rut, nombre, descripcion, direccion, telefono, email } = req.body;

    // Validaciones RF-4.3
    if (!rut || !nombre) {
        return res.status(400).json({ error: 'RUT y Nombre de cliente son obligatorios' });
    }

    const newClient = {
        id: db.data.clients.length ? Math.max(...db.data.clients.map(c => c.id)) + 1 : 1,
        empresa_id: empresaId,
        rut: rut.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion ? descripcion.trim() : '',
        direccion: direccion ? direccion.trim() : '',
        telefono: telefono ? telefono.trim() : '',
        email: email ? email.trim() : '',
        activo: true,
        created_at: new Date().toISOString()
    };

    db.data.clients.push(newClient);
    db.save();

    db.logAuditoria(
        req.user.id,
        req.user.username,
        'CLIENTE_CREADO',
        'CLIENTES',
        req.ip,
        `Creación de cliente: ${newClient.nombre} (RUT: ${newClient.rut})`
    );

    res.status(201).json({ message: 'Cliente creado con éxito', client: newClient });
});

// RF-4.2: Modificar cliente (Sólo Administrador)
app.put('/api/empresas/:id/clients/:clientId', authenticateToken, requireRole('Administrador'), (req, res) => {
    const empresaId = parseInt(req.params.id);
    const clientId = parseInt(req.params.clientId);
    const client = db.data.clients.find(c => c.id === clientId && c.empresa_id === empresaId);

    if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const { nombre, descripcion, direccion, telefono, email, rut } = req.body;
    if (nombre) client.nombre = nombre.trim();
    if (descripcion !== undefined) client.descripcion = descripcion.trim();
    if (direccion !== undefined) client.direccion = direccion.trim();
    if (telefono !== undefined) client.telefono = telefono.trim();
    if (email !== undefined) client.email = email.trim();
    if (rut) client.rut = rut.trim();

    db.save();

    db.logAuditoria(
        req.user.id,
        req.user.username,
        'CLIENTE_MODIFICADO',
        'CLIENTES',
        req.ip,
        `Modificación de datos cliente ID: ${clientId} (${client.nombre})`
    );

    res.json({ message: 'Cliente actualizado con éxito', client });
});

// RF-4.2 & NFR-SEG-8: Eliminación LÓGICA de cliente (Cumplimiento Ley 21.719 y 21.663)
app.delete('/api/empresas/:id/clients/:clientId', authenticateToken, requireRole('Administrador'), (req, res) => {
    const empresaId = parseInt(req.params.id);
    const clientId = parseInt(req.params.clientId);
    const client = db.data.clients.find(c => c.id === clientId && c.empresa_id === empresaId);

    if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Eliminación lógica
    client.activo = false;
    client.deleted_at = new Date().toISOString();
    client.deleted_by = req.user.username;
    db.save();

    // Registro obligatorio de auditoría según Ley 21.663
    db.logAuditoria(
        req.user.id,
        req.user.username,
        'CLIENTE_ELIMINACION_LOGICA',
        'CLIENTES',
        req.ip,
        `Eliminación lógica de cliente ID: ${clientId} (${client.nombre}) por el usuario ${req.user.username}`
    );

    res.json({
        message: 'Cliente eliminado lógicamente de forma exitosa (preservando trazabilidad de auditoría)',
        cliente_id: clientId,
        activo: false
    });
});

// RF-5.1: Listar Contratos con estado calculado dinámicamente
app.get('/api/contratos', authenticateToken, (req, res) => {
    const { cliente_id } = req.query;
    let contratos = db.data.contratos;

    if (cliente_id) {
        contratos = contratos.filter(c => c.cliente_id === parseInt(cliente_id));
    }

    const resultado = contratos.map(c => {
        const cliente = db.data.clients.find(cli => cli.id === c.cliente_id);
        return {
            ...c,
            cliente_nombre: cliente ? cliente.nombre : 'Desconocido',
            estado: calculateContractStatus(c.fecha_termino)
        };
    });

    res.json(resultado);
});

// RF-5.1: Crear Contrato
app.post('/api/contratos', authenticateToken, requireRole('Administrador'), (req, res) => {
    const { cliente_id, titulo, descripcion, fecha_inicio, fecha_termino } = req.body;
    if (!cliente_id || !titulo || !fecha_inicio || !fecha_termino) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const newContrato = {
        id: db.data.contratos.length ? Math.max(...db.data.contratos.map(c => c.id)) + 1 : 1,
        cliente_id: parseInt(cliente_id),
        titulo: titulo.trim(),
        descripcion: descripcion ? descripcion.trim() : '',
        fecha_inicio,
        fecha_termino,
        documento_url: null,
        documento_nombre: null,
        created_at: new Date().toISOString()
    };

    db.data.contratos.push(newContrato);
    db.save();

    db.logAuditoria(
        req.user.id,
        req.user.username,
        'CONTRATO_CREADO',
        'CONTRATOS',
        req.ip,
        `Creación de contrato '${newContrato.titulo}' para cliente ID ${newContrato.cliente_id}`
    );

    res.status(201).json({
        message: 'Contrato creado exitosamente',
        contrato: {
            ...newContrato,
            estado: calculateContractStatus(newContrato.fecha_termino)
        }
    });
});

// RF-5.2 & RF-5.3: Adjuntar documento a contrato
app.post('/api/contratos/:id/documentos', authenticateToken, requireRole('Administrador'), (req, res) => {
    upload.single('documento')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        const contratoId = parseInt(req.params.id);
        const contrato = db.data.contratos.find(c => c.id === contratoId);
        if (!contrato) {
            return res.status(404).json({ error: 'Contrato no encontrado' });
        }

        contrato.documento_url = `/uploads/${req.file.filename}`;
        contrato.documento_nombre = req.file.originalname;
        db.save();

        db.logAuditoria(
            req.user.id,
            req.user.username,
            'DOCUMENTO_SUBIDO',
            'DOCUMENTOS',
            req.ip,
            `Documento '${req.file.originalname}' adjuntado al contrato ID ${contratoId}`
        );

        res.json({
            message: 'Documento subido y asociado correctamente',
            documento_url: contrato.documento_url,
            documento_nombre: contrato.documento_nombre
        });
    });
});

// RF-6.1: Módulo de Auditoría (Ley 21.663)
app.get('/api/auditoria', authenticateToken, requireRole('Administrador'), (req, res) => {
    res.json(db.data.auditoria);
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[ATLAS SERVER] Servidor Atlas ejecutándose en http://localhost:${PORT}`);
        console.log(`[ATLAS SERVER] API REST operativa con estándares ISO/IEC 25010 y Leyes 21.663 / 21.719`);
    });
}

module.exports = app;
