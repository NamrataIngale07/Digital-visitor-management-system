/**
 * Digital Visitor Management System for College
 * Data Store Layer & Seed Repository
 * 
 * Provides local caching, default collegiate seed entities, QR generation,
 * and seamlessly synchronizes with Cloud Firestore via VisitorService.
 */

const STORAGE_KEYS = {
  VISITORS: 'college_vms_visitors_v1',
  NOTIFICATIONS: 'college_vms_notifications_v1',
  USER: 'college_vms_user_v1',
  SETTINGS: 'college_vms_settings_v1'
};

// Helper: Calculate past date strings (YYYY-MM-DD)
function getPastDateString(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// Default Seed Data
const DEFAULT_VISITORS = [
  {
    id: 'VIS-2026-001',
    name: 'Dr. Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh.kumar@techresearch.org',
    idType: 'Aadhaar / National ID',
    idNumber: '8942-5120-3341',
    purpose: 'Guest Lecture / AI Workshop',
    department: 'Computer Science & Engineering',
    hostName: 'Prof. Suresh Sharma (HOD)',
    date: new Date().toISOString().split('T')[0],
    entryTime: '09:30 AM',
    exitTime: null,
    status: 'Inside Campus',
    vehicleNo: 'KA-05-MH-2024',
    belongings: 'Laptop, Projector pointer',
    notes: 'Keynote speaker for Annual CSE Tech Symposium.'
  },
  {
    id: 'VIS-2026-002',
    name: 'Anita Desai',
    phone: '9123456780',
    email: 'anita.desai@gmail.com',
    idType: 'Driving License',
    idNumber: 'DL-04201800912',
    purpose: 'Parent / Academic Progress Discussion',
    department: 'Electronics & Communication',
    hostName: 'Dr. Vandana Verma',
    date: new Date().toISOString().split('T')[0],
    entryTime: '10:15 AM',
    exitTime: null,
    status: 'Inside Campus',
    vehicleNo: 'MH-12-AB-4455',
    belongings: 'Handbag',
    notes: 'Parent of 3rd Year ECE student Rohan Desai.'
  },
  {
    id: 'VIS-2026-003',
    name: 'Vikram Singh',
    phone: '9811223344',
    email: 'vikram.singh@cognizant-recruitment.com',
    idType: 'Company ID',
    idNumber: 'CTS-HR-99201',
    purpose: 'Campus Placement & Recruitment Drive',
    department: 'Dean Office / Placement Cell',
    hostName: 'Dr. P. K. Iyer (Placement Director)',
    date: new Date().toISOString().split('T')[0],
    entryTime: '08:45 AM',
    exitTime: '12:30 PM',
    status: 'Exited',
    vehicleNo: 'DL-01-CQ-8819',
    belongings: 'Laptop bag, Recruitment dossier',
    notes: 'Completed Round-1 interview batch.'
  },
  {
    id: 'VIS-2026-004',
    name: 'Sunita Menon',
    phone: '9988776655',
    email: 'sunita.menon@labtechinstruments.in',
    idType: 'Company ID',
    idNumber: 'LTI-SRV-411',
    purpose: 'Laboratory Equipment Maintenance',
    department: 'Mechanical Engineering',
    hostName: 'Mr. R. Nair (Lab Technician)',
    date: new Date().toISOString().split('T')[0],
    entryTime: '11:00 AM',
    exitTime: null,
    status: 'Inside Campus',
    vehicleNo: 'KA-01-EK-7700',
    belongings: 'Tool kit, Calibration sensors',
    notes: 'Servicing CNC Milling machine & 3D Printers in Mechatronics Lab.'
  },
  {
    id: 'VIS-2026-005',
    name: 'Rahul Bhatt',
    phone: '9765432109',
    email: 'rahul.bhatt99@yahoo.com',
    idType: 'Student ID',
    idNumber: 'ST-AD-2026',
    purpose: 'Campus Tour & Admission Query',
    department: 'Admissions Office',
    hostName: 'Mrs. Meenakshi Sundaram',
    date: new Date().toISOString().split('T')[0],
    entryTime: '09:00 AM',
    exitTime: '11:15 AM',
    status: 'Exited',
    vehicleNo: 'None (Pedestrian)',
    belongings: 'Academic transcripts portfolio',
    notes: 'B.Tech lateral entry counseling.'
  },
  {
    id: 'VIS-2026-006',
    name: 'Dr. Priya Sundaram',
    phone: '9443322110',
    email: 'priya.sundaram@univ-examiners.ac.in',
    idType: 'Faculty ID Card',
    idNumber: 'NIT-FAC-881',
    purpose: 'External Examiner / PhD Viva Voce',
    department: 'Examination Cell',
    hostName: 'Controller of Examinations',
    date: new Date().toISOString().split('T')[0],
    entryTime: '10:00 AM',
    exitTime: null,
    status: 'Inside Campus',
    vehicleNo: 'KA-03-NV-5001',
    belongings: 'Laptop, Viva assessment sheets',
    notes: 'External evaluator for Doctoral Defense in Nanomaterials.'
  },
  {
    id: 'VIS-2026-007',
    name: 'Amitav Ghosh',
    phone: '9334455667',
    email: 'amitav.books@scholasticpress.org',
    idType: 'Aadhaar / National ID',
    idNumber: '6612-4411-9087',
    purpose: 'Book Donation & Journal Subscription',
    department: 'Central Library',
    hostName: 'Dr. K. Chandran (Chief Librarian)',
    date: getPastDateString(1),
    entryTime: '02:00 PM',
    exitTime: '04:30 PM',
    status: 'Exited',
    vehicleNo: 'KA-04-MM-9112',
    belongings: 'Sample textbook cartons',
    notes: 'Delivered 45 new IEEE journal reference copies.'
  },
  {
    id: 'VIS-2026-008',
    name: 'Kavita Pillai',
    phone: '9822334455',
    email: 'kavita.pillai@outlook.com',
    idType: 'Driving License',
    idNumber: 'DL-09201944112',
    purpose: 'Fee & Scholarship Verification',
    department: 'Accounts & Administration',
    hostName: 'Mr. Arvind Joshi',
    date: getPastDateString(1),
    entryTime: '11:30 AM',
    exitTime: '01:15 PM',
    status: 'Exited',
    vehicleNo: 'KA-51-P-3344',
    belongings: 'Document envelope',
    notes: 'Submitted State Merit Scholarship endorsement.'
  },
  {
    id: 'VIS-2026-009',
    name: 'Rohan Sen',
    phone: '9711228899',
    email: 'rohan.sen@alumni-network.org',
    idType: 'Alumni Card',
    idNumber: 'ALUM-2021-089',
    purpose: 'Alumni Interaction & Mentorship',
    department: 'Computer Science & Engineering',
    hostName: 'Prof. Suresh Sharma',
    date: getPastDateString(2),
    entryTime: '03:00 PM',
    exitTime: '05:45 PM',
    status: 'Exited',
    vehicleNo: 'KA-05-RS-1001',
    belongings: 'Laptop',
    notes: 'Mentored pre-final year students on Cloud Architecture.'
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'NOTIF-101',
    title: 'New Visitor Arrived',
    message: 'Dr. Rajesh Kumar has checked in at Main Gate.',
    visitorName: 'Dr. Rajesh Kumar',
    visitorId: 'VIS-2026-001',
    department: 'Computer Science & Engineering',
    timestamp: '15 mins ago',
    type: 'arrival',
    unread: true
  },
  {
    id: 'NOTIF-102',
    title: 'Host Alert',
    message: 'Dr. Vandana Verma has been notified of Anita Desai\'s arrival.',
    visitorName: 'Anita Desai',
    visitorId: 'VIS-2026-002',
    department: 'Electronics & Communication',
    timestamp: '45 mins ago',
    type: 'info',
    unread: true
  },
  {
    id: 'NOTIF-103',
    title: 'Visitor Exited Campus',
    message: 'Vikram Singh (Campus Recruiter) completed visit and exited at 12:30 PM.',
    visitorName: 'Vikram Singh',
    visitorId: 'VIS-2026-003',
    department: 'Dean Office / Placement Cell',
    timestamp: '1 hour ago',
    type: 'info',
    unread: false
  },
  {
    id: 'NOTIF-104',
    title: 'Security Notice',
    message: 'Lab maintenance team checked in with authorized toolkits.',
    visitorName: 'Sunita Menon',
    visitorId: 'VIS-2026-004',
    department: 'Mechanical Engineering',
    timestamp: '2 hours ago',
    type: 'warning',
    unread: false
  }
];

const DEFAULT_USER = {
  name: 'Capt. R. K. Mukherjee',
  role: 'Chief Security Officer & Admin',
  email: 'admin@college.edu',
  phone: '+91 98450 11223',
  campus: 'Main North Campus, Block-A Gate 1',
  shift: 'General Security Shift (08:00 AM - 08:00 PM)'
};

// Unified Data Store
const DataStore = {
  isGateOfficer() {
    try {
      const cached = localStorage.getItem('college_vms_auth_user');
      if (cached) {
        const user = JSON.parse(cached);
        return (user.email && user.email.toLowerCase().includes('security')) || 
               (user.role && user.role.toLowerCase().includes('gate'));
      }
    } catch (e) {}
    return false;
  },

  getVisitorsStorageKey() {
    return this.isGateOfficer() ? 'college_vms_visitors_gate_officer' : STORAGE_KEYS.VISITORS;
  },

  getNotificationsStorageKey() {
    return this.isGateOfficer() ? 'college_vms_notifications_gate_officer' : STORAGE_KEYS.NOTIFICATIONS;
  },

  clearGateOfficerData() {
    localStorage.setItem('college_vms_visitors_gate_officer', JSON.stringify([]));
    localStorage.setItem('college_vms_notifications_gate_officer', JSON.stringify([]));
    return true;
  },

  init() {
    // If Gate Officer is active, ensure their list starts completely clear with 0 data
    if (this.isGateOfficer()) {
      if (localStorage.getItem('college_vms_visitors_gate_officer') === null) {
        localStorage.setItem('college_vms_visitors_gate_officer', JSON.stringify([]));
      }
      if (localStorage.getItem('college_vms_notifications_gate_officer') === null) {
        localStorage.setItem('college_vms_notifications_gate_officer', JSON.stringify([]));
      }
      return;
    }

    if (!localStorage.getItem(STORAGE_KEYS.VISITORS)) {
      localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(DEFAULT_VISITORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
    }
  },

  resetAll() {
    if (this.isGateOfficer()) {
      return this.clearGateOfficerData();
    }
    localStorage.setItem(STORAGE_KEYS.VISITORS, JSON.stringify(DEFAULT_VISITORS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEFAULT_USER));
    return true;
  },

  // Synchronous Local Fallback Methods
  getVisitorsLocal() {
    this.init();
    try {
      const key = this.getVisitorsStorageKey();
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) || [];
      }
      return this.isGateOfficer() ? [] : DEFAULT_VISITORS;
    } catch (e) {
      return this.isGateOfficer() ? [] : DEFAULT_VISITORS;
    }
  },

  getVisitorByIdLocal(id) {
    const list = this.getVisitorsLocal();
    return list.find(v => v.id.toUpperCase() === id.trim().toUpperCase()) || null;
  },

  addVisitorLocal(visitorData) {
    const visitors = this.getVisitorsLocal();
    const count = visitors.length + 1;
    const year = new Date().getFullYear();
    const formattedId = `VIS-${year}-${String(count).padStart(3, '0')}`;

    const newVisitor = {
      id: formattedId,
      name: visitorData.name || '',
      phone: visitorData.phone || '',
      email: visitorData.email || '',
      idType: visitorData.idType || 'Aadhaar / National ID',
      idNumber: visitorData.idNumber || 'N/A',
      purpose: visitorData.purpose || 'Official Meeting',
      department: visitorData.department || 'Administration',
      hostName: visitorData.hostName || 'College Administration',
      date: visitorData.date || new Date().toISOString().split('T')[0],
      entryTime: visitorData.entryTime || formatCurrentTime(),
      exitTime: null,
      status: 'Inside Campus',
      vehicleNo: visitorData.vehicleNo || 'None',
      belongings: visitorData.belongings || 'None',
      notes: visitorData.notes || 'Registered at Campus Gate.'
    };

    visitors.unshift(newVisitor);
    localStorage.setItem(this.getVisitorsStorageKey(), JSON.stringify(visitors));

    this.addNotificationLocal({
      title: 'New Visitor Registered',
      message: `${newVisitor.name} has been registered to meet ${newVisitor.hostName} (${newVisitor.department}).`,
      visitorName: newVisitor.name,
      visitorId: newVisitor.id,
      department: newVisitor.department,
      type: 'arrival'
    });

    return newVisitor;
  },

  updateVisitorStatusLocal(id, newStatus) {
    const visitors = this.getVisitorsLocal();
    const index = visitors.findIndex(v => v.id.toUpperCase() === id.trim().toUpperCase());
    if (index === -1) return null;

    visitors[index].status = newStatus;
    if (newStatus === 'Exited') {
      visitors[index].exitTime = formatCurrentTime();
      this.addNotificationLocal({
        title: 'Visitor Exited',
        message: `${visitors[index].name} (${visitors[index].id}) has marked exit at ${visitors[index].exitTime}.`,
        visitorName: visitors[index].name,
        visitorId: visitors[index].id,
        department: visitors[index].department,
        type: 'info'
      });
    } else if (newStatus === 'Inside Campus') {
      if (!visitors[index].entryTime) {
        visitors[index].entryTime = formatCurrentTime();
      }
      visitors[index].exitTime = null;
    }

    localStorage.setItem(this.getVisitorsStorageKey(), JSON.stringify(visitors));
    return visitors[index];
  },

  deleteVisitorLocal(id) {
    let visitors = this.getVisitorsLocal();
    visitors = visitors.filter(v => v.id.toUpperCase() !== id.trim().toUpperCase());
    localStorage.setItem(this.getVisitorsStorageKey(), JSON.stringify(visitors));
    return true;
  },

  getNotificationsLocal() {
    this.init();
    try {
      const key = this.getNotificationsStorageKey();
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) || [];
      }
      return this.isGateOfficer() ? [] : DEFAULT_NOTIFICATIONS;
    } catch (e) {
      return this.isGateOfficer() ? [] : DEFAULT_NOTIFICATIONS;
    }
  },

  addNotificationLocal(notif) {
    const notifications = this.getNotificationsLocal();
    const newNotif = {
      id: `NOTIF-${Date.now().toString().slice(-4)}`,
      title: notif.title || 'Campus Alert',
      message: notif.message || '',
      visitorName: notif.visitorName || 'Visitor',
      visitorId: notif.visitorId || '',
      department: notif.department || 'Campus Security',
      timestamp: 'Just now',
      type: notif.type || 'info',
      unread: true
    };
    notifications.unshift(newNotif);
    localStorage.setItem(this.getNotificationsStorageKey(), JSON.stringify(notifications));
    return newNotif;
  },

  markNotificationReadLocal(id) {
    const list = this.getNotificationsLocal();
    const item = list.find(n => n.id === id);
    if (item) {
      item.unread = false;
      localStorage.setItem(this.getNotificationsStorageKey(), JSON.stringify(list));
    }
    return true;
  },

  markAllNotificationsReadLocal() {
    const list = this.getNotificationsLocal();
    list.forEach(n => n.unread = false);
    localStorage.setItem(this.getNotificationsStorageKey(), JSON.stringify(list));
    return true;
  },

  clearAllNotificationsLocal() {
    localStorage.setItem(this.getNotificationsStorageKey(), JSON.stringify([]));
    return true;
  },

  getUserLocal() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER)) || DEFAULT_USER;
    } catch (e) {
      return DEFAULT_USER;
    }
  },

  updateUserLocal(userData) {
    const current = this.getUserLocal();
    const updated = { ...current, ...userData };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated));
    return updated;
  },

  // Unified Async Facade (Delegates to VisitorService)
  async getVisitors() {
    return await VisitorService.getVisitors();
  },

  async getVisitorById(id) {
    return await VisitorService.getVisitorById(id);
  },

  async addVisitor(data) {
    return await VisitorService.addVisitor(data);
  },

  async updateVisitorStatus(id, newStatus) {
    return await VisitorService.updateVisitorStatus(id, newStatus);
  },

  async deleteVisitor(id) {
    return await VisitorService.deleteVisitor(id);
  },

  async getDashboardStats() {
    return await VisitorService.getDashboardStats();
  },

  async getNotifications() {
    return await VisitorService.getNotifications();
  },

  async addNotification(notif) {
    return await VisitorService.addNotification(notif);
  },

  async markNotificationRead(id) {
    return await VisitorService.markNotificationRead(id);
  },

  async markAllNotificationsRead() {
    return await VisitorService.markAllNotificationsRead();
  },

  async clearAllNotifications() {
    return await VisitorService.clearAllNotifications();
  },

  async getUnreadNotificationsCount() {
    return await VisitorService.getUnreadNotificationsCount();
  },

  async getUser() {
    return await VisitorService.getUserProfile();
  },

  async updateUser(data) {
    return await VisitorService.updateUserProfile(data);
  }
};

// Helper: Format current time as HH:MM AM/PM
function formatCurrentTime() {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${strMinutes} ${ampm}`;
}

// Generate an SVG QR code graphic visualization
function generateQRCodeSVG(dataString) {
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = ((hash << 5) - hash) + dataString.charCodeAt(i);
    hash |= 0;
  }
  
  const size = 21; // standard QR grid size
  let rects = '';
  
  function addFinderPattern(startX, startY) {
    rects += `<rect x="${startX}" y="${startY}" width="7" height="7" fill="#0f172a" />`;
    rects += `<rect x="${startX + 1}" y="${startY + 1}" width="5" height="5" fill="#ffffff" />`;
    rects += `<rect x="${startX + 2}" y="${startY + 2}" width="3" height="3" fill="#0f172a" />`;
  }
  
  addFinderPattern(0, 0);
  addFinderPattern(14, 0);
  addFinderPattern(0, 14);

  let seed = Math.abs(hash) || 1234567;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if ((x < 8 && y < 8) || (x >= 13 && y < 8) || (x < 8 && y >= 13)) {
        continue;
      }
      seed = (seed * 9301 + 49297) % 233280;
      if ((seed / 233280) > 0.5) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="#0f172a" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    ${rects}
  </svg>`;
}

// Initialize on script load
DataStore.init();
