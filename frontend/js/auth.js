/**
 * Digital Visitor Management System for College
 * Client-Side Firebase Authentication Service
 * 
 * Manages admin & gate officer sign-in, session state, page route protection,
 * and user profile synchronization with Cloud Firestore.
 */

const AUTH_STORAGE_KEY = 'college_vms_auth_user';

const AuthService = {
  /**
   * Check if current user is logged in
   */
  isAuthenticated() {
    const auth = FirebaseApp.getAuth();
    if (auth && auth.currentUser) {
      return true;
    }
    const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    return !!cachedUser;
  },

  /**
   * Route Guard: Protect pages requiring authentication
   * Redirects unauthenticated visitors to login.html
   */
  requireAuth() {
    const rawPath = window.location.pathname.toLowerCase();
    const currentFile = rawPath.split('/').pop().replace(/\.html$/, '');

    // Never enforce authentication on public pages (login, index, homepage root)
    if (
      currentFile === 'login' ||
      currentFile === 'index' ||
      currentFile === '' ||
      rawPath.endsWith('/') ||
      rawPath.includes('/login')
    ) {
      return;
    }

    const auth = FirebaseApp.getAuth();
    if (FirebaseApp.isLive && auth) {
      auth.onAuthStateChanged(user => {
        if (!user) {
          const cached = localStorage.getItem(AUTH_STORAGE_KEY);
          if (!cached) {
            console.warn('Unauthorized access. Redirecting to login.html');
            window.location.href = 'login.html';
          }
        } else {
          // Save user session in cache for fast hydration
          this.cacheUserSession(user);
        }
      });
    } else {
      // Fallback check
      if (!this.isAuthenticated()) {
        console.warn('Unauthorized access. Redirecting to login.html');
        window.location.href = 'login.html';
      }
    }
  },

  /**
   * Sign In with Email and Password
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    const cleanEmail = email.trim();
    const auth = FirebaseApp.getAuth();

    if (FirebaseApp.isLive && auth) {
      try {
        const userCredential = await auth.signInWithEmailAndPassword(cleanEmail, password);
        const user = userCredential.user;
        await this.syncUserProfile(user);
        this.cacheUserSession(user);
        return { success: true, user };
      } catch (error) {
        console.error('Firebase Auth Login Error:', error);
        throw new Error(this.getReadableErrorMessage(error));
      }
    } else {
      // Demo / Local storage fallback mode
      if (
        (cleanEmail === 'admin@college.edu' && password === 'admin123') ||
        (cleanEmail === 'security.gate1@college.edu' && password === 'guard2026') ||
        (cleanEmail.length > 3 && password.length >= 6)
      ) {
        const mockUser = {
          uid: 'USR-' + Date.now().toString().slice(-4),
          email: cleanEmail,
          displayName: cleanEmail.includes('security') ? 'Gate Officer 1' : 'Capt. R. K. Mukherjee',
          role: cleanEmail.includes('security') ? 'Campus Gate Officer' : 'Chief Security Officer & Admin'
        };
        this.cacheUserSession(mockUser);
        return { success: true, user: mockUser };
      } else {
        throw new Error('Invalid email or password. For demo, use admin@college.edu / admin123');
      }
    }
  },

  /**
   * Auto-login or register demo credentials for viva examiners
   * @param {string} role 'admin' | 'security'
   */
  async loginOrRegisterDemo(role) {
    let email = 'admin@college.edu';
    let password = 'admin123';
    let displayName = 'Capt. R. K. Mukherjee';
    let roleTitle = 'Chief Security Officer & Admin';

    if (role === 'security') {
      email = 'security.gate1@college.edu';
      password = 'guard2026';
      displayName = 'Gate Officer 1';
      roleTitle = 'Campus Gate Officer';
    }

    const auth = FirebaseApp.getAuth();
    if (FirebaseApp.isLive && auth) {
      try {
        // 1. Try direct sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        await this.syncUserProfile(userCredential.user, displayName, roleTitle);
        this.cacheUserSession(userCredential.user);
        return userCredential.user;
      } catch (err) {
        // 2. If user doesn't exist, create it in Firebase Auth automatically
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const newCredential = await auth.createUserWithEmailAndPassword(email, password);
            await newCredential.user.updateProfile({ displayName });
            await this.syncUserProfile(newCredential.user, displayName, roleTitle);
            this.cacheUserSession(newCredential.user);
            return newCredential.user;
          } catch (createErr) {
            console.error('Demo auto-creation error:', createErr);
            throw new Error(this.getReadableErrorMessage(createErr));
          }
        }
        throw new Error(this.getReadableErrorMessage(err));
      }
    } else {
      return (await this.login(email, password)).user;
    }
  },

  /**
   * Synchronize user record in Firestore 'users' collection
   */
  async syncUserProfile(user, customName, customRole) {
    const db = FirebaseApp.getDb();
    if (!db || !user) return;

    try {
      const userRef = db.collection('users').doc(user.uid);
      const doc = await userRef.get();

      if (!doc.exists) {
        await userRef.set({
          uid: user.uid,
          name: customName || user.displayName || 'Campus Security Officer',
          email: user.email,
          role: customRole || (user.email.includes('security') ? 'Campus Gate Officer' : 'Chief Security Officer & Admin'),
          phone: '+91 98450 11223',
          campus: 'Main North Campus, Block-A Gate 1',
          shift: 'General Security Shift (08:00 AM - 08:00 PM)',
          createdAt: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('User profile sync warning:', e);
    }
  },

  /**
   * Sign Out Current User
   */
  async logout() {
    const auth = FirebaseApp.getAuth();
    if (FirebaseApp.isLive && auth) {
      try {
        await auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.location.href = 'login.html';
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordReset(email) {
    const auth = FirebaseApp.getAuth();
    if (FirebaseApp.isLive && auth) {
      await auth.sendPasswordResetEmail(email.trim());
      return true;
    }
    return true; // Simulated in fallback
  },

  /**
   * Cache user session to local storage for instantaneous UI rendering
   */
  cacheUserSession(user) {
    const sessionData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || (user.email.includes('security') ? 'Gate Officer 1' : 'Capt. R. K. Mukherjee'),
      role: user.email && user.email.includes('security') ? 'Campus Gate Officer' : 'Chief Security Officer & Admin',
      campus: 'Main North Campus, Block-A Gate 1',
      shift: 'General Security Shift (08:00 AM - 08:00 PM)'
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
  },

  /**
   * Get Current User Profile Data
   */
  getCurrentUser() {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error parsing user session:', e);
    }

    return {
      uid: 'DEMO-001',
      name: 'Capt. R. K. Mukherjee',
      role: 'Chief Security Officer & Admin',
      email: 'admin@college.edu',
      phone: '+91 98450 11223',
      campus: 'Main North Campus, Block-A Gate 1',
      shift: 'General Security Shift (08:00 AM - 08:00 PM)'
    };
  },

  /**
   * Friendly error message mapper for Firebase Auth error codes
   */
  getReadableErrorMessage(error) {
    if (!error) return 'An unknown error occurred during authentication.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        return 'No user account found with this email. Please check your email or use the Demo button.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify your credentials.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please verify and try again.';
      case 'auth/invalid-email':
        return 'Please enter a valid email format (e.g. admin@college.edu).';
      case 'auth/user-disabled':
        return 'This campus account has been disabled by security administrator.';
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Access temporarily blocked for security. Please wait a moment.';
      case 'auth/network-request-failed':
        return 'Network connectivity error. Please check your internet connection.';
      default:
        return error.message || 'Authentication failed. Please try again.';
    }
  }
};
