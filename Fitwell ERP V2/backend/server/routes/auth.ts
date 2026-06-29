import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../db";
import { adminUser, passwordResetToken } from "../../shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendMail } from "../utils/mail";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

router.get("/protected-check", adminAuth, (_req, res) => {
  res.sendStatus(200);
});

/* LOGIN */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Get all admins and find one with case-insensitive email match
    const admin = await db.query.adminUser.findFirst();
    
    if (!admin) {
      console.log("⚠️ No admin user found in database");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Case-insensitive email comparison
    const emailMatch = admin.email.toLowerCase() === email.toLowerCase().trim();
    
    if (!emailMatch) {
      console.log(`⚠️ Email mismatch - DB: "${admin.email}", Input: "${email}"`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      console.log("⚠️ Password mismatch for:", admin.email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ admin: true }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false, // ✅ MUST be false on localhost
      sameSite: "lax", // ✅ works for same-origin
      path: "/",
    });

    console.log(`✅ Successful login for: ${admin.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* LOGOUT */
router.post("/logout", (_req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  res.json({ success: true });
});

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await db.query.adminUser.findFirst();
    
    // Always return success message to prevent email enumeration
    // But only send email if admin exists with matching email (case-insensitive)
    if (!admin || admin.email.toLowerCase() !== email.toLowerCase().trim()) {
      console.log(`⚠️ Password reset requested for email that doesn't exist: ${email}`);
      return res.json({ message: "If email exists, link sent" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await db.insert(passwordResetToken).values({
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendUrl}/reset-password/${token}`;

    // Send email (will log to console regardless, and send via SMTP if configured)
    await sendMail({
      to: admin.email,
      subject: "Password Reset Request - DesignSensei",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">DesignSensei</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Password Reset Request</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">Hello,</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        You requested to reset your password for your DesignSensei account. Click the button below to reset your password:
                      </p>
                      
                      <!-- Reset Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center">
                            <a href="${link}" style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                        Or copy and paste this link into your browser:
                      </p>
                      <p style="color: #667eea; font-size: 14px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 4px; margin: 10px 0;">
                        ${link}
                      </p>
                      
                      <!-- Warning -->
                      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                        <p style="color: #856404; font-size: 14px; margin: 0; font-weight: bold;">
                          ⏰ This link will expire in 15 minutes.
                        </p>
                      </div>
                      
                      <!-- Security Notice -->
                      <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 30px 0 0 0; border-top: 1px solid #eeeeee; padding-top: 20px;">
                        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} DesignSensei. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });
    
    console.log(`✅ Password reset link generated for: ${admin.email}`);

    res.json({ message: "If email exists, link sent" });
  } catch (error) {
    console.error("❌ Error in forgot-password route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  const record = await db.query.passwordResetToken.findFirst({
    where: and(
      eq(passwordResetToken.token, token),
      eq(passwordResetToken.used, false),
      gt(passwordResetToken.expiresAt, new Date())
    ),
  });

  if (!record)
    return res.status(400).json({ message: "Invalid or expired token" });

  const hash = await bcrypt.hash(newPassword, 10);

  await db.update(adminUser).set({ passwordHash: hash });
  await db
    .update(passwordResetToken)
    .set({ used: true })
    .where(eq(passwordResetToken.id, record.id));

  // force logout everywhere
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  res.json({ success: true });
});

export default router;
