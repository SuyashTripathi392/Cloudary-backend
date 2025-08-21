import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabaseClient.js';
import transporter from '../config/nodemailer.js';
import { SIGNUP_WELCOME_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailtemplates.js';
// ✅ Signup
export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing details" });
  }

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (existingUser.length > 0) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB
    const { error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }]);

    if (error) throw error;

    // Send welcome email
     const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Welcome to the App',
      // text: `Welcome ${name}! Your account has been created successfully.`,
      html: SIGNUP_WELCOME_TEMPLATE(name),
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "Signup successful" });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};


// ✅ Login (fixed)
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Email and password are required" });
  }

  try {
    // Fetch user
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    const user = users[0];
    if (!user) return res.json({ success: false, message: "Invalid email" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: "Invalid password" });

    // Create JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // prod me true karna
      sameSite: 'none',
      domain: '.onrender.com',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // ✅ Send user data also
    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};


// ✅ Logout
export const logout = async (req, res) => {
  res.clearCookie('token', {
  httpOnly: true,
  secure: true,   // production ke liye ✅
  sameSite: 'none' // cross-site cookie ke liye ✅
});

  return res.json({ success: true, message: "Logout successful" });
};

// ✅ Send Reset OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    const user = users[0];
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    await supabase
      .from('users')
      .update({ resetOtp: otp, resetOtpExpire: Date.now() + 15 * 60 * 1000 })
      .eq('id', user.id);

    // Send reset email with template
    const html = PASSWORD_RESET_TEMPLATE
      .replace('{{email}}', email)
      .replace('{{otp}}', otp);

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: 'Password Reset OTP',
      html
    };
    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: "OTP sent to email" });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: "Missing details" });
  }

  try {
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    const user = users[0];
    if (!user) return res.json({ success: false, message: "User not found" });

    if (user.resetOtp !== otp) {
      return res.json({ success: false, message: "Invalid OTP" });
    }
    if (user.resetOtpExpire < Date.now()) {
      return res.json({ success: false, message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await supabase
      .from('users')
      .update({ password: hashedPassword, resetOtp: null, resetOtpExpire: null })
      .eq('id', user.id);

    return res.json({ success: true, message: "Password reset successful" });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};


// ✅ Get Current User 
export const getUserData = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: users } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId);

    if (!users || users.length === 0) {
      return res.json({ success: false, message: "User not found" });
    }

    // ✅ Rename `userData` → `user` for frontend match
    return res.json({ success: true, user: users[0] });

  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
};

