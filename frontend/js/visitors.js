/**
 * Digital Visitor Management System for College
 * Cloud Firestore Visitor Logic Module: Dashboard, Registration, Records, Pass, Gate, Notifications & History
 */

const VisitorController = {
  // --------------------------------------------------------------------------
  // 1. DASHBOARD PAGE LOGIC
  // --------------------------------------------------------------------------
  async initDashboard() {
    // Show Gate Officer shift reset button if active
    if (typeof DataStore !== 'undefined' && DataStore.isGateOfficer()) {
      const clearBtn = document.getElementById('btnGateClearData');
      if (clearBtn) clearBtn.style.display = 'inline-flex';
    }

    await this.renderDashboardStats();
    await this.renderDashboardRecentTable();
    await this.renderDepartmentDistribution();

    // Subscribe to live Firestore changes if enabled
    if (typeof VisitorService !== 'undefined' && FirebaseApp.isLive) {
      VisitorService.listenToVisitors(() => {
        this.refreshCurrentView();
      });
    }
  },

  clearGateShiftData() {
    if (confirm('Are you sure you want to clear all visitor entries for this Gate Officer shift and reset counters to 0?')) {
      if (typeof DataStore !== 'undefined') {
        DataStore.clearGateOfficerData();
      }
      if (typeof App !== 'undefined') {
        App.showToast('Gate shift cleared! All visitor counters reset to 0.', 'success');
      }
      setTimeout(() => window.location.reload(), 600);
    }
  },

  async renderDashboardStats() {
    const stats = await VisitorService.getDashboardStats();

    const elTotal = document.getElementById('statTotalVisitors');
    const elInside = document.getElementById('statInsideVisitors');
    const elToday = document.getElementById('statTodayVisitors');
    const elCompleted = document.getElementById('statCompletedVisits');

    if (elTotal) elTotal.textContent = stats.total;
    if (elInside) elInside.textContent = stats.inside;
    if (elToday) elToday.textContent = stats.today;
    if (elCompleted) elCompleted.textContent = stats.completed;
  },

  async renderDashboardRecentTable() {
    const tableBody = document.getElementById('dashboardRecentTableBody');
    if (!tableBody) return;

    const allVisitors = await VisitorService.getVisitors();
    const visitors = allVisitors.slice(0, 6);

    if (visitors.length === 0) {
      const isGate = typeof DataStore !== 'undefined' && DataStore.isGateOfficer();
      const emptyMsg = isGate 
        ? 'No visitors registered for this gate shift yet. Click "+ Register New Visitor" to record your first visitor.'
        : 'No visitor records found in database.';
      tableBody.innerHTML = `<tr><td colspan="7" class="table-empty-state">${emptyMsg}</td></tr>`;
      return;
    }

    tableBody.innerHTML = visitors.map(v => `
      <tr>
        <td><span class="visitor-id-tag">${v.id}</span></td>
        <td>
          <div style="font-weight: 600;">${v.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${v.phone}</div>
        </td>
        <td><span class="badge badge-dept">${v.department}</span></td>
        <td>${v.purpose}</td>
        <td><strong>${v.entryTime}</strong></td>
        <td>
          <span class="badge ${v.status === 'Inside Campus' ? 'badge-inside' : 'badge-exited'}">
            ${v.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <a href="visitor-pass.html?id=${v.id}" class="btn btn-secondary btn-sm" title="View Digital Pass">🎫 Pass</a>
            <a href="visitor-details.html?id=${v.id}" class="btn btn-secondary btn-sm" title="View Details">ℹ️</a>
            ${v.status === 'Inside Campus' 
              ? `<button onclick="VisitorController.quickMarkExit('${v.id}')" class="btn btn-danger btn-sm" title="Mark Exit">🚪 Exit</button>`
              : `<button onclick="VisitorController.quickMarkInside('${v.id}')" class="btn btn-success btn-sm" title="Mark Re-entry">↩️ Entry</button>`
            }
          </div>
        </td>
      </tr>
    `).join('');
  },

  async renderDepartmentDistribution() {
    const container = document.getElementById('deptDistributionList');
    if (!container) return;

    const visitors = await VisitorService.getVisitors();
    const deptCounts = {};

    visitors.forEach(v => {
      deptCounts[v.department] = (deptCounts[v.department] || 0) + 1;
    });

    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxVal = Math.max(...Object.values(deptCounts), 1);

    if (sortedDepts.length === 0) {
      container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No department visits recorded yet.</div>`;
      return;
    }

    container.innerHTML = sortedDepts.map(([dept, count]) => {
      const percentage = Math.round((count / (visitors.length || 1)) * 100);
      return `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 4px;">
            <span>${dept}</span>
            <span style="color: var(--primary);">${count} visits (${percentage}%)</span>
          </div>
          <div style="background: #e2e8f0; height: 8px; border-radius: 999px; overflow: hidden;">
            <div style="background: var(--secondary); height: 100%; width: ${(count / maxVal) * 100}%; border-radius: 999px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  async quickMarkExit(id) {
    const updated = await VisitorService.updateVisitorStatus(id, 'Exited');
    if (updated) {
      App.showToast(`${updated.name} has been marked as Exited.`, 'success');
      await this.refreshCurrentView();
    }
  },

  async quickMarkInside(id) {
    const updated = await VisitorService.updateVisitorStatus(id, 'Inside Campus');
    if (updated) {
      App.showToast(`${updated.name} is now Marked Inside Campus.`, 'success');
      await this.refreshCurrentView();
    }
  },

  async refreshCurrentView() {
    await this.renderDashboardStats();
    await this.renderDashboardRecentTable();
    await this.renderDepartmentDistribution();
    await App.updateNotificationBadges();
    
    if (document.getElementById('visitorRecordsTableBody')) {
      await this.renderRecordsTable();
    }
    if (document.getElementById('gateInsideList')) {
      await this.renderGateConsole();
    }
    if (document.getElementById('historyTableBody')) {
      await this.renderHistoryTable();
    }
  },

  // --------------------------------------------------------------------------
  // 2. VISITOR REGISTRATION PAGE LOGIC
  // --------------------------------------------------------------------------
  initRegistration() {
    const form = document.getElementById('visitorRegistrationForm');
    const autoFillBtn = document.getElementById('btnAutoFillDemo');
    const resetBtn = document.getElementById('btnResetForm');

    // Default Date to today
    const dateInput = document.getElementById('regDate');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Default Time to current time
    const timeInput = document.getElementById('regTime');
    if (timeInput && !timeInput.value) {
      const now = new Date();
      timeInput.value = now.toTimeString().slice(0, 5);
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegistrationSubmit(form);
      });
    }

    if (autoFillBtn) {
      autoFillBtn.addEventListener('click', () => {
        this.fillSampleRegistrationData();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        FormValidator.clearFormErrors(form);
        form.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        timeInput.value = new Date().toTimeString().slice(0, 5);
        App.showToast('Registration form reset.', 'info');
      });
    }
  },

  fillSampleRegistrationData() {
    const sampleVisitors = [
      {
        name: 'Dr. Alok Verma',
        phone: '9845123456',
        email: 'alok.verma@researchlab.gov.in',
        idType: 'Faculty ID Card',
        idNumber: 'RES-8921-IND',
        purpose: 'Guest Lecture / AI Workshop',
        department: 'Computer Science & Engineering',
        hostName: 'Prof. Suresh Sharma (HOD CSE)',
        vehicleNo: 'KA-01-AB-1234',
        belongings: 'Laptop, Presentation Drive',
        notes: 'Conducting afternoon seminar on Quantum Computing.'
      },
      {
        name: 'Sunil & Renu Agarwal',
        phone: '9422334455',
        email: 'sunil.agarwal@gmail.com',
        idType: 'Aadhaar / National ID',
        idNumber: '4455-8899-1122',
        purpose: 'Parent / Academic Progress Discussion',
        department: 'Electronics & Communication',
        hostName: 'Dr. Vandana Verma',
        vehicleNo: 'KA-03-MN-9988',
        belongings: 'Documents Folder',
        notes: 'Semester performance review discussion.'
      },
      {
        name: 'Karan Mehra',
        phone: '9877112233',
        email: 'karan.mehra@tcsrecruitment.com',
        idType: 'Company ID',
        idNumber: 'TCS-EMP-40192',
        purpose: 'Campus Placement & Recruitment Drive',
        department: 'Dean Office / Placement Cell',
        hostName: 'Dr. P. K. Iyer (Placement Director)',
        vehicleNo: 'KA-05-HR-4411',
        belongings: '2 Laptops, Interview Files',
        notes: 'Technical Interview Panel Head.'
      }
    ];

    const randomPick = sampleVisitors[Math.floor(Math.random() * sampleVisitors.length)];

    document.getElementById('regName').value = randomPick.name;
    document.getElementById('regPhone').value = randomPick.phone;
    document.getElementById('regEmail').value = randomPick.email;
    document.getElementById('regIdType').value = randomPick.idType;
    document.getElementById('regIdNumber').value = randomPick.idNumber;
    document.getElementById('regPurpose').value = randomPick.purpose;
    document.getElementById('regDepartment').value = randomPick.department;
    document.getElementById('regHostName').value = randomPick.hostName;
    document.getElementById('regVehicleNo').value = randomPick.vehicleNo;
    document.getElementById('regBelongings').value = randomPick.belongings;
    document.getElementById('regNotes').value = randomPick.notes;

    FormValidator.clearFormErrors(document.getElementById('visitorRegistrationForm'));
    App.showToast('Sample visitor details loaded!', 'info');
  },

  async handleRegistrationSubmit(form) {
    FormValidator.clearFormErrors(form);

    const submitBtn = document.getElementById('btnSubmitRegistration');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering in Firestore...';
    }

    const formData = {
      name: document.getElementById('regName').value,
      phone: document.getElementById('regPhone').value,
      email: document.getElementById('regEmail').value,
      idType: document.getElementById('regIdType').value,
      idNumber: document.getElementById('regIdNumber').value,
      purpose: document.getElementById('regPurpose').value,
      department: document.getElementById('regDepartment').value,
      hostName: document.getElementById('regHostName').value,
      date: document.getElementById('regDate').value,
      entryTime: document.getElementById('regTime') ? formatInputTime(document.getElementById('regTime').value) : null,
      vehicleNo: document.getElementById('regVehicleNo') ? document.getElementById('regVehicleNo').value : 'None',
      belongings: document.getElementById('regBelongings') ? document.getElementById('regBelongings').value : 'None',
      notes: document.getElementById('regNotes') ? document.getElementById('regNotes').value : ''
    };

    const validation = FormValidator.validateVisitorRegistration(formData);

    if (!validation.isValid) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🎫 Register & Issue Digital Pass';
      }
      Object.keys(validation.errors).forEach(field => {
        let inputEl = null;
        if (field === 'name') inputEl = document.getElementById('regName');
        if (field === 'phone') inputEl = document.getElementById('regPhone');
        if (field === 'email') inputEl = document.getElementById('regEmail');
        if (field === 'purpose') inputEl = document.getElementById('regPurpose');
        if (field === 'department') inputEl = document.getElementById('regDepartment');
        if (field === 'hostName') inputEl = document.getElementById('regHostName');
        if (field === 'date') inputEl = document.getElementById('regDate');

        if (inputEl) {
          FormValidator.showError(inputEl, validation.errors[field]);
        }
      });
      App.showToast('Please correct the highlighted form errors.', 'error');
      return;
    }

    try {
      // Save visitor in Cloud Firestore
      const newVisitor = await VisitorService.addVisitor(formData);

      // Show success modal with pass link
      const modalVisitorId = document.getElementById('modalSuccessVisitorId');
      const modalVisitorName = document.getElementById('modalSuccessVisitorName');
      const modalPassLink = document.getElementById('modalSuccessPassBtn');

      if (modalVisitorId) modalVisitorId.textContent = newVisitor.id;
      if (modalVisitorName) modalVisitorName.textContent = newVisitor.name;
      if (modalPassLink) modalPassLink.href = `visitor-pass.html?id=${newVisitor.id}`;

      App.openModal('registrationSuccessModal');
      App.showToast(`Visitor ${newVisitor.name} registered successfully!`, 'success');
      form.reset();
    } catch (e) {
      console.error('Registration error:', e);
      App.showToast('Failed to register visitor. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '🎫 Register & Issue Digital Pass';
      }
    }
  },

  // --------------------------------------------------------------------------
  // 3. DIGITAL VISITOR PASS PAGE LOGIC
  // --------------------------------------------------------------------------
  async initVisitorPass() {
    const urlParams = new URLSearchParams(window.location.search);
    const visitorId = urlParams.get('id');

    let visitor = null;
    if (visitorId) {
      visitor = await VisitorService.getVisitorById(visitorId);
    }

    // If not found by ID or no ID provided, default to the latest visitor
    if (!visitor) {
      const visitors = await VisitorService.getVisitors();
      visitor = visitors.length > 0 ? visitors[0] : null;
    }

    if (!visitor) {
      document.querySelector('.app-content').innerHTML = `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3>No Visitor Record Found</h3>
          <p style="color: var(--text-muted); margin: 10px 0 20px 0;">Please register a visitor or select one from the records.</p>
          <a href="register.html" class="btn btn-primary">Register Visitor</a>
        </div>
      `;
      return;
    }

    this.renderPassDetails(visitor);
  },

  renderPassDetails(visitor) {
    document.getElementById('passVisitorName').textContent = visitor.name;
    document.getElementById('passVisitorId').textContent = visitor.id;
    document.getElementById('passVisitorPhone').textContent = `📞 ${visitor.phone}`;
    document.getElementById('passPurpose').textContent = visitor.purpose;
    document.getElementById('passDepartment').textContent = visitor.department;
    document.getElementById('passHostName').textContent = visitor.hostName;
    document.getElementById('passDate').textContent = visitor.date;
    document.getElementById('passEntryTime').textContent = visitor.entryTime;
    document.getElementById('passIdProof').textContent = `${visitor.idType} (${visitor.idNumber})`;

    // Status Badge
    const statusEl = document.getElementById('passStatusBadge');
    if (statusEl) {
      statusEl.className = `badge ${visitor.status === 'Inside Campus' ? 'badge-inside' : 'badge-exited'}`;
      statusEl.textContent = visitor.status;
    }

    // Dynamic QR Code rendering
    const qrContainer = document.getElementById('passQrCodeContainer');
    if (qrContainer) {
      const qrData = `COLLEGE-PASS|ID:${visitor.id}|NAME:${visitor.name}|DEPT:${visitor.department}|DATE:${visitor.date}|STATUS:${visitor.status}`;
      qrContainer.innerHTML = generateQRCodeSVG(qrData);
    }
  },

  // --------------------------------------------------------------------------
  // 4. VISITOR RECORDS PAGE LOGIC
  // --------------------------------------------------------------------------
  async initRecords() {
    await this.renderRecordsTable();
    this.setupRecordFilters();
  },

  async renderRecordsTable() {
    const tableBody = document.getElementById('visitorRecordsTableBody');
    const recordsCountEl = document.getElementById('recordsCountDisplay');
    if (!tableBody) return;

    const searchTerm = (document.getElementById('recordSearchInput')?.value || '').toLowerCase().trim();
    const deptFilter = document.getElementById('recordDeptFilter')?.value || 'ALL';
    const statusFilter = document.getElementById('recordStatusFilter')?.value || 'ALL';
    const dateFilter = document.getElementById('recordDateFilter')?.value || 'ALL';

    const today = new Date().toISOString().split('T')[0];
    let visitors = await VisitorService.getVisitors();

    // Apply Search
    if (searchTerm) {
      visitors = visitors.filter(v => 
        (v.name || '').toLowerCase().includes(searchTerm) ||
        (v.id || '').toLowerCase().includes(searchTerm) ||
        (v.phone || '').includes(searchTerm) ||
        (v.hostName || '').toLowerCase().includes(searchTerm) ||
        (v.purpose || '').toLowerCase().includes(searchTerm)
      );
    }

    // Apply Department Filter
    if (deptFilter !== 'ALL') {
      visitors = visitors.filter(v => v.department === deptFilter);
    }

    // Apply Status Filter
    if (statusFilter !== 'ALL') {
      visitors = visitors.filter(v => v.status === statusFilter);
    }

    // Apply Date Filter
    if (dateFilter === 'TODAY') {
      visitors = visitors.filter(v => v.date === today);
    } else if (dateFilter === 'PAST') {
      visitors = visitors.filter(v => v.date !== today);
    }

    if (recordsCountEl) {
      recordsCountEl.textContent = `Showing ${visitors.length} record${visitors.length === 1 ? '' : 's'}`;
    }

    if (visitors.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="10" class="table-empty-state">
            <div class="empty-icon">🔍</div>
            <h4>No matching visitor records found</h4>
            <p>Try adjusting your search criteria or filter options.</p>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = visitors.map(v => `
      <tr>
        <td><span class="visitor-id-tag">${v.id}</span></td>
        <td>
          <div style="font-weight: 600;">${v.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${v.phone}</div>
        </td>
        <td>${v.phone}</td>
        <td>${v.purpose}</td>
        <td><span class="badge badge-dept">${v.department}</span></td>
        <td>${v.date}</td>
        <td><strong>${v.entryTime}</strong></td>
        <td>${v.exitTime ? `<strong>${v.exitTime}</strong>` : '<span style="color: #94a3b8;">--</span>'}</td>
        <td>
          <span class="badge ${v.status === 'Inside Campus' ? 'badge-inside' : 'badge-exited'}">
            ${v.status}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <a href="visitor-pass.html?id=${v.id}" class="btn btn-secondary btn-sm" title="View Pass">Pass</a>
            <a href="visitor-details.html?id=${v.id}" class="btn btn-secondary btn-sm" title="Details">Details</a>
            ${v.status === 'Inside Campus'
              ? `<button onclick="VisitorController.quickMarkExit('${v.id}')" class="btn btn-danger btn-sm" title="Mark Exit">Exit</button>`
              : `<button onclick="VisitorController.quickMarkInside('${v.id}')" class="btn btn-success btn-sm" title="Mark Entry">Entry</button>`
            }
          </div>
        </td>
      </tr>
    `).join('');
  },

  setupRecordFilters() {
    const searchInput = document.getElementById('recordSearchInput');
    const deptFilter = document.getElementById('recordDeptFilter');
    const statusFilter = document.getElementById('recordStatusFilter');
    const dateFilter = document.getElementById('recordDateFilter');
    const exportBtn = document.getElementById('btnExportCSV');

    if (searchInput) searchInput.addEventListener('input', () => this.renderRecordsTable());
    if (deptFilter) deptFilter.addEventListener('change', () => this.renderRecordsTable());
    if (statusFilter) statusFilter.addEventListener('change', () => this.renderRecordsTable());
    if (dateFilter) dateFilter.addEventListener('change', () => this.renderRecordsTable());

    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportRecordsCSV());
    }
  },

  async exportRecordsCSV() {
    const visitors = await VisitorService.getVisitors();
    if (visitors.length === 0) {
      App.showToast('No records available to export.', 'warning');
      return;
    }

    const headers = ['Visitor ID', 'Name', 'Phone', 'Email', 'Purpose', 'Department', 'Host Name', 'Date', 'Entry Time', 'Exit Time', 'Status', 'Vehicle No'];
    const rows = visitors.map(v => [
      `"${v.id}"`,
      `"${v.name}"`,
      `"${v.phone}"`,
      `"${v.email || ''}"`,
      `"${v.purpose}"`,
      `"${v.department}"`,
      `"${v.hostName}"`,
      `"${v.date}"`,
      `"${v.entryTime}"`,
      `"${v.exitTime || ''}"`,
      `"${v.status}"`,
      `"${v.vehicleNo || 'None'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_visitors_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    App.showToast('Visitor records exported to CSV successfully!', 'success');
  },

  // --------------------------------------------------------------------------
  // 5. VISITOR DETAILS PAGE LOGIC
  // --------------------------------------------------------------------------
  async initVisitorDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const visitorId = urlParams.get('id');

    let visitor = null;
    if (visitorId) {
      visitor = await VisitorService.getVisitorById(visitorId);
    }

    if (!visitor) {
      const visitors = await VisitorService.getVisitors();
      visitor = visitors.length > 0 ? visitors[0] : null;
    }

    if (!visitor) {
      document.querySelector('.app-content').innerHTML = `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3>Visitor Not Found</h3>
          <p style="color: var(--text-muted); margin: 10px 0 20px 0;">The requested visitor record could not be loaded from Firestore.</p>
          <a href="visitors.html" class="btn btn-primary">Back to Visitors List</a>
        </div>
      `;
      return;
    }

    this.renderFullVisitorDetails(visitor);
  },

  renderFullVisitorDetails(v) {
    document.getElementById('detailName').textContent = v.name;
    document.getElementById('detailId').textContent = v.id;
    document.getElementById('detailPurposeTag').textContent = v.purpose;
    document.getElementById('detailPhone').textContent = v.phone;
    document.getElementById('detailEmail').textContent = v.email || 'Not Provided';
    document.getElementById('detailIdProof').textContent = `${v.idType}: ${v.idNumber}`;
    document.getElementById('detailDepartment').textContent = v.department;
    document.getElementById('detailHostName').textContent = v.hostName;
    document.getElementById('detailDate').textContent = v.date;
    document.getElementById('detailEntryTime').textContent = v.entryTime;
    document.getElementById('detailExitTime').textContent = v.exitTime || 'Still inside campus';
    document.getElementById('detailVehicleNo').textContent = v.vehicleNo || 'None';
    document.getElementById('detailBelongings').textContent = v.belongings || 'None';
    document.getElementById('detailNotes').textContent = v.notes || 'No remarks recorded.';

    const statusBadge = document.getElementById('detailStatusBadge');
    if (statusBadge) {
      statusBadge.className = `badge ${v.status === 'Inside Campus' ? 'badge-inside' : 'badge-exited'}`;
      statusBadge.textContent = v.status;
    }

    const passLink = document.getElementById('btnDetailsViewPass');
    if (passLink) {
      passLink.href = `visitor-pass.html?id=${v.id}`;
    }

    const actionToggleBtn = document.getElementById('btnDetailsToggleStatus');
    if (actionToggleBtn) {
      if (v.status === 'Inside Campus') {
        actionToggleBtn.className = 'btn btn-danger';
        actionToggleBtn.textContent = '🚪 Mark Visitor Exit';
        actionToggleBtn.onclick = async () => {
          await VisitorService.updateVisitorStatus(v.id, 'Exited');
          App.showToast('Visitor marked as Exited.', 'success');
          window.location.reload();
        };
      } else {
        actionToggleBtn.className = 'btn btn-success';
        actionToggleBtn.textContent = '↩️ Mark Re-Entry';
        actionToggleBtn.onclick = async () => {
          await VisitorService.updateVisitorStatus(v.id, 'Inside Campus');
          App.showToast('Visitor marked Inside Campus.', 'success');
          window.location.reload();
        };
      }
    }
  },

  // --------------------------------------------------------------------------
  // 6. GATE ENTRY / EXIT CONSOLE LOGIC
  // --------------------------------------------------------------------------
  async initGateConsole() {
    await this.renderGateConsole();
    
    const searchInput = document.getElementById('gateSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderGateConsole());
    }

    // Subscribe to live changes
    if (typeof VisitorService !== 'undefined' && FirebaseApp.isLive) {
      VisitorService.listenToVisitors(() => {
        this.renderGateConsole();
      });
    }
  },

  async renderGateConsole() {
    const insideListEl = document.getElementById('gateInsideList');
    const pendingListEl = document.getElementById('gatePendingList');
    const insideCountEl = document.getElementById('gateInsideCount');
    const exitedCountEl = document.getElementById('gateExitedCount');

    if (!insideListEl || !pendingListEl) return;

    const searchTerm = (document.getElementById('gateSearchInput')?.value || '').toLowerCase().trim();
    let visitors = await VisitorService.getVisitors();

    if (searchTerm) {
      visitors = visitors.filter(v => 
        (v.name || '').toLowerCase().includes(searchTerm) || 
        (v.id || '').toLowerCase().includes(searchTerm) || 
        (v.phone || '').includes(searchTerm)
      );
    }

    const insideVisitors = visitors.filter(v => v.status === 'Inside Campus');
    const exitedVisitors = visitors.filter(v => v.status === 'Exited');

    if (insideCountEl) insideCountEl.textContent = insideVisitors.length;
    if (exitedCountEl) exitedCountEl.textContent = exitedVisitors.length;

    // Render Inside Campus list
    if (insideVisitors.length === 0) {
      insideListEl.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No visitors currently inside campus.</div>`;
    } else {
      insideListEl.innerHTML = insideVisitors.map(v => `
        <div class="gate-list-item">
          <div class="gate-item-info">
            <div class="gate-item-name">${v.name} <span class="visitor-id-tag">${v.id}</span></div>
            <div class="gate-item-meta">
              <span>🏢 ${v.department}</span> • 
              <span>👤 Host: ${v.hostName}</span> • 
              <span>⏰ In: ${v.entryTime}</span>
            </div>
          </div>
          <div>
            <button onclick="VisitorController.quickMarkExit('${v.id}')" class="btn btn-danger btn-sm">
              Mark Exit 🚪
            </button>
          </div>
        </div>
      `).join('');
    }

    // Render Exited list
    if (exitedVisitors.length === 0) {
      pendingListEl.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">No exited records for this session.</div>`;
    } else {
      pendingListEl.innerHTML = exitedVisitors.map(v => `
        <div class="gate-list-item">
          <div class="gate-item-info">
            <div class="gate-item-name">${v.name} <span class="visitor-id-tag">${v.id}</span></div>
            <div class="gate-item-meta">
              <span>🏢 ${v.department}</span> • 
              <span>🚪 Out: ${v.exitTime || 'Recorded'}</span>
            </div>
          </div>
          <div>
            <button onclick="VisitorController.quickMarkInside('${v.id}')" class="btn btn-success btn-sm">
              Re-Entry ↩️
            </button>
          </div>
        </div>
      `).join('');
    }
  },

  // --------------------------------------------------------------------------
  // 7. NOTIFICATIONS PAGE LOGIC
  // --------------------------------------------------------------------------
  async initNotifications() {
    await this.renderNotificationsList();

    const btnMarkAll = document.getElementById('btnMarkAllRead');
    const btnClearAll = document.getElementById('btnClearAllNotifs');
    const filterSelect = document.getElementById('notifFilterSelect');

    if (btnMarkAll) {
      btnMarkAll.addEventListener('click', async () => {
        await VisitorService.markAllNotificationsRead();
        App.showToast('All notifications marked as read.', 'success');
        await this.renderNotificationsList();
        await App.updateNotificationBadges();
      });
    }

    if (btnClearAll) {
      btnClearAll.addEventListener('click', async () => {
        await VisitorService.clearAllNotifications();
        App.showToast('All notifications cleared.', 'info');
        await this.renderNotificationsList();
        await App.updateNotificationBadges();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', () => this.renderNotificationsList());
    }
  },

  async renderNotificationsList() {
    const listEl = document.getElementById('notificationsContainer');
    if (!listEl) return;

    const filterVal = document.getElementById('notifFilterSelect')?.value || 'ALL';
    let notifs = await VisitorService.getNotifications();

    if (filterVal === 'UNREAD') {
      notifs = notifs.filter(n => n.unread);
    }

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px;">
          <div style="font-size: 2.5rem; margin-bottom: 10px; opacity: 0.5;">🔔</div>
          <h4>No notifications to display</h4>
          <p style="color: var(--text-muted);">You're all caught up!</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div class="notification-card ${n.unread ? 'unread' : ''}">
        <div class="notification-icon ${n.type}">
          ${n.type === 'arrival' ? '👋' : (n.type === 'warning' ? '⚠️' : 'ℹ️')}
        </div>
        <div class="notification-content">
          <div class="notification-title">
            <span>${n.title}</span>
            ${n.unread ? '<span class="badge badge-inside" style="font-size: 0.65rem;">NEW</span>' : ''}
          </div>
          <div class="notification-message">${n.message}</div>
          <div class="notification-meta">
            <span>⏰ ${n.timestamp}</span>
            <span>🏛️ ${n.department}</span>
            ${n.visitorId ? `<span>🆔 <a href="visitor-pass.html?id=${n.visitorId}" style="font-weight: 600;">${n.visitorId}</a></span>` : ''}
          </div>
        </div>
        <div>
          ${n.unread ? `<button onclick="VisitorController.markOneRead('${n.id || n.docId}')" class="btn btn-secondary btn-sm" title="Mark Read">✓</button>` : ''}
        </div>
      </div>
    `).join('');
  },

  async markOneRead(id) {
    await VisitorService.markNotificationRead(id);
    await this.renderNotificationsList();
    await App.updateNotificationBadges();
  },

  // --------------------------------------------------------------------------
  // 8. VISITOR HISTORY PAGE LOGIC
  // --------------------------------------------------------------------------
  async initHistory() {
    await this.renderHistoryTable();
    this.setupHistoryFilters();
  },

  async renderHistoryTable() {
    const tableBody = document.getElementById('historyTableBody');
    const totalPastEl = document.getElementById('historyTotalPast');
    const searchInput = document.getElementById('historySearchInput');
    const deptFilter = document.getElementById('historyDeptFilter');

    if (!tableBody) return;

    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const deptVal = deptFilter?.value || 'ALL';

    let records = await VisitorService.getVisitors();

    if (deptVal !== 'ALL') {
      records = records.filter(r => r.department === deptVal);
    }

    if (searchTerm) {
      records = records.filter(r => 
        (r.name || '').toLowerCase().includes(searchTerm) ||
        (r.id || '').toLowerCase().includes(searchTerm) ||
        (r.hostName || '').toLowerCase().includes(searchTerm) ||
        (r.purpose || '').toLowerCase().includes(searchTerm)
      );
    }

    if (totalPastEl) {
      totalPastEl.textContent = records.length;
    }

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="8" class="table-empty-state">No historical visitor logs found matching your filters.</td></tr>`;
      return;
    }

    tableBody.innerHTML = records.map(r => `
      <tr>
        <td><strong>${r.date}</strong></td>
        <td><span class="visitor-id-tag">${r.id}</span></td>
        <td>
          <div style="font-weight: 600;">${r.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${r.phone}</div>
        </td>
        <td><span class="badge badge-dept">${r.department}</span></td>
        <td>${r.purpose}</td>
        <td>${r.entryTime}</td>
        <td>${r.exitTime || 'Ongoing'}</td>
        <td>
          <span class="badge ${r.status === 'Inside Campus' ? 'badge-inside' : 'badge-exited'}">
            ${r.status}
          </span>
        </td>
      </tr>
    `).join('');
  },

  setupHistoryFilters() {
    const searchInput = document.getElementById('historySearchInput');
    const deptFilter = document.getElementById('historyDeptFilter');
    const exportBtn = document.getElementById('btnExportHistoryCSV');

    if (searchInput) searchInput.addEventListener('input', () => this.renderHistoryTable());
    if (deptFilter) deptFilter.addEventListener('change', () => this.renderHistoryTable());
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportRecordsCSV());
  },

  // --------------------------------------------------------------------------
  // 9. PROFILE & SETTINGS PAGE LOGIC
  // --------------------------------------------------------------------------
  async initProfile() {
    const user = await VisitorService.getUserProfile();
    
    const nameInput = document.getElementById('profName');
    const roleInput = document.getElementById('profRole');
    const emailInput = document.getElementById('profEmail');
    const phoneInput = document.getElementById('profPhone');
    const campusInput = document.getElementById('profCampus');
    const shiftInput = document.getElementById('profShift');
    const form = document.getElementById('userProfileForm');
    const btnResetData = document.getElementById('btnResetDefaultData');

    if (nameInput) nameInput.value = user.name || '';
    if (roleInput) roleInput.value = user.role || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (campusInput) campusInput.value = user.campus || '';
    if (shiftInput) shiftInput.value = user.shift || '';

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updated = await VisitorService.updateUserProfile({
          name: nameInput.value,
          role: roleInput.value,
          email: emailInput.value,
          phone: phoneInput.value,
          campus: campusInput.value,
          shift: shiftInput.value
        });
        await App.bindUserProfile();
        App.showToast('Profile updated in Firestore successfully!', 'success');
      });
    }

    if (btnResetData) {
      btnResetData.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all visitor data and notifications to default?')) {
          DataStore.resetAll();
          if (FirebaseApp.isLive) {
            await VisitorService.seedDefaultData();
          }
          App.showToast('Default demo records restored successfully.', 'success');
          setTimeout(() => window.location.reload(), 1000);
        }
      });
    }
  }
};

// Helper: Convert 24-hour time "14:30" to "02:30 PM"
function formatInputTime(timeStr) {
  if (!timeStr) return formatCurrentTime();
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}
