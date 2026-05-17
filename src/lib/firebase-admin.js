import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'incubator-2977e'
    });
    console.log('✅ Firebase Admin Initialized');
  } catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error.message);
  }
}

export default admin;
