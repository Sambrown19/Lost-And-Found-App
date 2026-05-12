import { Client, Databases, Users, ID, Query } from 'node-appwrite';
import nodemailer from 'nodemailer';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);

  const databaseId = process.env.DATABASE_ID;
  const otpCollectionId = process.env.OTP_COLLECTION_ID;

  log(`Project: ${process.env.APPWRITE_FUNCTION_PROJECT_ID}`);
  log(`Database: ${databaseId}`);
  log(`Collection: ${otpCollectionId}`);

  try {
    let userId, email, isPasswordReset = false;
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        log('Body is string but not JSON, using as is');
      }
    }

    if (req.headers['x-appwrite-event']) {
      // Triggered by Appwrite event (e.g. user.create)
      userId = body.$id;
      email = body.email;
    } else if (body.email && !body.userId) {
      // Password reset flow: caller sends { email } without userId
      isPasswordReset = true;
      email = body.email;
      log(`Password reset: looking up user by email: ${email}`);
      try {
        const result = await users.list([Query.equal('email', email)]);
        if (result.total === 0) {
          // Avoid email enumeration — always return success
          return res.json({ success: true, message: 'OTP sent if account exists' });
        }
        userId = result.users[0].$id;
      } catch (lookupErr) {
        error(`User lookup failed: ${lookupErr.message}`);
        return res.json({ success: false, message: 'Failed to look up user' }, 500);
      }
    } else {
      // Standard flow: userId provided directly
      userId = body.userId;
      if (!userId) {
        return res.json({ success: false, message: 'Missing userId or email' }, 400);
      }
      const user = await users.get(userId);
      email = user.email;
    }

    if (!email) {
      return res.json({ success: false, message: 'User email not found' }, 400);
    }

    log(`Sending OTP to userId=${userId}, email=${email}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Clean old OTPs for this user
    try {
      const oldCodes = await databases.listDocuments(databaseId, otpCollectionId, [
        Query.equal('userId', userId),
      ]);
      for (const doc of oldCodes.documents) {
        await databases.deleteDocument(databaseId, otpCollectionId, doc.$id);
      }
    } catch (cleanupErr) {
      log(`Warning: Could not clean old OTPs: ${cleanupErr.message}`);
    }

    // Save new OTP
    try {
      await databases.createDocument(databaseId, otpCollectionId, ID.unique(), {
        userId,
        code: otp,
        expiresAt,
      });
      log('OTP saved to database successfully');
    } catch (dbErr) {
      error(`DB write failed: ${dbErr.message}`);
      return res.json({ success: false, message: `Database error: ${dbErr.message}` }, 500);
    }

    // Send email
    log(`Attempting to send email via SMTP...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const subject = isPasswordReset ? 'Password Reset Code' : 'Your Verification Code';
    const heading = isPasswordReset ? 'Reset your password' : 'Verify your account';
    const codeLabel = isPasswordReset ? 'password reset' : 'verification';

    const mailOptions = {
      from: `"Lost & Found" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>${heading}</h2>
          <p>Hello,</p>
          <p>Your 6-digit ${codeLabel} code for Lost &amp; Found App is:</p>
          <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    log(`OTP email sent successfully! MessageId: ${info.messageId}`);

    // Return userId so the client can use it in the next step
    return res.json({ success: true, message: 'OTP sent successfully', userId });
  } catch (err) {
    error(`Unhandled error: ${err.message}`);
    return res.json({ success: false, message: err.message }, 500);
  }
};
