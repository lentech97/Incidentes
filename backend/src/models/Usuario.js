function createUserModel(database) {
    return {
        findByUsername(username) {
            return database.prepare(`
                SELECT id, username, password_hash AS passwordHash, role
                FROM usuarios WHERE username = ?
            `).get(username);
        },
        createIfMissing(username, passwordHash, role) {
            database.prepare(`
                INSERT OR IGNORE INTO usuarios (username, password_hash, role)
                VALUES (?, ?, ?)
            `).run(username, passwordHash, role);
        },
    };
}

module.exports = { createUserModel };
