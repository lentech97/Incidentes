function createUserModel(database) {
    return {
        async findByUsername(username) {
            const { rows } = await database.query(
                `SELECT id, username, password_hash AS "passwordHash", role
                 FROM usuarios WHERE username = $1`,
                [username],
            );
            return rows[0];
        },
        async createIfMissing(username, passwordHash, role) {
            await database.query(
                `INSERT INTO usuarios (username, password_hash, role)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (username) DO NOTHING`,
                [username, passwordHash, role],
            );
        },
    };
}

module.exports = { createUserModel };
