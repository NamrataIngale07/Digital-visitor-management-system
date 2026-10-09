/**
 * Digital Visitor Management System for College
 * Client-Side Cloud Firestore Visitor Service
 * 
 * Provides direct, asynchronous interaction with Cloud Firestore collections:
 * 'visitors', 'notifications', and 'users', with real-time listeners and offline caching.
 */

const VisitorService = {
  COLLECTIONS: {
    VISITORS: 'visitors',
    NOTIFICATIONS: 'notifications',
    USERS: 'users'
  },

  /**
   * Get all visitors from Cloud Firestore
   * @returns {Promise<Array>}
   */
  async getVisitors() {
    const isGate = typeof DataStore !== 'undefined' && DataStore.isGateOfficer();
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        let query = db.collection(this.COLLECTIONS.VISITORS);
        if (isGate) {
          query = query.where('registeredBy', '==', 'security.gate1@college.edu');
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
          if (!isGate) {
            // Seed default college records for Admin demo only
            console.log('Seeding initial visitor records to Cloud Firestore...');
            await this.seedDefaultData();
            return await this.getVisitors();
          }
          return [];
        }

        const list = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        // Sort by date/id descending
        list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
        return list;
      } catch (error) {
        console.error('Firestore getVisitors Error:', error);
        return DataStore.getVisitorsLocal();
      }
    } else {
      return DataStore.getVisitorsLocal();
    }
  },

  /**
   * Get a single visitor by custom Visitor ID (e.g. VIS-2026-001) or docId
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getVisitorById(id) {
    if (!id) return null;
    const cleanId = id.trim().toUpperCase();
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        // Query by 'id' field
        const querySnap = await db.collection(this.COLLECTIONS.VISITORS)
          .where('id', '==', cleanId)
          .limit(1)
          .get();

        if (!querySnap.empty) {
          const doc = querySnap.docs[0];
          return { docId: doc.id, ...doc.data() };
        }

        // Also check if id is a Firestore document ID
        try {
          const directDoc = await db.collection(this.COLLECTIONS.VISITORS).doc(id.trim()).get();
          if (directDoc.exists) {
            return { docId: directDoc.id, ...directDoc.data() };
          }
        } catch (e) {}

        // Fallback to local
        return DataStore.getVisitorByIdLocal(cleanId);
      } catch (error) {
        console.error('Firestore getVisitorById Error:', error);
        return DataStore.getVisitorByIdLocal(cleanId);
      }
    } else {
      return DataStore.getVisitorByIdLocal(cleanId);
    }
  },

  /**
   * Register a new visitor in Cloud Firestore
   * @param {Object} formData
   * @returns {Promise<Object>}
   */
  async addVisitor(formData) {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        // Generate next ID
        const allVisitors = await this.getVisitors();
        const count = allVisitors.length + 1;
        const year = new Date().getFullYear();
        const formattedId = `VIS-${year}-${String(count).padStart(3, '0')}`;

        const newVisitor = {
          id: formattedId,
          name: (formData.name || '').trim(),
          phone: (formData.phone || '').trim(),
          email: (formData.email || '').trim(),
          idType: formData.idType || 'Aadhaar / National ID',
          idNumber: formData.idNumber || 'N/A',
          purpose: formData.purpose || 'Official Meeting',
          department: formData.department || 'Administration',
          hostName: formData.hostName || 'College Administration',
          date: formData.date || new Date().toISOString().split('T')[0],
          entryTime: formData.entryTime || this.formatCurrentTime(),
          exitTime: null,
          status: 'Inside Campus',
          vehicleNo: formData.vehicleNo || 'None',
          belongings: formData.belongings || 'None',
          notes: formData.notes || (DataStore.isGateOfficer() ? 'Registered at Main Gate 1.' : 'Registered at Main Campus Reception.'),
          registeredBy: DataStore.isGateOfficer() ? 'security.gate1@college.edu' : 'admin@college.edu',
          createdAt: new Date().toISOString()
        };

        const docRef = await db.collection(this.COLLECTIONS.VISITORS).add(newVisitor);

        // Also create notification in Firestore
        await this.addNotification({
          title: 'New Visitor Registered',
          message: `${newVisitor.name} (${newVisitor.id}) has arrived to meet ${newVisitor.hostName} in ${newVisitor.department}.`,
          visitorName: newVisitor.name,
          visitorId: newVisitor.id,
          department: newVisitor.department,
          type: 'arrival'
        });

        // Also update local cache
        DataStore.addVisitorLocal(newVisitor);

        return { docId: docRef.id, ...newVisitor };
      } catch (error) {
        console.error('Firestore addVisitor Error:', error);
        return DataStore.addVisitorLocal(formData);
      }
    } else {
      return DataStore.addVisitorLocal(formData);
    }
  },

  /**
   * Update Visitor Status (e.g. Gate Check-Out or Re-Entry)
   * @param {string} id
   * @param {string} newStatus ('Inside Campus' | 'Exited')
   * @returns {Promise<Object|null>}
   */
  async updateVisitorStatus(id, newStatus) {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const visitor = await this.getVisitorById(id);
        if (!visitor) return null;

        const updatePayload = {
          status: newStatus,
          updatedAt: new Date().toISOString()
        };

        if (newStatus === 'Exited') {
          updatePayload.exitTime = this.formatCurrentTime();
        } else if (newStatus === 'Inside Campus') {
          if (!visitor.entryTime) {
            updatePayload.entryTime = this.formatCurrentTime();
          }
          updatePayload.exitTime = null;
        }

        if (visitor.docId) {
          await db.collection(this.COLLECTIONS.VISITORS).doc(visitor.docId).update(updatePayload);
        }

        // Notification on departure
        if (newStatus === 'Exited') {
          await this.addNotification({
            title: 'Visitor Exited Campus',
            message: `${visitor.name} (${visitor.id}) checked out at ${updatePayload.exitTime}.`,
            visitorName: visitor.name,
            visitorId: visitor.id,
            department: visitor.department,
            type: 'info'
          });
        }

        const updatedRecord = { ...visitor, ...updatePayload };
        DataStore.updateVisitorStatusLocal(id, newStatus);
        return updatedRecord;
      } catch (error) {
        console.error('Firestore updateVisitorStatus Error:', error);
        return DataStore.updateVisitorStatusLocal(id, newStatus);
      }
    } else {
      return DataStore.updateVisitorStatusLocal(id, newStatus);
    }
  },

  /**
   * Delete visitor record
   * @param {string} id
   */
  async deleteVisitor(id) {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const visitor = await this.getVisitorById(id);
        if (visitor && visitor.docId) {
          await db.collection(this.COLLECTIONS.VISITORS).doc(visitor.docId).delete();
        }
        DataStore.deleteVisitorLocal(id);
        return true;
      } catch (e) {
        console.error('Firestore deleteVisitor Error:', e);
        return DataStore.deleteVisitorLocal(id);
      }
    } else {
      return DataStore.deleteVisitorLocal(id);
    }
  },

  /**
   * Compute Dashboard Metrics from live visitor records
   * @returns {Promise<Object>}
   */
  async getDashboardStats() {
    const visitors = await this.getVisitors();
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
   * Real-time listener for visitor records
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  listenToVisitors(callback) {
    const db = FirebaseApp.getDb();
    if (FirebaseApp.isLive && db) {
      return db.collection(this.COLLECTIONS.VISITORS).onSnapshot(
        snapshot => {
          const list = snapshot.docs.map(doc => ({
            docId: doc.id,
            ...doc.data()
          }));
          list.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
          callback(list);
        },
        err => {
          console.error('Visitor listener error:', err);
        }
      );
    }
    return () => {};
  },

  /**
   * Notification Management
   */
  async getNotifications() {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const isGate = typeof DataStore !== 'undefined' && DataStore.isGateOfficer();
        const snapshot = await db.collection(this.COLLECTIONS.NOTIFICATIONS).get();
        if (snapshot.empty) {
          if (!isGate) {
            await this.seedDefaultNotifications();
            return await this.getNotifications();
          }
          return [];
        }

        const list = snapshot.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));

        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return list;
      } catch (error) {
        console.error('Firestore getNotifications Error:', error);
        return DataStore.getNotificationsLocal();
      }
    } else {
      return DataStore.getNotificationsLocal();
    }
  },

  async addNotification(notif) {
    const db = FirebaseApp.getDb();

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
      createdAt: new Date().toISOString()
    };

    if (FirebaseApp.isLive && db) {
      try {
        const docRef = await db.collection(this.COLLECTIONS.NOTIFICATIONS).add(newNotif);
        return { docId: docRef.id, ...newNotif };
      } catch (e) {
        console.error('Error adding notification to Firestore:', e);
      }
    }

    return DataStore.addNotificationLocal(newNotif);
  },

  async markNotificationRead(id) {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const notif = (await this.getNotifications()).find(n => n.id === id || n.docId === id);
        if (notif && notif.docId) {
          await db.collection(this.COLLECTIONS.NOTIFICATIONS).doc(notif.docId).update({ unread: false });
        }
      } catch (e) {
        console.error('Error marking notification read in Firestore:', e);
      }
    }
    return DataStore.markNotificationReadLocal(id);
  },

  async markAllNotificationsRead() {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const snap = await db.collection(this.COLLECTIONS.NOTIFICATIONS).where('unread', '==', true).get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.update(doc.ref, { unread: false }));
        await batch.commit();
      } catch (e) {
        console.error('Error marking all notifications read:', e);
      }
    }
    return DataStore.markAllNotificationsReadLocal();
  },

  async clearAllNotifications() {
    const db = FirebaseApp.getDb();

    if (FirebaseApp.isLive && db) {
      try {
        const snap = await db.collection(this.COLLECTIONS.NOTIFICATIONS).get();
        const batch = db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (e) {
        console.error('Error clearing notifications:', e);
      }
    }
    return DataStore.clearAllNotificationsLocal();
  },

  async getUnreadNotificationsCount() {
    const list = await this.getNotifications();
    return list.filter(n => n.unread).length;
  },

  /**
   * User Profile in Firestore
   */
  async getUserProfile() {
    const db = FirebaseApp.getDb();
    const user = AuthService.getCurrentUser();

    if (FirebaseApp.isLive && db && user && user.uid) {
      try {
        const doc = await db.collection(this.COLLECTIONS.USERS).doc(user.uid).get();
        if (doc.exists) {
          return { uid: doc.id, ...doc.data() };
        }
      } catch (e) {
        console.error('Error fetching user from Firestore:', e);
      }
    }
    return DataStore.getUserLocal();
  },

  async updateUserProfile(userData) {
    const db = FirebaseApp.getDb();
    const user = AuthService.getCurrentUser();

    if (FirebaseApp.isLive && db && user && user.uid) {
      try {
        await db.collection(this.COLLECTIONS.USERS).doc(user.uid).set(userData, { merge: true });
      } catch (e) {
        console.error('Error saving user profile to Firestore:', e);
      }
    }
    return DataStore.updateUserLocal(userData);
  },

  /**
   * Helper: Seeds default demo records to Firestore if empty
   */
  async seedDefaultData() {
    const db = FirebaseApp.getDb();
    if (!db) return;

    try {
      const batch = db.batch();
      DEFAULT_VISITORS.forEach(v => {
        const docRef = db.collection(this.COLLECTIONS.VISITORS).doc();
        batch.set(docRef, {
          ...v,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.log('✅ Default campus visitors seeded to Cloud Firestore successfully.');
    } catch (e) {
      console.error('Error seeding visitors to Firestore:', e);
    }
  },

  async seedDefaultNotifications() {
    const db = FirebaseApp.getDb();
    if (!db) return;

    try {
      const batch = db.batch();
      DEFAULT_NOTIFICATIONS.forEach(n => {
        const docRef = db.collection(this.COLLECTIONS.NOTIFICATIONS).doc();
        batch.set(docRef, {
          ...n,
          createdAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.log('✅ Default notifications seeded to Cloud Firestore.');
    } catch (e) {
      console.error('Error seeding notifications:', e);
    }
  },

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
