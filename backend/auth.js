/**
 * Digital Visitor Management System for College
 * Backend Service: Authentication Service
 * 
 * Handles Firebase Authentication for administrators and gate officers.
 */

const AuthService = {
  /**
   * Log in user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} User credential
   */
  async login(email, password) {
    if (!window.firebase || !firebase.auth) {
      throw new Error("Firebase Auth SDK not initialized.");
    }
    return await firebase.auth().signInWithEmailAndPassword(email.trim(), password);
  },

  /**
   * Sign out current user
   */
  async logout() {
    if (window.firebase && firebase.auth) {
      await firebase.auth().signOut();
    }
    localStorage.removeItem('college_vms_auth_user');
    window.location.href = 'login.html';
  },

  /**
   * Send password reset email
   * @param {string} email 
   */
  async sendPasswordReset(email) {
    if (!window.firebase || !firebase.auth) {
      throw new Error("Firebase Auth SDK not initialized.");
    }
    return await firebase.auth().sendPasswordResetEmail(email.trim());
  },

  /**
   * Get currently logged-in user
   * @returns {Object|null}
   */
  getCurrentUser() {
    if (window.firebase && firebase.auth) {
      return firebase.auth().currentUser;
    }
    return null;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
}
