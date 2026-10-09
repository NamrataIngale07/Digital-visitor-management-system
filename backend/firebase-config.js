/**
 * Digital Visitor Management System for College
 * Backend Configuration: Firebase Initialization
 * 
 * This module exports the initialized Firebase App, Authentication, and Cloud Firestore instances.
 */

// Firebase Configuration Object
// Replace with your project's configuration from the Firebase Console (Project Settings -> General -> Web Apps)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}
