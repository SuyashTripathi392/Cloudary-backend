import express from 'express';
import { 
  signup, 
  login, 
  logout, 
  sendResetOtp, 
  resetPassword, 
  getUserData
} from '../controllers/authController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const authRoutes = express.Router();

// Auth routes
authRoutes.post('/signup', signup);
authRoutes.post('/login', login);
authRoutes.post('/logout', logout);

// Protected route - current user data
authRoutes.get('/me', verifyToken, getUserData);

// Password reset routes
authRoutes.post('/send-reset-otp', sendResetOtp);
authRoutes.post('/reset-password', resetPassword);

export default authRoutes;
