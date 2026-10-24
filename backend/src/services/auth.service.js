const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-real-password', 10);

function createAuthService(userModel, { jwtSecret, expiresIn }) {
    return {
        async login(username, password) {
            const user = userModel.findByUsername(username);
            const passwordMatches = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_PASSWORD_HASH);
            if (!user || !passwordMatches) {
                return undefined;
            }
            const token = jwt.sign(
                { sub: String(user.id), role: user.role, username: user.username },
                jwtSecret,
                { algorithm: 'HS256', expiresIn },
            );
            return { token, user: { username: user.username, role: user.role } };
        },
    };
}

module.exports = { createAuthService };
