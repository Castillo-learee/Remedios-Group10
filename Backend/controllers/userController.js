import * as userService from '../services/userService.js';

// ── PUBLIC: customer registration ─────────────────────────────────────────────
// Role is always forced to 'customer' inside the service.
// The request body must NOT send a role field — it is ignored either way.
export const createAccount = async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const data = { firstName, lastName, username, email, password };

    try {
        const result = await userService.createAccount(data);
        res.status(201).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// ── PRIVATE: admin account creation ──────────────────────────────────────────
// This endpoint is NOT linked from the public UI.
// Access it directly (e.g. via Postman or a private setup script).
export const createAdminAccount = async (req, res) => {
    const { firstName, lastName, username, email, password } = req.body;
    const data = { firstName, lastName, username, email, password };

    try {
        const result = await userService.createAdminAccount(data);
        res.status(201).json({
            success: true,
            message: result
        });
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}

// ── login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    const { email, password } = req.body;
    const data = { email, password };

    try {
        const result = await userService.login(data);
        // result = { token, user } — returned flat so the frontend can read directly
        res.status(200).json(result);
    } catch (e) {
        console.log(e);
        res.status(e.statusCode || 500).json({
            error: `${e.message || 'Internal Server Error'}`
        });
    }
}
