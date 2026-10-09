/**
 * Digital Visitor Management System for College
 * Global Application Controller (Navigation, Sidebar, Clock, Toasts, Modals, Auth)
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  init() {
    const rawPath = window.location.pathname.toLowerCase();
    const currentFile = rawPath.split('/').pop().replace(/\.html$/, '');
    const isPublicPage = currentFile === 'login' || currentFile === 'index' || currentFile === '' || rawPath.endsWith('/') || rawPath.includes('login');

    // 1. Enforce authentication on protected pages only
    if (!isPublicPage && typeof AuthService !== 'undefined') {
      AuthService.requireAuth();
    }

    this.highlightActiveNav();
    this.setupSidebarToggle();
    this.startLiveClock();
    if (!isPublicPage) {
      this.updateNotificationBadges();
      this.bindUserProfile();
    }
    this.setupGlobalShortcuts();
  },

  // Highlight active page link in sidebar
  highlightActiveNav() {
    const rawPath = window.location.pathname.toLowerCase();
    const currentFile = rawPath.split('/').pop().replace(/\.html$/, '') || 'index';
    const navLinks = document.querySelectorAll('.nav-item');
    
    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase().replace(/\.html$/, '');
      if (href === currentFile || (currentFile === '' && href === 'dashboard')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  },

  // Mobile sidebar open / close handler
  setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.querySelector('.app-sidebar');
    
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('sidebar-open');
      });

      // Close when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('sidebar-open') && !sidebar.contains(e.target) && e.target !== toggleBtn) {
          sidebar.classList.remove('sidebar-open');
        }
      });
    }
  },

  // Live campus clock updater
  startLiveClock() {
    const clockEl = document.getElementById('liveCampusClock');
    if (!clockEl) return;

    const updateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      };
      clockEl.textContent = now.toLocaleDateString('en-US', options);
    };

    updateTime();
    setInterval(updateTime, 1000);
  },

  // Update badge counts for unread notifications in topbar and sidebar
  async updateNotificationBadges() {
    let unreadCount = 0;
    try {
      if (typeof VisitorService !== 'undefined') {
        unreadCount = await VisitorService.getUnreadNotificationsCount();
      } else {
        unreadCount = DataStore.getNotificationsLocal().filter(n => n.unread).length;
      }
    } catch (e) {
      unreadCount = DataStore.getNotificationsLocal().filter(n => n.unread).length;
    }

    const badges = document.querySelectorAll('.notification-badge-count');
    badges.forEach(badge => {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    });
  },

  // Bind current user profile to UI
  async bindUserProfile() {
    let user = null;
    if (typeof AuthService !== 'undefined') {
      user = AuthService.getCurrentUser();
    } else {
      user = DataStore.getUserLocal();
    }
    
    if (!user) return;

    const nameEls = document.querySelectorAll('.bind-user-name');
    const roleEls = document.querySelectorAll('.bind-user-role');
    const emailEls = document.querySelectorAll('.bind-user-email');
    const campusEls = document.querySelectorAll('.bind-user-campus');
    
    nameEls.forEach(el => el.textContent = user.name || user.displayName || 'Campus Admin');
    roleEls.forEach(el => el.textContent = user.role || 'Security Admin');
    emailEls.forEach(el => el.textContent = user.email || 'admin@college.edu');
    campusEls.forEach(el => el.textContent = user.campus || 'Main North Campus, Block-A Gate 1');
  },

  // Toast Notification System
  showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Modal Handlers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  // Firebase Sign Out
  async logout() {
    this.showToast('Signing out...', 'info', 1000);
    setTimeout(async () => {
      if (typeof AuthService !== 'undefined') {
        await AuthService.logout();
      } else {
        window.location.href = 'login.html';
      }
    }, 600);
  },

  // Escape key closes modals
  setupGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(modal => {
          modal.classList.remove('active');
        });
      }
    });
  }
};
