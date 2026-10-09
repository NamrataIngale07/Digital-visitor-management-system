/**
 * Digital Visitor Management System for College
 * Firebase Client Configuration & Service Initializer
 * 
 * Instructions:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a Firebase Project (e.g. 'college-visitor-management')
 * 3. Register a Web Application under Project Settings -> General -> Web Apps
 * 4. Copy the firebaseConfig JSON and paste your credentials into the object below.
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const FirebaseApp = {
  app: null,
  auth: null,
  db: null,
  isInitialized: false,
  isLive: false,

  init() {
    try {
      // Check if Firebase SDK is loaded
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK scripts not detected. Running in Local Storage mode.');
        return false;
      }

      // Check if real credentials have been provided
      const isPlaceholder = !firebaseConfig.apiKey || 
                            firebaseConfig.apiKey.includes('YOUR_API_KEY') || 
                            firebaseConfig.projectId.includes('YOUR_PROJECT_ID');

      if (!isPlaceholder) {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(firebaseConfig);
        } else {
          this.app = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.isInitialized = true;
        this.isLive = true;
        console.log('✅ Firebase successfully initialized with Cloud Firestore & Auth.');
        return true;
      } else {
        console.info('ℹ️ Firebase Config placeholder detected. Running in seamless Local Storage fallback mode until you insert your Firebase keys in js/firebase-config.js.');
        this.isInitialized = true;
        this.isLive = false;
        return false;
      }
    } catch (error) {
      console.error('Firebase Initialization Error:', error);
      this.isLive = false;
      return false;
    }
  },

  getDb() {
    return this.isLive ? this.db : null;
  },

  getAuth() {
    return this.isLive ? this.auth : null;
  }
};

// Auto initialize on load
FirebaseApp.init();
