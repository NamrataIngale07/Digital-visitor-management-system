/**
 * Digital Visitor Management System for College
 * Backend Configuration: Firebase Initialization
 * 
 * This module exports the initialized Firebase App, Authentication, and Cloud Firestore instances.
 */

// Firebase Configuration Object
// Replace with your project's configuration from the Firebase Console (Project Settings -> General -> Web Apps)



// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDWxQOCf5mTYgeMWyPbYMRg0zUkSxXwuNg",
  authDomain: "digital-visitor-management.firebaseapp.com",
  projectId: "digital-visitor-management",
  storageBucket: "digital-visitor-management.firebasestorage.app",
  messagingSenderId: "786179967110",
  appId: "1:786179967110:web:5807ba4d50ca5546006907",
  measurementId: "G-P4VGK7YPZ7"
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig };
}
