/**
 * Digital Visitor Management System for College
 * Backend Service: Cloud Firestore Visitor Management Service
 * 
 * Provides full CRUD operations, real-time queries, dashboard KPI computations,
 * and security event logging directly with Cloud Firestore.
 */

const VisitorBackendService = {
  COLLECTIONS: {
    VISITORS: 'visitors',
    NOTIFICATIONS: 'notifications',
    USERS: 'users'
  },

  /**
   * Get Firestore Database Instance
   */
  getDB() {
    if (window.firebase && firebase.firestore) {
      return firebase.firestore();
    }
    throw new Error('Firestore is not initialized.');
  },

  /**
   * Fetch all visitors sorted by creation date descending
   * @returns {Promise<Array>} List of visitor objects
   */
  async getAllVisitors() {
    const db = this.getDB();
    const snapshot = await db.collection(this.COLLECTIONS.VISITORS)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Fetch single visitor by custom ID or Firestore Document ID
   * @param {string} id - Visitor custom ID (e.g. VIS-2026-001) or docId
   * @returns {Promise<Object|null>}
   */
  async getVisitorById(id) {
    if (!id) return null;
    const db = this.getDB();
    const cleanId = id.trim();

    // 1. Try querying by custom 'id' field (case-insensitive query matching)
    const querySnapshot = await db.collection(this.COLLECTIONS.VISITORS)
      .where('id', '==', cleanId)
      .limit(1)
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { docId: doc.id, ...doc.data() };
    }

    // 2. Try querying directly by doc ID if valid
    try {
      const docRef = await db.collection(this.COLLECTIONS.VISITORS).doc(cleanId).get();
      if (docRef.exists) {
        return { docId: docRef.id, ...docRef.data() };
      }
    } catch (e) {
      // Not a valid doc ID path, ignore
    }

    return null;
  },

  /**
   * Register a new visitor in Firestore
   * @param {Object} data - Visitor form data
   * @returns {Promise<Object>} Created visitor object
   */
  async registerVisitor(data) {
    const db = this.getDB();
    const year = new Date().getFullYear();

    // Generate formatted sequential or timestamp-based Visitor ID
    const countSnapshot = await db.collection(this.COLLECTIONS.VISITORS).get();
    const count = countSnapshot.size + 1;
    const formattedId = `VIS-${year}-${String(count).padStart(3, '0')}`;

    const newVisitor = {
      id: formattedId,
      name: data.name || '',
      phone: data.phone || '',
      email: data.email || '',
      idType: data.idType || 'Aadhaar / National ID',
      idNumber: data.idNumber || 'N/A',
      purpose: data.purpose || 'Official Meeting',
      department: data.department || 'Administration',
      hostName: data.hostName || 'College Administration',
      date: data.date || new Date().toISOString().split('T')[0],
      entryTime: data.entryTime || this.formatCurrentTime(),
      exitTime: null,
      status: 'Inside Campus',
      vehicleNo: data.vehicleNo || 'None',
      belongings: data.belongings || 'None',
      notes: data.notes || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    const docRef = await db.collection(this.COLLECTIONS.VISITORS).add(newVisitor);

    // Create automated notification in Firestore
    await this.addNotification({
      title: 'New Visitor Registered',
      message: `${newVisitor.name} has been issued a pass to meet ${newVisitor.hostName} (${newVisitor.department}).`,
      visitorName: newVisitor.name,
      visitorId: newVisitor.id,
      department: newVisitor.department,
      type: 'arrival'
    });

    return { docId: docRef.id, ...newVisitor };
  },

  /**
   * Update visitor status (e.g. Inside Campus <-> Exited)
   * @param {string} id - Visitor ID or docId
   * @param {string} newStatus - 'Inside Campus' or 'Exited'
   * @returns {Promise<Object|null>}
   */
  async updateVisitorStatus(id, newStatus) {
    const db = this.getDB();
    const visitor = await this.getVisitorById(id);
    if (!visitor) return null;

    const docId = visitor.docId;
    const updateData = {
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    if (newStatus === 'Exited') {
      updateData.exitTime = this.formatCurrentTime();
    } else if (newStatus === 'Inside Campus') {
      if (!visitor.entryTime) {
        updateData.entryTime = this.formatCurrentTime();
      }
      updateData.exitTime = null;
    }

    await db.collection(this.COLLECTIONS.VISITORS).doc(docId).update(updateData);

    // Create Notification in Firestore
    if (newStatus === 'Exited') {
      await this.addNotification({
        title: 'Visitor Exited',
        message: `${visitor.name} (${visitor.id}) has checked out of campus at ${updateData.exitTime}.`,
        visitorName: visitor.name,
        visitorId: visitor.id,
        department: visitor.department,
        type: 'info'
      });
    }

    return { ...visitor, ...updateData };
  },

  /**
   * Delete a visitor document
   * @param {string} id 
   */
  async deleteVisitor(id) {
    const db = this.getDB();
    const visitor = await this.getVisitorById(id);
    if (!visitor || !visitor.docId) return false;

    await db.collection(this.COLLECTIONS.VISITORS).doc(visitor.docId).delete();
    return true;
  },

  /**
   * Compute Real-time Dashboard KPIs from Firestore
   */
  async getDashboardStats() {
    const visitors = await this.getAllVisitors();
    const today = new Date().toISOString().split('T')[0];

    const todayVisitors = visitors.filter(v => v.date === today);
    const currentlyInside = visitors.filter(v => v.status === 'Inside Campus');
    const completedVisits = visitors.filter(v => v.status === 'Exited');
    const totalVisitors = visitors.length;

    return {
      total: totalVisitors,
      inside: currentlyInside.length,
      today: todayVisitors.length,
      completed: completedVisits.length,
      insideList: currentlyInside,
      recentList: visitors.slice(0, 6)
    };
  },

  /**
   * Notifications Management in Firestore
   */
  async getNotifications() {
    const db = this.getDB();
    const snapshot = await db.collection(this.COLLECTIONS.NOTIFICATIONS)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => ({
      docId: doc.id,
      ...doc.data()
    }));
  },

  async addNotification(notif) {
    const db = this.getDB();
    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title: notif.title || 'Campus Alert',
      message: notif.message || '',
      visitorName: notif.visitorName || 'Visitor',
      visitorId: notif.visitorId || '',
      department: notif.department || 'Campus Security',
      timestamp: 'Just now',
      type: notif.type || 'info',
      unread: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp ? firebase.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
    };

    const docRef = await db.collection(this.COLLECTIONS.NOTIFICATIONS).add(newNotif);
    return { docId: docRef.id, ...newNotif };
  },

  async markNotificationRead(docId) {
    const db = this.getDB();
    await db.collection(this.COLLECTIONS.NOTIFICATIONS).doc(docId).update({ unread: false });
    return true;
  },

  async markAllNotificationsRead() {
    const db = this.getDB();
    const snapshot = await db.collection(this.COLLECTIONS.NOTIFICATIONS).where('unread', '==', true).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { unread: false });
    });
    await batch.commit();
    return true;
  },

  async clearAllNotifications() {
    const db = this.getDB();
    const snapshot = await db.collection(this.COLLECTIONS.NOTIFICATIONS).get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    return true;
  },

  // Helper: Format Time
  formatCurrentTime() {
    const d = new Date();
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VisitorBackendService };
}
