-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    telefono VARCHAR(20),
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de links
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    link TEXT NOT NULL,
    numeros JSONB NOT NULL, -- Almacena los números como un array de JSON
    mensaje TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de planes
CREATE TABLE planes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio NUMERIC(10, 2) NOT NULL,
    descripcion TEXT,
    max_numeros INT NOT NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de pagos
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    plan_id INT REFERENCES planes(id) ON DELETE SET NULL,
    estado VARCHAR(50) NOT NULL, -- Ejemplo: 'pendiente', 'completado'
    referencia_pago TEXT, -- ID de Mercado Pago u otro proveedor
    creado_en TIMESTAMP DEFAULT NOW()
);
