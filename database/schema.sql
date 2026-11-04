CREATE DATABASE IF NOT EXISTS bdinventario
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE bdinventario;

CREATE TABLE IF NOT EXISTS `Categorias` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `descripcion` TEXT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `categorias_nombre_unique` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Proveedores` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `razon_social` VARCHAR(180) NOT NULL,
    `contacto` VARCHAR(120) NULL,
    `telefono` VARCHAR(40) NULL,
    `email` VARCHAR(180) NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Usuarios` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(120) NOT NULL,
    `email` VARCHAR(180) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `rol` ENUM('Administrador', 'Almacenero') NOT NULL DEFAULT 'Almacenero',
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `usuarios_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Negocio` (
    `id` INT NOT NULL,
    `nombre_comercial` VARCHAR(120) NOT NULL DEFAULT 'Mi negocio',
    `ruc` VARCHAR(11) NULL,
    `direccion` VARCHAR(255) NULL,
    `telefono` VARCHAR(40) NULL,
    `email` VARCHAR(180) NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Productos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `categoria_id` INT NULL,
    `proveedor_id` INT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `productos_categoria_id_index` (`categoria_id`),
    KEY `productos_proveedor_id_index` (`proveedor_id`),
    CONSTRAINT `productos_categoria_fk`
        FOREIGN KEY (`categoria_id`) REFERENCES `Categorias` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `productos_proveedor_fk`
        FOREIGN KEY (`proveedor_id`) REFERENCES `Proveedores` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Movimientos` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `producto_id` INT NOT NULL,
    `usuario_id` INT NULL,
    `tipo_movimiento` ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
    `cantidad` INT NOT NULL,
    `fecha_hora` DATETIME NOT NULL,
    `observaciones` TEXT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    PRIMARY KEY (`id`),
    KEY `movimientos_producto_id_index` (`producto_id`),
    KEY `movimientos_usuario_id_index` (`usuario_id`),
    CONSTRAINT `movimientos_producto_fk`
        FOREIGN KEY (`producto_id`) REFERENCES `Productos` (`id`)
        ON UPDATE CASCADE,
    CONSTRAINT `movimientos_usuario_fk`
        FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`id`)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
