import nodemailer from "nodemailer";

// Check if SMTP is configured
const isSmtpConfigured = 
  process.env.SMTP_HOST && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASS;

// Only create transporter if SMTP is configured
export const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export const sendMail = async (options: {
  to: string;
  subject: string;
  html: string;
}) => {
  // Always log to console for debugging (both in dev and production)
  console.log("\n📧 ===== PASSWORD RESET EMAIL =====");
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Body:\n${options.html.replace(/<[^>]*>/g, '').replace(/\n\s+/g, '\n')}`);
  console.log("=====================================\n");

  // Try to send email if SMTP is configured
  if (isSmtpConfigured && transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"DesignSensei Admin" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`✅ Email sent successfully to ${options.to}`);
      console.log(`   Message ID: ${info.messageId}\n`);
      return info;
    } catch (error: any) {
      console.error("❌ Failed to send email via SMTP:", error.message);
      console.error("   Falling back to console output only.\n");
      // Don't throw - we've logged it to console, that's enough
      return Promise.resolve({ messageId: "console-fallback" });
    }
  } else {
    console.log("⚠️  SMTP not configured - email logged to console only");
    console.log("   To send real emails, configure SMTP_HOST, SMTP_USER, and SMTP_PASS\n");
    return Promise.resolve({ messageId: "console-only" });
  }
};