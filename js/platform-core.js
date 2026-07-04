// Platform Core - Shared utilities for dashboard and admin

import { db, doc, getDoc, updateDoc, setDoc, serverTimestamp, arrayUnion, increment, collection, getDocs, query, where } from './firebase-config.js';

// Course definitions
const SAMPLE_COURSES = [
    {
        id: 'ai-fundamentals',
        title: 'AI Fundamentals',
        instructor: 'Dr. Arjun Mehta',
        thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop',
        lessons: 24,
        category: 'Technology',
        description: 'Master the basics of Artificial Intelligence, Machine Learning, and Neural Networks.',
        price: 4999,
        duration: '12 Weeks'
    },
    {
        id: 'digital-marketing-mastery',
        title: 'Digital Marketing Mastery',
        instructor: 'Priya Sharma',
        thumbnail: 'https://images.unsplash.com/photo-1432888622747-f792d6fd3b3f?w=500&h=300&fit=crop',
        lessons: 30,
        category: 'Marketing',
        description: 'Complete guide to SEO, SEM, Social Media Marketing, and Content Strategy.',
        price: 5999,
        duration: '14 Weeks'
    },
    {
        id: 'entrepreneurship-blueprint',
        title: 'Entrepreneurship Blueprint',
        instructor: 'Vikram Singh',
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&h=300&fit=crop',
        lessons: 20,
        category: 'Business',
        description: 'Build and scale your startup with proven frameworks and strategies.',
        price: 6999,
        duration: '10 Weeks'
    },
    {
        id: 'web-development-bootcamp',
        title: 'Web Development Bootcamp',
        instructor: 'Rahul Verma',
        thumbnail: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&h=300&fit=crop',
        lessons: 36,
        category: 'Technology',
        description: 'Full-stack web development with HTML, CSS, JavaScript, React, and Node.js.',
        price: 8999,
        duration: '16 Weeks'
    },
    {
        id: 'social-media-growth',
        title: 'Social Media Growth',
        instructor: 'Ananya Patel',
        thumbnail: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=500&h=300&fit=crop',
        lessons: 18,
        category: 'Marketing',
        description: 'Grow your social media presence and monetize your audience effectively.',
        price: 3999,
        duration: '8 Weeks'
    },
    {
        id: 'personal-branding',
        title: 'Personal Branding',
        instructor: 'Mantasha Ahmed',
        thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=300&fit=crop',
        lessons: 15,
        category: 'Business',
        description: 'Build a powerful personal brand that attracts opportunities and clients.',
        price: 3499,
        duration: '6 Weeks'
    },
    {
        id: 'facebook-ads-pro',
        title: 'Facebook Ads Pro',
        instructor: 'Karan Joshi',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
        lessons: 22,
        category: 'Marketing',
        description: 'Master Facebook & Instagram advertising with advanced targeting strategies.',
        price: 5499,
        duration: '10 Weeks'
    },
    {
        id: 'copywriting-converts',
        title: 'Copywriting That Converts',
        instructor: 'Neha Gupta',
        thumbnail: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&h=300&fit=crop',
        lessons: 16,
        category: 'Marketing',
        description: 'Write compelling copy that drives sales, engagement, and brand loyalty.',
        price: 4499,
        duration: '8 Weeks'
    },
    {
        id: 'stock-market-basics',
        title: 'Stock Market Basics',
        instructor: 'Rajesh Kumar',
        thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f0e4?w=500&h=300&fit=crop',
        lessons: 20,
        category: 'Finance',
        description: 'Understand stock markets, trading strategies, and investment fundamentals.',
        price: 4999,
        duration: '10 Weeks'
    },
    {
        id: 'python-for-beginners',
        title: 'Python for Beginners',
        instructor: 'Sneha Iyer',
        thumbnail: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&h=300&fit=crop',
        lessons: 28,
        category: 'Technology',
        description: 'Learn Python programming from scratch with hands-on projects.',
        price: 5999,
        duration: '12 Weeks'
    },
    {
        id: 'vfx-motion-graphics',
        title: 'VFX & Motion Graphics',
        instructor: 'Arjun Nair',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&h=300&fit=crop',
        lessons: 32,
        category: 'Creative',
        description: 'Create stunning visual effects and motion graphics for film and digital media.',
        price: 7999,
        duration: '14 Weeks'
    },
    {
        id: 'dropshipping-mastery',
        title: 'Dropshipping Mastery',
        instructor: 'Amit Bansal',
        thumbnail: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=500&h=300&fit=crop',
        lessons: 18,
        category: 'Business',
        description: 'Build a profitable dropshipping business from scratch with zero inventory.',
        price: 5499,
        duration: '8 Weeks'
    }
];

// Get course progress from Firestore
async function getCourseProgress(courseId) {
    if (!window.currentUser) return 0;
    const progressRef = doc(db, 'progress', `${window.currentUser.uid}_${courseId}`);
    const snap = await getDoc(progressRef);
    return snap.exists() ? (snap.data().percentage || 0) : 0;
}

// Get all course progresses
async function getAllCourseProgresses(courseIds) {
    const progresses = {};
    for (const courseId of courseIds) {
        progresses[courseId] = await getCourseProgress(courseId);
    }
    return progresses;
}

// Generate certificate
async function generateCertificate(courseId) {
    if (!window.currentUser) return null;
    const certId = 'VORQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const certData = {
        courseId,
        certificateId: certId,
        completedDate: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
        earnedAt: new Date().toISOString(),
        studentName: window.currentUser.displayName || 'Learner',
        studentEmail: window.currentUser.email,
    };

    const userRef = doc(db, 'users', window.currentUser.uid);
    await updateDoc(userRef, {
        certificates: arrayUnion(certData),
        completedCourses: arrayUnion(courseId),
    }).catch(() => {});

    // Also save in certificates collection
    const certRef = doc(db, 'certificates', certId);
    await setDoc(certRef, {
        ...certData,
        uid: window.currentUser.uid,
        issuedAt: serverTimestamp(),
    }).catch(() => {});

    return certData;
}

// Download certificate as PDF
function downloadCertificatePDF(certData, courseTitle) {
    const certWindow = window.open('', '_blank', 'width=850,height=650');
    certWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>VORQEIL Certificate - ${courseTitle}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Georgia', 'Times New Roman', serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f0f2f5;
                    padding: 20px;
                }
                .certificate {
                    width: 780px;
                    padding: 60px 50px;
                    background: #ffffff;
                    border: 8px double #6366f1;
                    border-radius: 16px;
                    text-align: center;
                    position: relative;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                }
                .certificate::before {
                    content: '';
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    right: 15px;
                    bottom: 15px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    pointer-events: none;
                }
                .cert-header {
                    margin-bottom: 30px;
                }
                .cert-header h1 {
                    font-family: 'Georgia', serif;
                    font-size: 2.8rem;
                    font-weight: 900;
                    color: #1a1a2e;
                    letter-spacing: 3px;
                    margin: 0;
                }
                .cert-header .accent-line {
                    width: 100px;
                    height: 4px;
                    background: linear-gradient(90deg, #6366f1, #06b6d4);
                    margin: 10px auto;
                    border-radius: 2px;
                }
                .cert-body {
                    margin: 30px 0;
                    color: #334155;
                    font-size: 1.1rem;
                    line-height: 2;
                }
                .student-name {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: #6366f1;
                    margin: 15px 0;
                    font-family: 'Georgia', serif;
                    border-bottom: 2px solid #e2e8f0;
                    display: inline-block;
                    padding: 0 30px 10px;
                }
                .course-name {
                    font-size: 1.4rem;
                    font-weight: 600;
                    color: #06b6d4;
                    margin: 10px 0;
                }
                .cert-footer {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    padding: 0 40px;
                }
                .cert-footer .date {
                    text-align: left;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                .cert-footer .signature {
                    text-align: right;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                .cert-footer .signature .sig-line {
                    width: 180px;
                    height: 1px;
                    background: #94a3b8;
                    margin: 5px 0;
                }
                .cert-seal {
                    position: absolute;
                    top: 40px;
                    right: 50px;
                    width: 90px;
                    height: 90px;
                    border: 3px solid #06b6d4;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.65rem;
                    color: #06b6d4;
                    text-transform: uppercase;
                    text-align: center;
                    line-height: 1.3;
                    background: rgba(6, 182, 212, 0.03);
                    transform: rotate(-15deg);
                }
                .cert-id {
                    margin-top: 30px;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    letter-spacing: 1px;
                }
                .verification-badge {
                    display: inline-block;
                    background: #f0fdf4;
                    color: #10b981;
                    padding: 6px 16px;
                    border-radius: 50px;
                    font-size: 0.8rem;
                    margin-top: 10px;
                    border: 1px solid #bbf7d0;
                }
                @media print {
                    body { background: #fff; }
                    .certificate { box-shadow: none; border-color: #6366f1; }
                }
            </style>
        </head>
        <body>
            <div class="certificate">
                <div class="cert-seal">VORQEIL<br/>Verified<br/>Certificate</div>
                <div class="cert-header">
                    <h1>VORQEIL</h1>
                    <div class="accent-line"></div>
                    <p style="color:#6366f1;font-weight:600;letter-spacing:2px;margin-top:8px;">CERTIFICATE OF COMPLETION</p>
                </div>
                <div class="cert-body">
                    <p>This is to certify that</p>
                    <div class="student-name">${certData.studentName || window.currentUser?.displayName || 'Learner'}</div>
                    <p>has successfully completed the course</p>
                    <div class="course-name">${courseTitle}</div>
                    <p>with dedication and excellence</p>
                </div>
                <div class="cert-footer">
                    <div class="date">
                        <strong>Date of Completion</strong><br/>
                        ${certData.completedDate || new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div class="signature">
                        <div class="sig-line"></div>
                        <strong>VORQEIL Authority</strong><br/>
                        <small>MSME Certified Institution</small>
                    </div>
                </div>
                <div class="cert-id">
                    Certificate ID: ${certData.certificateId || 'VORQ-XXXX-XXXX'}<br/>
                    <span class="verification-badge">✓ Verified by VORQEIL</span>
                </div>
            </div>
            <script>
                window.onload = function() {
                    setTimeout(() => window.print(), 500);
                };
            <\/script>
        </body>
        </html>
    `);
    certWindow.document.close();
}

// Show notification toast
function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'notificationContainer';
        newContainer.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(newContainer);
        return showNotification(message, type, duration);
    }

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#06b6d4',
        warning: '#f59e0b'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: #111827;
        border: 1px solid ${colors[type] || colors.info};
        border-left: 4px solid ${colors[type] || colors.info};
        border-radius: 12px;
        padding: 14px 20px;
        color: #f1f5f9;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(20px);
    `;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color:${colors[type] || colors.info};font-size:1.1rem;"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Format currency
function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN');
}

export {
    SAMPLE_COURSES,
    getCourseProgress,
    getAllCourseProgresses,
    generateCertificate,
    downloadCertificatePDF,
    showNotification,
    formatDate,
    formatCurrency
};