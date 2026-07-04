// Auth Guard - Protects dashboard and admin pages
// Redirects unauthenticated users to login

import { auth, onAuthStateChanged, doc, getDoc, db, serverTimestamp } from './firebase-config.js';

const ADMIN_EMAILS = ['admin@vorqeil.com', 'vorqeil.admin@gmail.com'];

async function ensureUserDocument(user) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || 'Learner',
            email: user.email,
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            enrolledCourses: [],
            completedCourses: [],
            certificates: [],
            paymentHistory: [],
            role: ADMIN_EMAILS.includes(user.email) ? 'admin' : 'student',
            lastLogin: serverTimestamp(),
            totalLearningHours: 0,
            weeklyActivity: {},
            notifications: []
        });
    } else {
        await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
            name: user.displayName || snap.data().name,
            photoURL: user.photoURL || snap.data().photoURL,
        }).catch(() => {});
    }
    return snap.exists() ? snap.data() : null;
}

// Check auth state on page load
onAuthStateChanged(auth, async (user) => {
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('admin.html');
    const isDashboardPage = currentPath.includes('dashboard.html');

    if (user) {
        // User is signed in
        const userData = await ensureUserDocument(user);
        window.currentUser = user;
        window.userData = userData;
        window.isAdmin = ADMIN_EMAILS.includes(user.email);

        // If on admin page but not admin, redirect to dashboard
        if (isAdminPage && !window.isAdmin) {
            window.location.href = 'dashboard.html';
            return;
        }

        // If on admin page and is admin, let them stay
        if (isAdminPage && window.isAdmin) {
            document.body.classList.add('authenticated', 'admin-authenticated');
            if (window.initAdminPanel) window.initAdminPanel();
            return;
        }

        // If on dashboard page, let them stay
        if (isDashboardPage) {
            document.body.classList.add('authenticated');
            if (window.initDashboard) window.initDashboard();
            return;
        }

        // If on index page and logged in, optionally redirect
        // Uncomment below to auto-redirect from landing to dashboard:
        // if (!isAdminPage && !isDashboardPage) {
        //     window.location.href = window.isAdmin ? 'admin.html' : 'dashboard.html';
        // }
    } else {
        // User is signed out
        window.currentUser = null;
        window.userData = null;
        window.isAdmin = false;

        // If on protected page, redirect to index
        if (isDashboardPage || isAdminPage) {
            window.location.href = 'index.html';
        }
    }
});

export { ensureUserDocument, ADMIN_EMAILS };