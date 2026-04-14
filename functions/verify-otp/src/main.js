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

    // Robust body parsing
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        log('Body is string but not JSON, using as is');
      }
    }

    const { userId, code } = body;

    if (!userId || !code) {
      return res.json({ success: false, message: 'Missing userId or code' }, 400);
    }

    log(`Verifying OTP for user: ${userId}`);

    // 1. Find the code in the database
    const response = await databases.listDocuments(databaseId, otpCollectionId, [
      Query.equal('userId', userId),
      Query.equal('code', code),
    ]);

    if (response.total === 0) {
      return res.json({ success: false, message: 'Invalid verification code' }, 400);
    }

    const otpDoc = response.documents[0];

    // 2. Check if expired
    if (new Date(otpDoc.expiresAt) < new Date()) {
      await databases.deleteDocument(databaseId, otpCollectionId, otpDoc.$id);
      return res.json({ success: false, message: 'Code has expired. Please request a new one.' }, 400);
    }

    // 3. Success! Mark user as verified
    await users.updateEmailVerification(userId, true);

    // 4. Delete the used code
    await databases.deleteDocument(databaseId, otpCollectionId, otpDoc.$id);

    return res.json({ success: true, message: 'Email verified successfully!' });

  } catch (err) {
    error(err.message);
    return res.json({ success: false, message: err.message }, 500);
  }
};
