import * as userController from '../controllers/userController.js';
import express from 'express';

const userRoute = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
userRoute.post('/register', userController.createAccount);   // customer only
userRoute.post('/login',    userController.login);

// ── Private admin creation ────────────────────────────────────────────────────
// Not linked in the public UI. Use Postman or a setup script to call this.
// POST /user/admin/create  { firstName, lastName, username, email, password }
userRoute.post('/admin/create', userController.createAdminAccount);

export default userRoute;
