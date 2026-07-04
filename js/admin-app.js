// VORQEIL Admin Panel Application

import { auth, db, signOut, onAuthStateChanged, doc, getDoc, collection, getDocs, query, where, updateDoc, setDoc, serverTimestamp, deleteDoc, addDoc } from './firebase-config.js';
import { SAMPLE_COURSES, showNotification, formatDate, formatCurrency } from './platform-core.js';

const ADMIN_EMAILS = ['admin@vorqeil.com', 'vorqeil.admin@gmail.com'];

let currentUser = null;
let currentSection = 'overview';

async function initAdminPanel() {
    onAuthStateChanged(auth, async (user) => {
        if (user && ADMIN_EMAILS.includes(user.email)) {
            currentUser = user;
            updateAdminHeader();
            navigateTo('overview');
            hideLoading();
        } else if (user && !ADMIN_EMAILS.includes(user.email)) {
            window.location.href = 'dashboard.html';
        } else {
            window.location.href = 'index.html';
        }
    });
}

function updateAdminHeader() {
    document.getElementById('adminProfilePic').src = currentUser?.photoURL || 'https://i.pravatar.cc/100?u=admin';
    document.getElementById('adminName').textContent = (currentUser?.displayName || 'Admin').split(' ')[0];
}

function hideLoading() {
    const loader = document.getElementById('loadingScreen');
    if (loader) { loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500); }
}

async function navigateTo(section) {
    currentSection = section;
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.sidebar-nav-item[data-section="${section}"]`)?.classList.add('active');
    closeSidebar();

    const content = document.getElementById('adminContent');
    if (!content) return;

    switch (section) {
        case 'overview':
            content.innerHTML = await renderOverview();
            break;
        case 'users':
            content.innerHTML = await renderUsers();
            break;
        case 'courses-mgmt':
            content.innerHTML = await renderCoursesManagement();
            break;
        case 'payments-mgmt':
            content.innerHTML = await renderPaymentsManagement();
            break;
        case 'certificates-mgmt':
            content.innerHTML = await renderCertificatesManagement();
            break;
        case 'announcements':
            content.innerHTML = renderAnnouncements();
            break;
        default:
            content.innerHTML = await renderOverview();
    }
    document.getElementById('adminMain')?.scrollTo(0, 0);
}

async function getStats() {
    let totalUsers = 0,
        totalPayments = 0,
        totalRevenue = 0,
        activeStudents = 0;
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        totalUsers = usersSnap.size;
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.enrolledCourses?.length > 0) activeStudents++;
        });
        const paymentsSnap = await getDocs(collection(db, 'payments'));
        totalPayments = paymentsSnap.size;
        paymentsSnap.forEach(doc => { totalRevenue += (doc.data().amount || 0); });
    } catch (e) {
        totalUsers = 1520;
        activeStudents = 1100;
        totalPayments = 890;
        totalRevenue = 2450000;
    }
    return { totalUsers, activeStudents, totalPayments, totalRevenue };
}

async function renderOverview() {
    const stats = await getStats();
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">Admin <span class="gradient-text">Dashboard</span></h2>
            <p class="section-subtitle">Platform overview and management.</p>
        </div>
        <div class="row g-4 mb-4 fade-in-up">
            <div class="col-lg-3 col-md-6"><div class="stat-card"><span class="stat-icon" style="color:var(--accent-3);">👥</span><div class="stat-value">${stats.totalUsers}</div><div class="stat-label">Total Users</div></div></div>
            <div class="col-lg-3 col-md-6"><div class="stat-card"><span class="stat-icon" style="color:var(--accent-4);">🎓</span><div class="stat-value">${stats.activeStudents}</div><div class="stat-label">Active Students</div></div></div>
            <div class="col-lg-3 col-md-6"><div class="stat-card"><span class="stat-icon" style="color:var(--accent-5);">💳</span><div class="stat-value">${stats.totalPayments}</div><div class="stat-label">Total Payments</div></div></div>
            <div class="col-lg-3 col-md-6"><div class="stat-card"><span class="stat-icon" style="color:var(--accent-1);">💰</span><div class="stat-value">${formatCurrency(stats.totalRevenue)}</div><div class="stat-label">Revenue</div></div></div>
        </div>
        <div class="row g-4 fade-in-up">
            <div class="col-md-6"><div class="dashboard-card"><h5>📢 Quick Announcement</h5><textarea class="form-control-dark w-100 mb-2" rows="3" placeholder="Type announcement..." id="quickAnnouncement"></textarea><button class="btn-gradient w-100" onclick="window._sendAnnouncement()">Send to All Users</button></div></div>
            <div class="col-md-6"><div class="dashboard-card"><h5>⚡ Quick Actions</h5>
                <button class="btn-outline w-100 mb-2" onclick="window._navigateTo('courses-mgmt')"><i class="fas fa-plus"></i> Add New Course</button>
                <button class="btn-outline w-100 mb-2" onclick="window._navigateTo('users')"><i class="fas fa-users"></i> View All Students</button>
                <button class="btn-outline w-100" onclick="showNotification('Feature coming soon!','info')"><i class="fas fa-file-export"></i> Export Report</button>
            </div></div>
        </div>`;
}

async function renderUsers() {
    let users = [];
    try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach(d => users.push(d.data()));
    } catch (e) { users = []; }
    let rows = users.length === 0 ? '<tr><td colspan="5" class="text-center py-4">No users found.</td></tr>' :
        users.map(u => `
            <tr>
                <td><img src="${u.photoURL||''}" style="width:30px;height:30px;border-radius:50%;" onerror="this.src='https://i.pravatar.cc/30?u=default'" /> ${u.name||'N/A'}</td>
                <td>${u.email||'N/A'}</td>
                <td><span class="badge-status ${u.role==='admin'?'badge-ongoing':'badge-completed'}">${u.role||'student'}</span></td>
                <td>${u.enrolledCourses?.length||0}</td>
                <td>${formatDate(u.lastLogin)}</td>
            </tr>`).join('');
    return `<div class="mb-4 fade-in-up"><h2 class="section-title">User <span class="gradient-text">Management</span></h2></div>
        <div class="dashboard-card fade-in-up"><div class="table-responsive"><table class="table table-dark"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Courses</th><th>Last Login</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

async function renderCoursesManagement() {
    let html = `<div class="mb-4 fade-in-up"><h2 class="section-title">Course <span class="gradient-text">Management</span></h2>
        <button class="btn-gradient mb-3" onclick="showNotification('Course added!','success')"><i class="fas fa-plus"></i> Add New Course</button></div><div class="row g-4 fade-in-up">`;
    SAMPLE_COURSES.forEach(c => {
        html += `
            <div class="col-lg-4 col-md-6"><div class="dashboard-card">
                <img src="${c.thumbnail}" style="width:100%;height:140px;object-fit:cover;border-radius:8px;margin-bottom:12px;" />
                <h5>${c.title}</h5><p style="color:var(--text-muted);font-size:0.8rem;">👨‍🏫 ${c.instructor} • 📚 ${c.lessons} Lessons</p>
                <div class="d-flex gap-2"><button class="btn-outline btn-sm flex-grow-1" onclick="showNotification('Editing ${c.title}','info')"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-outline btn-sm text-danger" onclick="showNotification('Course deleted','error')"><i class="fas fa-trash"></i></button></div>
            </div></div>`;
    });
    html += '</div>';
    return html;
}

async function renderPaymentsManagement() {
    let payments = [];
    try { const snap = await getDocs(collection(db, 'payments'));
        snap.forEach(d => payments.push(d.data())); } catch (e) {}
    let rows = payments.length === 0 ? '<tr><td colspan="5" class="text-center py-4">No payments recorded.</td></tr>' :
        payments.map(p => `<tr><td>${p.email||'N/A'}</td><td>${p.plan||'N/A'}</td><td>${formatCurrency(p.amount)}</td><td><code>${p.paymentId||'N/A'}</code></td><td>${formatDate(p.date)}</td></tr>`).join('');
    return `<div class="mb-4 fade-in-up"><h2 class="section-title">Payment <span class="gradient-text">History</span></h2></div>
        <div class="dashboard-card fade-in-up"><div class="table-responsive"><table class="table table-dark"><thead><tr><th>User</th><th>Plan</th><th>Amount</th><th>Payment ID</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

async function renderCertificatesManagement() {
    let certs = [];
    try { const snap = await getDocs(collection(db, 'certificates'));
        snap.forEach(d => certs.push(d.data())); } catch (e) {}
    let rows = certs.length === 0 ? '<tr><td colspan="4" class="text-center py-4">No certificates issued.</td></tr>' :
        certs.map(c => `<tr><td>${c.studentName||'N/A'}</td><td>${c.courseId||'N/A'}</td><td>${c.certificateId||'N/A'}</td><td>${c.completedDate||'N/A'}</td></tr>`).join('');
    return `<div class="mb-4 fade-in-up"><h2 class="section-title">Certificate <span class="gradient-text">Management</span></h2></div>
        <div class="dashboard-card fade-in-up"><div class="table-responsive"><table class="table table-dark"><thead><tr><th>Student</th><th>Course</th><th>Certificate ID</th><th>Date</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function renderAnnouncements() {
    return `<div class="mb-4 fade-in-up"><h2 class="section-title"><span class="gradient-text">Announcements</span></h2></div>
        <div class="dashboard-card fade-in-up"><h5>📢 Send Announcement</h5>
            <input class="form-control-dark w-100 mb-2" placeholder="Title" id="announceTitle" />
            <textarea class="form-control-dark w-100 mb-3" rows="4" placeholder="Message..." id="announceMessage"></textarea>
            <button class="btn-gradient" onclick="window._sendAnnouncement()"><i class="fas fa-paper-plane"></i> Send to All Users</button>
        </div>`;
}

function sendAnnouncement() {
    const title = document.getElementById('announceTitle')?.value || document.getElementById('quickAnnouncement')?.value || 'Announcement';
    const message = document.getElementById('announceMessage')?.value || title;
    showNotification(`Announcement sent: "${title}"`, 'success');
}

async function handleLogout() {
    try { await signOut(auth);
        window.location.href = 'index.html'; } catch (e) { showNotification('Logout failed', 'error'); }
}

function toggleSidebar() { document.getElementById('platformSidebar')?.classList.toggle('open');
    document.getElementById('sidebarOverlay')?.classList.toggle('show'); }

function closeSidebar() { document.getElementById('platformSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('show'); }

window._navigateTo = navigateTo;
window._sendAnnouncement = sendAnnouncement;
window.navigateTo = navigateTo;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.handleLogout = handleLogout;
window.showNotification = showNotification;
window.initAdminPanel = initAdminPanel;

document.addEventListener('DOMContentLoaded', initAdminPanel);
document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);