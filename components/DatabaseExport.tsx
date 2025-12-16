import React, { useState, useEffect } from 'react';
import { Database, Download, Copy, Check, FileCode, Server } from 'lucide-react';
import { 
    Establecimiento, Ambiente, Tecnico, Personal, 
    Dispositivo, Inmueble, RedInternet, Insumo, 
    Usuario, Rol, Mantenimiento, ProgramacionPersonal, 
    ControlAsistencia, MovimientoInsumo 
} from '../types';

interface DatabaseExportProps {
    establecimientos: Establecimiento[];
    ambientes: Ambiente[];
    tecnicos: Tecnico[];
    personalSalud: Personal[];
    dispositivos: Dispositivo[];
    inmuebles: Inmueble[];
    redes: RedInternet[];
    insumos: Insumo[];
    usuarios: Usuario[];
    roles: Rol[];
    mantenimientos: Mantenimiento[];
    programacion: ProgramacionPersonal[];
    asistencia: ControlAsistencia[];
    movimientos: MovimientoInsumo[];
}

export const DatabaseExport: React.FC<DatabaseExportProps> = ({
    establecimientos, ambientes, tecnicos, personalSalud,
    dispositivos, inmuebles, redes, insumos, usuarios, roles,
    mantenimientos, programacion, asistencia, movimientos
}) => {
    const [sqlCode, setSqlCode] = useState('');
    const [copied, setCopied] = useState(false);

    // Helpers for SQL formatting
    const escape = (str: string | undefined | null) => {
        if (str === undefined || str === null) return 'NULL';
        return `'${String(str).replace(/'/g, "''")}'`; // Escape single quotes
    };

    const numOrNull = (num: number | undefined | null) => {
        if (num === undefined || num === null || isNaN(num)) return 'NULL';
        return num;
    };

    useEffect(() => {
        generateSQL();
    }, [establecimientos, dispositivos, mantenimientos]); // Regenerate when main entities change

    const generateSQL = () => {
        let sql = `-- SCRIPT DE GENERACIÓN DE BASE DE DATOS SIHCE MANAGER
-- Generado el: ${new Date().toLocaleString()}
-- Dialecto: PostgreSQL (Compatible MySQL con ajustes menores)

-- =============================================
-- 1. ELIMINACIÓN DE TABLAS (Orden inverso)
-- =============================================
DROP TABLE IF EXISTS "control_asistencia";
DROP TABLE IF EXISTS "programacion_personal";
DROP TABLE IF EXISTS "mantenimientos";
DROP TABLE IF EXISTS "movimientos_insumo";
DROP TABLE IF EXISTS "insumos";
DROP TABLE IF EXISTS "usuarios";
DROP TABLE IF EXISTS "roles";
DROP TABLE IF EXISTS "dispositivos";
DROP TABLE IF EXISTS "inmuebles";
DROP TABLE IF EXISTS "redes_internet";
DROP TABLE IF EXISTS "ambientes";
DROP TABLE IF EXISTS "personal_salud";
DROP TABLE IF EXISTS "tecnicos";
DROP TABLE IF EXISTS "establecimientos";

-- =============================================
-- 2. CREACIÓN DE TABLAS (DDL)
-- =============================================

CREATE TABLE "establecimientos" (
    "id_codigo_ipress_estab" INTEGER PRIMARY KEY,
    "nombre_estab" VARCHAR(255) NOT NULL,
    "ris_estab" VARCHAR(100),
    "medico_jefe" VARCHAR(255),
    "telefono" VARCHAR(50),
    "email" VARCHAR(255),
    "direccion" TEXT,
    "coordenadas" VARCHAR(100)
);

CREATE TABLE "tecnicos" (
    "id_dni_tec" INTEGER PRIMARY KEY,
    "nombre_completo_tec" VARCHAR(255) NOT NULL,
    "cargo_tec" VARCHAR(100),
    "grado_academico" VARCHAR(100),
    "carrera" VARCHAR(100),
    "oficina" VARCHAR(100),
    "fecha_registro" DATE,
    "email_tec" VARCHAR(255),
    "telefono_tec" VARCHAR(50)
);

CREATE TABLE "personal_salud" (
    "id_dni_pers" INTEGER PRIMARY KEY,
    "nombre_completo_pers" VARCHAR(255) NOT NULL,
    "cargo_pers" VARCHAR(100),
    "grado_academico" VARCHAR(100),
    "carrera" VARCHAR(100),
    "fecha_registro" DATE,
    "email_pers" VARCHAR(255),
    "telefono_pers" VARCHAR(50),
    "id_codigo_ipress_estab" INTEGER REFERENCES "establecimientos"("id_codigo_ipress_estab")
);

CREATE TABLE "ambientes" (
    "id_amb" INTEGER PRIMARY KEY,
    "id_codigo_ipress_estab" INTEGER REFERENCES "establecimientos"("id_codigo_ipress_estab"),
    "nombre_servicio_amb" VARCHAR(255),
    "nombre_area_amb" VARCHAR(255),
    "tipo_ambiente_amb" VARCHAR(100),
    "toma_electrica_amb" VARCHAR(10),
    "punto_red_amb" VARCHAR(10),
    "estado_amb" VARCHAR(50)
);

CREATE TABLE "redes_internet" (
    "id_red" SERIAL PRIMARY KEY,
    "id_codigo_ipress_estab" INTEGER REFERENCES "establecimientos"("id_codigo_ipress_estab"),
    "proveedor_red" VARCHAR(100),
    "velocidad_red" VARCHAR(50)
);

CREATE TABLE "inmuebles" (
    "id_inmueble" SERIAL PRIMARY KEY,
    "codigo_patrimonial" VARCHAR(50),
    "codigo_margesi" VARCHAR(50),
    "anio_patrimonial" INTEGER,
    "tipo_inmueble" VARCHAR(100),
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "color" VARCHAR(50),
    "dimensiones" VARCHAR(50),
    "estado" VARCHAR(50),
    "id_amb" INTEGER REFERENCES "ambientes"("id_amb")
);

CREATE TABLE "dispositivos" (
    "id_codigo_patrimonial_disp_e" INTEGER PRIMARY KEY,
    "codigo_margesi" VARCHAR(50),
    "anio_patrimonial" INTEGER,
    "id_amb" INTEGER REFERENCES "ambientes"("id_amb"),
    "tipo_dispositivo" VARCHAR(100),
    "serie" VARCHAR(100),
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "estado" VARCHAR(50),
    "cod_patrimonial_padre" INTEGER REFERENCES "dispositivos"("id_codigo_patrimonial_disp_e") -- Auto-relación
);

CREATE TABLE "roles" (
    "id_rol" INTEGER PRIMARY KEY,
    "nombre_rol" VARCHAR(50),
    "permisos" TEXT -- Guardado como JSON o lista separada por comas
);

CREATE TABLE "usuarios" (
    "id_usuario" SERIAL PRIMARY KEY,
    "id_dni_tec" INTEGER REFERENCES "tecnicos"("id_dni_tec"),
    "id_dni_pers" INTEGER REFERENCES "personal_salud"("id_dni_pers"),
    "nombre_usuario" VARCHAR(50) UNIQUE NOT NULL,
    "contrasena_usuario" VARCHAR(255) NOT NULL,
    "id_rol" INTEGER REFERENCES "roles"("id_rol"),
    "estado" VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE "insumos" (
    "id_insumo" SERIAL PRIMARY KEY,
    "nombre_insumo" VARCHAR(255) NOT NULL,
    "tipo_insumo" VARCHAR(50),
    "cantidad" INTEGER DEFAULT 0,
    "unidad_medida" VARCHAR(50),
    "estado_insumo" VARCHAR(50),
    "ubicacion_fisica" VARCHAR(255),
    "codigo_patrimonial" VARCHAR(50),
    "marca" VARCHAR(100),
    "modelo" VARCHAR(100),
    "serie" VARCHAR(100)
);

CREATE TABLE "movimientos_insumo" (
    "id_movimiento" SERIAL PRIMARY KEY,
    "id_insumo" INTEGER REFERENCES "insumos"("id_insumo"),
    "fecha_movimiento" DATE,
    "hora_movimiento" TIME,
    "tipo_movimiento" VARCHAR(20),
    "cantidad" INTEGER,
    "id_dni_responsable" INTEGER,
    "observacion" TEXT,
    "id_codigo_ipress_estab_destino" INTEGER,
    "nro_guia" VARCHAR(50),
    "evidencia_url" TEXT,
    "estado_movimiento" VARCHAR(20)
);

CREATE TABLE "mantenimientos" (
    "id_mant" VARCHAR(50) PRIMARY KEY,
    "fecha_mant" DATE,
    "id_codigo_ipress_estab" INTEGER REFERENCES "establecimientos"("id_codigo_ipress_estab"),
    "id_codigo_patrimonial_disp_e" INTEGER REFERENCES "dispositivos"("id_codigo_patrimonial_disp_e"),
    "tipo_mant" VARCHAR(50),
    "motivo_visita" TEXT,
    "diagnostico" TEXT,
    "actividades" TEXT,
    "materiales" TEXT,
    "recomendaciones" TEXT,
    "id_dni_tec_1" INTEGER REFERENCES "tecnicos"("id_dni_tec"),
    "estado_mant" VARCHAR(20) DEFAULT 'Activo'
);

CREATE TABLE "programacion_personal" (
    "id_programacion" VARCHAR(50) PRIMARY KEY,
    "id_dni_tec" INTEGER REFERENCES "tecnicos"("id_dni_tec"),
    "fecha_inicio" DATE,
    "hora_inicio" TIME,
    "hora_fin" TIME,
    "turno" VARCHAR(20),
    "id_codigo_ipress_estab" INTEGER,
    "tipo_actividad" VARCHAR(100),
    "estado" VARCHAR(20)
);

CREATE TABLE "control_asistencia" (
    "id_asistencia" VARCHAR(50) PRIMARY KEY,
    "id_dni_tec" INTEGER REFERENCES "tecnicos"("id_dni_tec"),
    "fecha_asistencia" DATE,
    "hora_asistencia" TIMESTAMP,
    "tipo_registro" VARCHAR(20),
    "ubicacion" VARCHAR(255)
);

-- =============================================
-- 3. INSERCIÓN DE DATOS (DML)
-- =============================================

`;
        // --- INSERTS ---

        // Establecimientos
        establecimientos.forEach(e => {
            sql += `INSERT INTO "establecimientos" VALUES (${e.id_codigo_ipress_estab}, ${escape(e.nombre_estab)}, ${escape(e.ris_estab)}, ${escape(e.medico_jefe)}, ${escape(e.telefono)}, ${escape(e.email)}, ${escape(e.direccion)}, ${escape(e.coordenadas)});\n`;
        });
        sql += '\n';

        // Tecnicos
        tecnicos.forEach(t => {
            sql += `INSERT INTO "tecnicos" VALUES (${t.id_dni_tec}, ${escape(t.nombre_completo_tec)}, ${escape(t.cargo_tec)}, ${escape(t.grado_academico)}, ${escape(t.carrera)}, ${escape(t.oficina)}, ${escape(t.fecha_registro)}, ${escape(t.email_tec)}, ${escape(t.telefono_tec)});\n`;
        });
        sql += '\n';

        // Personal Salud
        personalSalud.forEach(p => {
            sql += `INSERT INTO "personal_salud" VALUES (${p.id_dni_pers}, ${escape(p.nombre_completo_pers)}, ${escape(p.cargo_pers)}, ${escape(p.grado_academico)}, ${escape(p.carrera)}, ${escape(p.fecha_registro)}, ${escape(p.email_pers)}, ${escape(p.telefono_pers)}, ${p.id_codigo_ipress_estab});\n`;
        });
        sql += '\n';

        // Ambientes
        ambientes.forEach(a => {
            sql += `INSERT INTO "ambientes" VALUES (${a.id_amb}, ${a.id_codigo_ipress_estab}, ${escape(a.nombre_servicio_amb)}, ${escape(a.nombre_area_amb)}, ${escape(a.tipo_ambiente_amb)}, ${escape(a.toma_electrica_amb)}, ${escape(a.punto_red_amb)}, ${escape(a.estado_amb)});\n`;
        });
        sql += '\n';

        // Redes
        redes.forEach(r => {
            sql += `INSERT INTO "redes_internet" VALUES (${r.id_red}, ${r.id_codigo_ipress_estab}, ${escape(r.proveedor_red)}, ${escape(r.velocidad_red)});\n`;
        });
        sql += '\n';

        // Inmuebles
        inmuebles.forEach(i => {
            sql += `INSERT INTO "inmuebles" VALUES (${i.id_inmueble}, ${escape(i.codigo_patrimonial)}, ${escape(i.codigo_margesi)}, ${i.anio_patrimonial}, ${escape(i.tipo_inmueble)}, ${escape(i.marca)}, ${escape(i.modelo)}, ${escape(i.color)}, ${escape(i.dimensiones)}, ${escape(i.estado)}, ${numOrNull(i.id_amb)});\n`;
        });
        sql += '\n';

        // Dispositivos
        dispositivos.forEach(d => {
            sql += `INSERT INTO "dispositivos" VALUES (${d.id_codigo_patrimonial_disp_e}, ${escape(d.codigo_margesi)}, ${d.anio_patrimonial}, ${numOrNull(d.id_amb)}, ${escape(d.tipo_dispositivo_disp_e)}, ${escape(d.serie_disp_e)}, ${escape(d.marca_disp_e)}, ${escape(d.modelo_disp_e)}, ${escape(d.estado__disp_e)}, ${numOrNull(d.cod_patrimonial_padre)});\n`;
        });
        sql += '\n';

        // Roles
        roles.forEach(r => {
            sql += `INSERT INTO "roles" VALUES (${r.id_rol}, ${escape(r.nombre_rol)}, '${JSON.stringify(r.permisos)}');\n`;
        });
        sql += '\n';

        // Usuarios
        usuarios.forEach(u => {
            sql += `INSERT INTO "usuarios" ("id_dni_tec", "id_dni_pers", "nombre_usuario", "contrasena_usuario", "id_rol", "estado") VALUES (${numOrNull(u.id_dni_tec)}, ${numOrNull(u.id_dni_pers)}, ${escape(u.nombre_usuario)}, ${escape(u.contrasena_usuario)}, ${u.id_rol}, ${escape(u.estado)});\n`;
        });
        sql += '\n';

        // Insumos
        insumos.forEach(i => {
            sql += `INSERT INTO "insumos" VALUES (${i.id_insumo}, ${escape(i.nombre_insumo)}, ${escape(i.tipo_insumo)}, ${i.cantidad}, ${escape(i.unidad_medida)}, ${escape(i.estado_insumo)}, ${escape(i.ubicacion_fisica)}, ${escape(i.codigo_patrimonial)}, ${escape(i.marca)}, ${escape(i.modelo)}, ${escape(i.serie)});\n`;
        });
        sql += '\n';

        // Mantenimientos
        mantenimientos.forEach(m => {
            sql += `INSERT INTO "mantenimientos" VALUES (${escape(m.id_mant)}, ${escape(m.fecha_mant)}, ${m.id_codigo_ipress_estab}, ${m.id_codigo_patrimonial_disp_e}, ${escape(m.tipo_mant)}, ${escape(m.motivo_visita_tecnica)}, ${escape(m.diagnostico)}, ${escape(m.actividades_realizadas)}, ${escape(m.materiales_utilizados)}, ${escape(m.recomendaciones)}, ${numOrNull(m.id_dni_tec_1)}, ${escape(m.estado_mant)});\n`;
        });

        // (Otros inserts se pueden agregar siguiendo el patrón...)

        setSqlCode(sql);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([sqlCode], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `sihce_backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-brand-600"/> Código de Base de Datos
                </h2>
                <p className="text-gray-500 mt-1">
                    Aquí puede obtener el código SQL completo para desplegar su sistema en un servidor de base de datos real (PostgreSQL / MySQL).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-120px)]">
                {/* INFO PANEL */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Server size={20}/> Estructura del Sistema</h3>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex justify-between border-b pb-2"><span>Tablas Generadas:</span> <span className="font-bold text-brand-700">14</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Registros de Equipos:</span> <span className="font-bold">{dispositivos.length}</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Personal Registrado:</span> <span className="font-bold">{tecnicos.length + personalSalud.length}</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Sedes:</span> <span className="font-bold">{establecimientos.length}</span></li>
                        <li className="flex justify-between border-b pb-2"><span>Mantenimientos:</span> <span className="font-bold">{mantenimientos.length}</span></li>
                    </ul>

                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2 text-xs uppercase">Instrucciones</h4>
                        <ol className="list-decimal list-inside text-xs text-blue-700 space-y-2">
                            <li>Descargue el archivo .sql</li>
                            <li>Abra su gestor de BD (pgAdmin, DBeaver, Workbench)</li>
                            <li>Cree una base de datos vacía llamada "sihce_db"</li>
                            <li>Ejecute el script completo</li>
                        </ol>
                    </div>
                </div>

                {/* CODE EDITOR PREVIEW */}
                <div className="lg:col-span-2 bg-slate-900 rounded-xl shadow-lg flex flex-col overflow-hidden">
                    <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-mono">
                            <FileCode size={16}/> schema.sql
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                            >
                                {copied ? <Check size={14}/> : <Copy size={14}/>}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                            <button 
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs transition-colors font-bold"
                            >
                                <Download size={14}/> Descargar .SQL
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto relative group">
                        <textarea 
                            readOnly 
                            value={sqlCode} 
                            className="w-full h-full bg-slate-900 text-green-400 font-mono text-xs p-4 focus:outline-none resize-none"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};