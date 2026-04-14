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
    let userId, email;
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        log('Body is string but not JSON, using as is');
      }
    }

    if (req.headers['x-appwrite-event']) {
      userId = body.$id;
      email = body.email;
    } else {
      userId = body.userId;
      if (!userId) {
        return res.json({ success: false, message: 'Missing userId' }, 400);
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

    log(`Attempting to send email via SMTP...`);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"Lost & Found" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>Verify your account</h2>
          <p>Hello,</p>
          <p>Your 6-digit verification code for Lost & Found App is:</p>
          <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; border-radius: 8px;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    log(`OTP email sent successfully! MessageId: ${info.messageId}`);

    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err) {
    error(`Unhandled error: ${err.message}`);
    return res.json({ success: false, message: err.message }, 500);
  }
};
