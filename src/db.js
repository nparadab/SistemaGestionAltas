const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data.json');

const initialData = () => {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync("Pass1234!#2026", salt);
    const editorPasswordHash = bcrypt.hashSync("Pass1234!#2026", salt);

    return {
        users: [
            {
                id: 1,
                username: "admin_test",
                email: "admin@crealab.cl",
                password_hash: adminPasswordHash,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                username: "editor_test",
                email: "editor@crealab.cl",
                password_hash: editorPasswordHash,
                created_at: new Date().toISOString()
            }
        ],
        empresas: [
            {
                id: 1,
                nombre: "CreaLab SpA",
                direccion: "Av. Providencia 1208, Oficina 502, Santiago",
                telefono: "+56987654321",
                correo: "contacto@crealab.cl",
                created_at: new Date().toISOString()
            }
        ],
        empresa_usuarios: [
            {
                id: 1,
                empresa_id: 1,
                user_id: 1,
                role: "Administrador"
            },
            {
                id: 2,
                empresa_id: 1,
                user_id: 2,
                role: "Editor"
            }
        ],
        clients: [
            {
                id: 1,
                empresa_id: 1,
                rut: "76.432.198-5",
                nombre: "Servicios Tecnológicos Austral SpA",
                descripcion: "Pyme dedicada al desarrollo de software logístico",
                direccion: "Calle Prat 450, Concepción",
                telefono: "+56412987654",
                email: "contacto@australtech.cl",
                activo: true,
                created_at: "2026-01-15T10:00:00Z"
            },
            {
                id: 2,
                empresa_id: 1,
                rut: "77.102.340-K",
                nombre: "Distribuidora Norte Ltda",
                descripcion: "Distribución mayorista de insumos comerciales",
                direccion: "Av. Brasil 890, Antofagasta",
                telefono: "+56552345678",
                email: "ventas@norteltda.cl",
                activo: true,
                created_at: "2026-02-10T11:30:00Z"
            },
            {
                id: 3,
                empresa_id: 1,
                rut: "78.990.123-1",
                nombre: "Transportes Valparaíso S.A.",
                descripcion: "Servicios de transporte y logística regional",
                direccion: "Blanco 120, Valparaíso",
                telefono: "+56322887766",
                email: "operaciones@transvalpo.cl",
                activo: true,
                created_at: "2026-03-01T09:15:00Z"
            }
        ],
        contratos: [
            {
                id: 1,
                cliente_id: 1,
                titulo: "Contrato de Mantenimiento Plataforma Atlas 2026",
                descripcion: "Soporte correctivo y preventivo mensual",
                fecha_inicio: "2026-01-01",
                fecha_termino: "2026-12-31",
                documento_url: "/uploads/contrato_austral_2026.pdf",
                documento_nombre: "contrato_austral_2026.pdf",
                created_at: "2026-01-02T12:00:00Z"
            },
            {
                id: 2,
                cliente_id: 2,
                titulo: "Acuerdo de Confidencialidad y SLA",
                descripcion: "Acuerdo NDA y nivel de servicio técnico 99.5%",
                fecha_inicio: "2026-02-01",
                fecha_termino: "2026-04-30",
                documento_url: "/uploads/nda_norteltda.pdf",
                documento_nombre: "nda_norteltda.pdf",
                created_at: "2026-02-01T14:20:00Z"
            }
        ],
        auditoria: [
            {
                id: 1,
                fecha: new Date(Date.now() - 3600000).toISOString(),
                user_id: 1,
                username: "admin_test",
                accion: "LOGIN_EXITOSO",
                recurso: "AUTH",
                ip: "127.0.0.1",
                detalles: "Inicio de sesión seguro mediante credenciales bcrypt y emisión de JWT"
            },
            {
                id: 2,
                fecha: new Date(Date.now() - 1800000).toISOString(),
                user_id: 1,
                username: "admin_test",
                accion: "CLIENTE_CREADO",
                recurso: "CLIENTES",
                ip: "127.0.0.1",
                detalles: "Creación de cliente inicial Servicios Tecnológicos Austral SpA (RUT 76.432.198-5)"
            }
        ],
        revoked_tokens: []
    };
};

class DB {
    constructor() {
        this.load();
    }

    load() {
        if (!fs.existsSync(DB_PATH)) {
            this.data = initialData();
            this.save();
        } else {
            try {
                this.data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
            } catch (err) {
                console.error("Error al leer DB, reiniciando:", err);
                this.data = initialData();
                this.save();
            }
        }
    }

    save() {
        fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    }

    reset() {
        this.data = initialData();
        this.save();
    }

    logAuditoria(userId, username, accion, recurso, ip, detalles) {
        const logEntry = {
            id: (this.data.auditoria.length ? Math.max(...this.data.auditoria.map(a => a.id)) + 1 : 1),
            fecha: new Date().toISOString(),
            user_id: userId || null,
            username: username || 'ANONIMO',
            accion,
            recurso,
            ip: ip || '127.0.0.1',
            detalles
        };
        this.data.auditoria.unshift(logEntry);
        this.save();
        return logEntry;
    }
}

module.exports = new DB();
