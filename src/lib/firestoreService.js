/**
 * Firestore Service Layer
 * Centralized data access for Firebase Firestore
 */
import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

// ============================================
// COURSES & TOPICS
// ============================================

/**
 * Get all courses
 */
export async function getCourses() {
    const snapshot = await getDocs(collection(db, 'courses'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get a single course by ID
 */
export async function getCourse(courseId) {
    const docRef = doc(db, 'courses', courseId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Get topics for a course
 */
export async function getTopics(courseId) {
    const q = query(
        collection(db, 'topics'),
        where('courseId', '==', courseId),
        orderBy('orderIndex')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all topics
 */
export async function getAllTopics() {
    const snapshot = await getDocs(collection(db, 'topics'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// STUDY ITEMS
// ============================================

/**
 * Get items for a topic
 */
export async function getItems(topicId) {
    const q = query(
        collection(db, 'studyItems'),
        where('topicId', '==', topicId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all study items
 */
export async function getAllItems() {
    const snapshot = await getDocs(collection(db, 'studyItems'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Update a study item
 */
export async function updateItem(itemId, data) {
    const docRef = doc(db, 'studyItems', itemId);
    await updateDoc(docRef, data);
    return { id: itemId, ...data };
}

/**
 * Create a new study item
 */
export async function createItem(data) {
    const docRef = await addDoc(collection(db, 'studyItems'), {
        ...data,
        createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
}

// ============================================
// USER PROGRESS (SRS)
// ============================================

/**
 * Get user's progress for all items
 */
export async function getUserProgress(uid) {
    const snapshot = await getDocs(collection(db, `userProgress/${uid}/items`));
    const map = {};
    snapshot.docs.forEach(doc => {
        map[doc.id] = { id: doc.id, ...doc.data() };
    });
    return map;
}

/**
 * Update progress for a specific item
 */
export async function updateProgress(uid, itemId, data) {
    const docRef = doc(db, `userProgress/${uid}/items`, itemId);
    await setDoc(docRef, {
        ...data,
        lastReviewed: serverTimestamp()
    }, { merge: true });
}

/**
 * Get items due for review
 */
export async function getDueItems(uid) {
    const now = Timestamp.now();
    const q = query(
        collection(db, `userProgress/${uid}/items`),
        where('nextReview', '<=', now)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// STUDY SESSIONS
// ============================================

/**
 * Start a new study session
 */
export async function startSession(uid) {
    const docRef = await addDoc(collection(db, 'studySessions'), {
        userId: uid,
        startTime: serverTimestamp(),
        endTime: null,
        durationSeconds: 0
    });
    return { id: docRef.id };
}

/**
 * End a study session
 */
export async function endSession(sessionId, durationSeconds) {
    const docRef = doc(db, 'studySessions', sessionId);
    await updateDoc(docRef, {
        endTime: serverTimestamp(),
        durationSeconds
    });
}

/**
 * Log an item during a session
 */
export async function logSessionItem(sessionId, itemId, correct) {
    await addDoc(collection(db, `studySessions/${sessionId}/logs`), {
        itemId,
        correct,
        timestamp: serverTimestamp()
    });
}

/**
 * Get recent sessions for a user
 */
export async function getRecentSessions(uid, count = 10) {
    const q = query(
        collection(db, 'studySessions'),
        where('userId', '==', uid),
        orderBy('startTime', 'desc'),
        limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============================================
// USER PROFILE
// ============================================

/**
 * Get user profile
 */
export async function getUserProfile(uid) {
    const docRef = doc(db, 'users', uid);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

/**
 * Create or update user profile
 */
export async function setUserProfile(uid, data) {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
}

/**
 * Update user settings
 */
export async function updateUserSettings(uid, settings) {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, { settings });
}

// ============================================
// STATS & ANALYTICS
// ============================================

/**
 * Get stats summary for a user
 */
export async function getStatsSummary(uid) {
    const sessions = await getRecentSessions(uid, 100);

    const totalDuration = sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const totalSessions = sessions.length;

    // Calculate streak (simplified - counts consecutive days with sessions)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionDates = sessions
        .filter(s => s.startTime)
        .map(s => {
            const date = s.startTime.toDate ? s.startTime.toDate() : new Date(s.startTime);
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        });

    const uniqueDates = [...new Set(sessionDates)].sort((a, b) => b - a);

    for (let i = 0; i < uniqueDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        if (uniqueDates[i] === expectedDate.getTime()) {
            currentStreak++;
        } else {
            break;
        }
    }

    return {
        totalDuration,
        totalSessions,
        currentStreak,
        recentActivity: sessions.slice(0, 5).map(s => ({
            id: s.id,
            date: s.startTime?.toDate?.()?.toLocaleDateString() || 'Unknown',
            duration: Math.floor((s.durationSeconds || 0) / 60)
        }))
    };
}

export default {
    getCourses,
    getCourse,
    getTopics,
    getAllTopics,
    getItems,
    getAllItems,
    updateItem,
    createItem,
    getUserProgress,
    updateProgress,
    getDueItems,
    startSession,
    endSession,
    logSessionItem,
    getRecentSessions,
    getUserProfile,
    setUserProfile,
    updateUserSettings,
    getStatsSummary
};


