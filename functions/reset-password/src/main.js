import { Client, Databases, Users, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const users = new Users(client);

  const databaseId = process.env.DATABASE_ID;
  const otpCollectionId = process.env.OTP_COLLECTION_ID;

  try {
    let body = req.body;

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        log('Body is string but not JSON');
      }
    }

    const { userId, code, newPassword } = body;

    if (!userId || !code || !newPassword) {
      return res.json({ success: false, message: 'Missing userId, code, or newPassword' }, 400);
    }

    if (newPassword.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters' }, 400);
    }

    log(`Verifying OTP for password reset: userId=${userId}`);

    // 1. Find the OTP
    const response = await databases.listDocuments(databaseId, otpCollectionId, [
      Query.equal('userId', userId),
      Query.equal('code', code),
    ]);

    if (response.total === 0) {
      return res.json({ success: false, message: 'Invalid verification code' }, 400);
    }

    const otpDoc = response.documents[0];

    // 2. Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
      await databases.deleteDocument(databaseId, otpCollectionId, otpDoc.$id);
      return res.json({ success: false, message: 'Code has expired. Please request a new one.' }, 400);
    }

    // 3. Update the password using admin SDK
    await users.updatePassword(userId, newPassword);
    log(`Password updated successfully for userId=${userId}`);

    // 4. Delete the used OTP
    await databases.deleteDocument(databaseId, otpCollectionId, otpDoc.$id);

    return res.json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    error(`Unhandled error: ${err.message}`);
    return res.json({ success: false, message: err.message }, 500);
  }
};
