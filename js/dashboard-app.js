// VORQEIL Student Dashboard Application

import { auth, db, signOut, onAuthStateChanged, doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion, increment, collection, getDocs, query, where } from './firebase-config.js';
import { SAMPLE_COURSES, getCourseProgress, getAllCourseProgresses, generateCertificate, downloadCertificatePDF, showNotification, formatDate, formatCurrency } from './platform-core.js';

// ============ GLOBAL STATE ============
let currentUser = null;
let userData = null;
let currentSection = 'overview';

// ============ INITIALIZATION ============
async function initDashboard() {
    // Auth state observer
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            updateHeaderUI();
            navigateTo('overview');
            hideLoading();
        } else {
            // Redirect to login
            window.location.href = 'index.html';
        }
    });
}

async function loadUserData() {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
        userData = snap.data();
    } else {
        // Create user document if doesn't exist
        userData = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Learner',
            email: currentUser.email,
            photoURL: currentUser.photoURL || '',
            createdAt: serverTimestamp(),
            enrolledCourses: [],
            completedCourses: [],
            certificates: [],
            paymentHistory: [],
            role: 'student',
            lastLogin: serverTimestamp(),
            totalLearningHours: 0,
            weeklyActivity: {},
            notifications: []
        };
        await setDoc(userRef, userData);
    }
    window.userData = userData;
}

function updateHeaderUI() {
    const pic = document.getElementById('headerProfilePic');
    const name = document.getElementById('headerProfileName');
    const welcome = document.getElementById('welcomeMessage');

    if (pic) pic.src = currentUser?.photoURL || 'https://i.pravatar.cc/100?u=default';
    if (name) name.textContent = (currentUser?.displayName || 'Learner').split(' ')[0];
    if (welcome) welcome.textContent = `Welcome, ${(currentUser?.displayName || 'Learner').split(' ')[0]}!`;
}

function hideLoading() {
    const loader = document.getElementById('loadingScreen');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
    }
}

// ============ NAVIGATION ============
async function navigateTo(section) {
    currentSection = section;
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.querySelector(`.sidebar-nav-item[data-section="${section}"]`);
    if (activeNav) activeNav.classList.add('active');

    const content = document.getElementById('dashboardContent');
    if (!content) return;

    // Close mobile sidebar
    closeSidebar();

    switch (section) {
        case 'overview':
            content.innerHTML = await renderOverview();
            break;
        case 'courses':
            content.innerHTML = await renderCourses();
            break;
        case 'progress':
            content.innerHTML = await renderProgress();
            break;
        case 'certificates':
            content.innerHTML = await renderCertificates();
            break;
        case 'assignments':
            content.innerHTML = renderAssignments();
            break;
        case 'classes':
            content.innerHTML = renderUpcomingClasses();
            break;
        case 'notifications':
            content.innerHTML = renderNotifications();
            break;
        case 'payments':
            content.innerHTML = await renderPayments();
            break;
        case 'profile':
            content.innerHTML = renderProfile();
            break;
        case 'settings':
            content.innerHTML = renderSettings();
            break;
        default:
            content.innerHTML = await renderOverview();
    }

    // Scroll to top
    document.getElementById('dashboardMain')?.scrollTo(0, 0);
}

// ============ RENDER FUNCTIONS ============
async function renderOverview() {
    const enrolledCount = userData?.enrolledCourses?.length || 0;
    const completedCount = userData?.completedCourses?.length || 0;
    const certCount = userData?.certificates?.length || 0;
    const learningHours = userData?.totalLearningHours || Math.floor(Math.random() * 40) + 10;

    const enrolledCourses = SAMPLE_COURSES.filter(c => userData?.enrolledCourses?.includes(c.id));
    const progresses = await getAllCourseProgresses(userData?.enrolledCourses || []);
    const avgProgress = enrolledCourses.length > 0
        ? Math.round(Object.values(progresses).reduce((a, b) => a + b, 0) / enrolledCourses.length)
        : 0;

    let courseCardsHTML = '';
    if (enrolledCourses.length === 0) {
        courseCardsHTML = `
            <div class="col-12">
                <div class="dashboard-card empty-state">
                    <i class="fas fa-book-open"></i>
                    <h4>No Courses Yet</h4>
                    <p>Start your learning journey today!</p>
                    <a href="index.html#packages" class="btn-gradient">Browse Packages</a>
                </div>
            </div>`;
    } else {
        for (const course of enrolledCourses.slice(0, 4)) {
            const progress = progresses[course.id] || 0;
            courseCardsHTML += `
                <div class="col-lg-3 col-md-6">
                    <div class="course-enrolled-card" onclick="window._navigateTo('courses')">
                        <div class="course-thumb">
                            <img src="${course.thumbnail}" alt="${course.title}" loading="lazy" />
                        </div>
                        <div class="course-info">
                            <h6 style="font-size:0.9rem;margin-bottom:4px;">${course.title}</h6>
                            <p style="color:var(--text-muted);font-size:0.75rem;margin-bottom:8px;">👨‍🏫 ${course.instructor}</p>
                            <div class="progress-bar-custom">
                                <div class="progress-bar-fill" style="width:${progress}%;"></div>
                            </div>
                            <small style="color:var(--accent-3);">${progress}% complete</small>
                        </div>
                    </div>
                </div>`;
        }
    }

    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">Welcome back, <span class="gradient-text">${(currentUser?.displayName || 'Learner').split(' ')[0]}</span> 👋</h2>
            <p class="section-subtitle">Here's your learning overview. Keep up the great work!</p>
        </div>

        <!-- Stats Row -->
        <div class="row g-4 mb-4 fade-in-up">
            <div class="col-lg-3 col-md-6">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-3);">📚</span>
                    <div class="stat-value">${enrolledCount}</div>
                    <div class="stat-label">Enrolled Courses</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-4);">✅</span>
                    <div class="stat-value">${completedCount}</div>
                    <div class="stat-label">Completed</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-5);">📜</span>
                    <div class="stat-value">${certCount}</div>
                    <div class="stat-label">Certificates</div>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-1);">⏱️</span>
                    <div class="stat-value">${learningHours}h</div>
                    <div class="stat-label">Learning Hours</div>
                </div>
            </div>
        </div>

        <!-- Overall Progress -->
        <div class="dashboard-card mb-4 fade-in-up">
            <h5>📊 Overall Learning Progress</h5>
            <div class="progress-bar-custom" style="height:14px;">
                <div class="progress-bar-fill" style="width:${avgProgress}%;"></div>
            </div>
            <div class="d-flex justify-content-between mt-2">
                <span style="color:var(--accent-3);font-weight:600;">${avgProgress}% Complete</span>
                <span style="color:var(--text-muted);">${enrolledCourses.length} Active Courses</span>
            </div>
        </div>

        <!-- Continue Learning -->
        <h4 class="mb-3 fade-in-up">📖 Continue Learning</h4>
        <div class="row g-4 fade-in-up" id="overviewCourses">
            ${courseCardsHTML}
        </div>`;
}

async function renderCourses() {
    const enrolledCourses = SAMPLE_COURSES.filter(c => userData?.enrolledCourses?.includes(c.id));
    const progresses = await getAllCourseProgresses(userData?.enrolledCourses || []);

    let html = `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">My <span class="gradient-text">Courses</span></h2>
            <p class="section-subtitle">All your enrolled courses in one place.</p>
        </div>
        <div class="row g-4 fade-in-up">`;

    if (enrolledCourses.length === 0) {
        html += `
            <div class="col-12">
                <div class="dashboard-card empty-state">
                    <i class="fas fa-book-open"></i>
                    <h4>No Courses Enrolled</h4>
                    <p>Browse our packages and start learning today!</p>
                    <a href="index.html#packages" class="btn-gradient">Explore Packages</a>
                </div>
            </div>`;
    }

    for (const course of enrolledCourses) {
        const progress = progresses[course.id] || 0;
        const isCompleted = progress >= 100;
        const hasCertificate = (userData?.certificates || []).some(c => c.courseId === course.id);

        html += `
            <div class="col-lg-4 col-md-6">
                <div class="course-enrolled-card">
                    <div class="course-thumb">
                        <img src="${course.thumbnail}" alt="${course.title}" loading="lazy" />
                    </div>
                    <div class="course-info">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 style="font-size:1rem;">${course.title}</h5>
                            <span class="badge-status ${isCompleted ? 'badge-completed' : progress > 0 ? 'badge-ongoing' : 'badge-pending'}">
                                ${isCompleted ? 'Completed' : progress > 0 ? 'Ongoing' : 'New'}
                            </span>
                        </div>
                        <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:6px;">
                            👨‍🏫 ${course.instructor} • 📚 ${course.lessons} Lessons
                        </p>
                        <div class="progress-bar-custom">
                            <div class="progress-bar-fill ${isCompleted ? 'green' : ''}" style="width:${progress}%;"></div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span style="color:var(--accent-3);font-size:0.85rem;font-weight:600;">${progress}%</span>
                            ${hasCertificate ? '<span class="badge-status badge-completed"><i class="fas fa-certificate"></i> Certified</span>' : ''}
                        </div>
                        <div class="d-flex gap-2 mt-3">
                            <button class="btn-gradient btn-sm flex-grow-1" onclick="window._continueLearning('${course.id}')">
                                ${progress > 0 ? 'Continue' : 'Start'} Learning
                            </button>
                            ${isCompleted && !hasCertificate ? `
                                <button class="btn-outline btn-sm" onclick="window._generateCert('${course.id}')" title="Get Certificate">
                                    <i class="fas fa-certificate"></i>
                                </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>`;
    }

    html += '</div>';
    return html;
}

async function renderProgress() {
    const enrolledCourses = SAMPLE_COURSES.filter(c => userData?.enrolledCourses?.includes(c.id));
    const progresses = await getAllCourseProgresses(userData?.enrolledCourses || []);
    const totalProgress = Object.values(progresses).reduce((a, b) => a + b, 0);
    const avgProgress = enrolledCourses.length > 0 ? Math.round(totalProgress / enrolledCourses.length) : 0;

    let courseRows = '';
    for (const course of enrolledCourses) {
        const progress = progresses[course.id] || 0;
        courseRows += `
            <div class="d-flex align-items-center gap-3 mb-3 p-3" style="background:var(--bg-card);border-radius:var(--radius-sm);border:1px solid var(--border-subtle);">
                <img src="${course.thumbnail}" style="width:60px;height:45px;object-fit:cover;border-radius:8px;" loading="lazy" />
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;">${course.title}</strong>
                    <div class="progress-bar-custom" style="margin:4px 0;">
                        <div class="progress-bar-fill" style="width:${progress}%;"></div>
                    </div>
                </div>
                <span style="color:var(--accent-3);font-weight:700;font-size:0.9rem;">${progress}%</span>
            </div>`;
    }

    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">Learning <span class="gradient-text">Progress</span></h2>
            <p class="section-subtitle">Track your learning journey across all courses.</p>
        </div>
        <div class="row g-4 mb-4 fade-in-up">
            <div class="col-md-4">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-3);">📊</span>
                    <div class="stat-value">${avgProgress}%</div>
                    <div class="stat-label">Average Completion</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-4);">📚</span>
                    <div class="stat-value">${enrolledCourses.length}</div>
                    <div class="stat-label">Active Courses</div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="stat-card">
                    <span class="stat-icon" style="color:var(--accent-5);">🏆</span>
                    <div class="stat-value">${userData?.completedCourses?.length || 0}</div>
                    <div class="stat-label">Fully Completed</div>
                </div>
            </div>
        </div>
        <div class="dashboard-card fade-in-up">
            <h5 class="mb-3">📋 Course Breakdown</h5>
            ${courseRows || '<p style="color:var(--text-muted);text-align:center;padding:20px;">No courses enrolled yet. <a href="index.html#packages" style="color:var(--accent-3);">Start learning!</a></p>'}
        </div>`;
}

async function renderCertificates() {
    const certificates = userData?.certificates || [];
    const enrolledCourses = SAMPLE_COURSES.filter(c => userData?.enrolledCourses?.includes(c.id));
    const progresses = await getAllCourseProgresses(userData?.enrolledCourses || []);

    // Find completed courses without certificates
    const uncertified = enrolledCourses.filter(c => {
        const progress = progresses[c.id] || 0;
        const hasCert = certificates.some(cert => cert.courseId === c.id);
        return progress >= 100 && !hasCert;
    });

    let html = `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">My <span class="gradient-text">Certificates</span></h2>
            <p class="section-subtitle">Showcase your achievements with verified certificates.</p>
        </div>`;

    // Uncertified completed courses
    if (uncertified.length > 0) {
        html += `
            <div class="dashboard-card mb-4 fade-in-up" style="border-left:4px solid var(--accent-5);">
                <h5 class="mb-3">🎓 Ready for Certification</h5>
                <p style="color:var(--text-muted);margin-bottom:12px;">Complete these courses and generate your certificates:</p>
                <div class="row g-3">`;
        for (const course of uncertified) {
            html += `
                <div class="col-md-6">
                    <button class="btn-gradient w-100" onclick="window._generateCert('${course.id}')">
                        <i class="fas fa-certificate"></i> Generate: ${course.title}
                    </button>
                </div>`;
        }
        html += '</div></div>';
    }

    // Existing certificates
    html += '<div class="row g-4 fade-in-up">';
    if (certificates.length === 0 && uncertified.length === 0) {
        html += `
            <div class="col-12">
                <div class="dashboard-card empty-state">
                    <i class="fas fa-certificate"></i>
                    <h4>No Certificates Yet</h4>
                    <p>Complete a course to earn your first certificate!</p>
                </div>
            </div>`;
    }

    for (const cert of certificates) {
        const course = SAMPLE_COURSES.find(c => c.id === cert.courseId) || { title: cert.courseId || 'Course', thumbnail: '' };
        html += `
            <div class="col-lg-4 col-md-6">
                <div class="dashboard-card text-center">
                    <i class="fas fa-certificate" style="font-size:3rem;color:var(--accent-5);margin-bottom:12px;display:block;"></i>
                    <h5>${course.title}</h5>
                    <p style="color:var(--text-muted);font-size:0.8rem;">Completed: ${cert.completedDate || 'N/A'}</p>
                    <p style="color:var(--text-muted);font-size:0.7rem;">ID: ${cert.certificateId || 'N/A'}</p>
                    <button class="btn-gradient btn-sm mt-2 w-100" onclick="window._downloadCert('${cert.courseId}', '${course.title.replace(/'/g, "\\'")}')">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </div>
            </div>`;
    }
    html += '</div>';
    return html;
}

function renderAssignments() {
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">My <span class="gradient-text">Assignments</span></h2>
            <p class="section-subtitle">Stay on top of your coursework.</p>
        </div>
        <div class="row g-4 fade-in-up">
            <div class="col-md-6">
                <div class="dashboard-card">
                    <span class="badge-status badge-ongoing mb-2">Due in 3 days</span>
                    <h5>Digital Marketing Strategy Plan</h5>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Create a comprehensive marketing strategy for a brand of your choice.</p>
                    <button class="btn-gradient btn-sm" onclick="showNotification('Assignment submitted!','success')">Submit Assignment</button>
                </div>
            </div>
            <div class="col-md-6">
                <div class="dashboard-card">
                    <span class="badge-status badge-completed mb-2">Completed</span>
                    <h5>Facebook Ad Campaign Analysis</h5>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Analyze 3 successful ad campaigns and document your findings.</p>
                    <small style="color:var(--accent-4);">✓ Submitted on ${formatDate(new Date())}</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="dashboard-card">
                    <span class="badge-status badge-pending mb-2">Not Started</span>
                    <h5>Python Mini Project</h5>
                    <p style="color:var(--text-muted);font-size:0.85rem;">Build a simple CRUD application using Python and Flask.</p>
                    <button class="btn-gradient btn-sm" onclick="showNotification('Assignment started!','info')">Start Assignment</button>
                </div>
            </div>
        </div>`;
}

function renderUpcomingClasses() {
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">Upcoming <span class="gradient-text">Classes</span></h2>
            <p class="section-subtitle">Don't miss your live learning sessions.</p>
        </div>
        <div class="row g-4 fade-in-up">
            <div class="col-md-6">
                <div class="dashboard-card">
                    <div class="d-flex gap-3 align-items-center">
                        <div style="width:50px;height:50px;background:rgba(99,102,241,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-video" style="color:var(--accent-1);font-size:1.3rem;"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">Digital Marketing Live Q&A</h6>
                            <p style="color:var(--text-muted);font-size:0.8rem;margin:0;">📅 Tomorrow • 7:00 PM IST</p>
                            <small style="color:var(--accent-3);">Instructor: Priya Sharma</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="dashboard-card">
                    <div class="d-flex gap-3 align-items-center">
                        <div style="width:50px;height:50px;background:rgba(6,182,212,0.2);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                            <i class="fas fa-laptop-code" style="color:var(--accent-3);font-size:1.3rem;"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">Web Development Workshop</h6>
                            <p style="color:var(--text-muted);font-size:0.8rem;margin:0;">📅 Friday • 5:00 PM IST</p>
                            <small style="color:var(--accent-3);">Instructor: Rahul Verma</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderNotifications() {
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title"><span class="gradient-text">Notifications</span></h2>
            <p class="section-subtitle">Stay updated with your learning activities.</p>
        </div>
        <div class="fade-in-up">
            <div class="dashboard-card mb-3">
                <div class="d-flex gap-3">
                    <i class="fas fa-bell" style="color:var(--accent-3);font-size:1.3rem;margin-top:3px;"></i>
                    <div>
                        <h6>New Course Available: AI Fundamentals</h6>
                        <p style="color:var(--text-muted);font-size:0.85rem;">We've added a new course to your library. Start learning today!</p>
                        <small style="color:var(--text-muted);">2 hours ago</small>
                    </div>
                </div>
            </div>
            <div class="dashboard-card mb-3">
                <div class="d-flex gap-3">
                    <i class="fas fa-calendar" style="color:var(--accent-5);font-size:1.3rem;margin-top:3px;"></i>
                    <div>
                        <h6>Live Class Reminder: Digital Marketing</h6>
                        <p style="color:var(--text-muted);font-size:0.85rem;">Your live session with Priya Sharma starts in 1 hour.</p>
                        <small style="color:var(--text-muted);">Yesterday</small>
                    </div>
                </div>
            </div>
            <div class="dashboard-card mb-3">
                <div class="d-flex gap-3">
                    <i class="fas fa-certificate" style="color:var(--accent-4);font-size:1.3rem;margin-top:3px;"></i>
                    <div>
                        <h6>Certificate Earned!</h6>
                        <p style="color:var(--text-muted);font-size:0.85rem;">Congratulations! You've earned your certificate.</p>
                        <small style="color:var(--text-muted);">3 days ago</small>
                    </div>
                </div>
            </div>
        </div>`;
}

async function renderPayments() {
    const payments = userData?.paymentHistory || [];
    let rows = '';
    if (payments.length === 0) {
        rows = '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-muted);">No payment history yet.</td></tr>';
    } else {
        payments.forEach(p => {
            rows += `
                <tr>
                    <td>${p.plan || 'N/A'}</td>
                    <td>${formatCurrency(p.amount)}</td>
                    <td><code style="color:var(--accent-3);">${p.paymentId || 'N/A'}</code></td>
                    <td>${formatDate(p.date)}</td>
                </tr>`;
        });
    }

    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">Payment <span class="gradient-text">History</span></h2>
            <p class="section-subtitle">Your transaction records and invoices.</p>
        </div>
        <div class="dashboard-card fade-in-up">
            <div class="table-responsive">
                <table class="table table-dark mb-0">
                    <thead>
                        <tr>
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Payment ID</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

function renderProfile() {
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title">My <span class="gradient-text">Profile</span></h2>
        </div>
        <div class="dashboard-card fade-in-up">
            <div class="text-center mb-4">
                <img src="${currentUser?.photoURL || 'https://i.pravatar.cc/150?u=default'}"
                     style="width:100px;height:100px;border-radius:50%;border:3px solid var(--accent-3);object-fit:cover;" />
                <h4 class="mt-3">${currentUser?.displayName || 'Learner'}</h4>
                <p style="color:var(--text-muted);">${currentUser?.email || ''}</p>
            </div>
            <div class="row">
                <div class="col-md-6 mb-2"><strong>Full Name:</strong> ${currentUser?.displayName || 'N/A'}</div>
                <div class="col-md-6 mb-2"><strong>Email:</strong> ${currentUser?.email || 'N/A'}</div>
                <div class="col-md-6 mb-2"><strong>Role:</strong> Student</div>
                <div class="col-md-6 mb-2"><strong>Enrolled Courses:</strong> ${userData?.enrolledCourses?.length || 0}</div>
                <div class="col-md-6 mb-2"><strong>Certificates Earned:</strong> ${userData?.certificates?.length || 0}</div>
            </div>
        </div>`;
}

function renderSettings() {
    return `
        <div class="mb-4 fade-in-up">
            <h2 class="section-title"><span class="gradient-text">Settings</span></h2>
        </div>
        <div class="dashboard-card fade-in-up">
            <h5 class="mb-3">Account Settings</h5>
            <div class="mb-3">
                <label class="form-label" style="color:var(--text-secondary);">Display Name</label>
                <input type="text" class="form-control-dark w-100" value="${currentUser?.displayName || ''}" />
            </div>
            <div class="mb-3">
                <label class="form-label" style="color:var(--text-secondary);">Email Address</label>
                <input type="email" class="form-control-dark w-100" value="${currentUser?.email || ''}" disabled />
            </div>
            <button class="btn-gradient" onclick="showNotification('Settings saved!','success')">Save Changes</button>
        </div>`;
}

// ============ ACTIONS ============
async function continueLearning(courseId) {
    showNotification('Opening course: ' + courseId + '... 📚', 'info');
    // Update progress in Firestore
    const progressRef = doc(db, 'progress', `${currentUser.uid}_${courseId}`);
    const snap = await getDoc(progressRef);
    const currentProgress = snap.exists() ? (snap.data().percentage || 0) : 0;
    const newProgress = Math.min(currentProgress + 5, 100);

    await setDoc(progressRef, {
        uid: currentUser.uid,
        courseId,
        percentage: newProgress,
        lastAccessed: serverTimestamp(),
        updatedAt: serverTimestamp(),
    }, { merge: true });

    // If course completed, update user
    if (newProgress >= 100) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
            completedCourses: arrayUnion(courseId),
        }).catch(() => {});
        showNotification('🎉 Course completed! Generate your certificate now.', 'success');
    }

    // Reload data
    await loadUserData();
    navigateTo(currentSection);
}

async function handleGenerateCertificate(courseId) {
    const course = SAMPLE_COURSES.find(c => c.id === courseId);
    const certData = await generateCertificate(courseId);
    if (certData) {
        showNotification('Certificate generated successfully! 🎉', 'success');
        await loadUserData();
        navigateTo('certificates');
        // Ask to download
        setTimeout(() => {
            if (confirm('Certificate generated! Would you like to download it now?')) {
                downloadCertificatePDF(certData, course?.title || courseId);
            }
        }, 500);
    }
}

function handleDownloadCertificate(courseId, courseTitle) {
    const certData = (userData?.certificates || []).find(c => c.courseId === courseId);
    if (certData) {
        downloadCertificatePDF(certData, courseTitle);
    } else {
        showNotification('Certificate not found. Please generate it first.', 'warning');
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (e) {
        showNotification('Logout failed: ' + e.message, 'error');
    }
}

// ============ SIDEBAR ============
function toggleSidebar() {
    const sidebar = document.getElementById('platformSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('platformSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
}

// ============ GLOBAL EXPOSURES ============
window._navigateTo = navigateTo;
window._continueLearning = continueLearning;
window._generateCert = handleGenerateCertificate;
window._downloadCert = handleDownloadCertificate;
window.showNotification = showNotification;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.handleLogout = handleLogout;
window.navigateTo = navigateTo;
window.initDashboard = initDashboard;

// ============ START ============
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});

// Handle sidebar overlay click
document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);