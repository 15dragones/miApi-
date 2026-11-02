const bcrypt = require('bcryptjs');
const { scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

async function verificarPassword(password, passwordHash) {
    if (passwordHash.startsWith('$2')) {
        return bcrypt.compare(password, passwordHash);
    }

    const [salt, hashHex] = passwordHash.split(':');
    if (!salt || !/^[a-f\d]{128}$/i.test(hashHex || '')) {
        return false;
    }

    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = await scryptAsync(password, salt, expectedHash.length);
    return timingSafeEqual(expectedHash, actualHash);
}

module.exports = { hashPassword, verificarPassword };
