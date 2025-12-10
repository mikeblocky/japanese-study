/**
 * Data Migration Script
 * Migrates data from Spring Boot H2 backend to Firebase Firestore
 * 
 * Usage: Run this once from browser console or as a React component
 */

import { db } from './firebase';
import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import API_BASE from './api';

const API_URL = `${API_BASE}/api`;

/**
 * Test Firestore Connection
 */
export async function testFirestoreConnection() {
    try {
        await setDoc(doc(db, 'test_collection', 'connection_test'), {
            timestamp: serverTimestamp(),
            status: 'connected'
        });
        console.log('✅ Firestore connection test successful');
        return true;
    } catch (error) {
        console.error('❌ Firestore connection test failed:', error);
        return false;
    }
}

/**
 * Migrate all data from H2 to Firestore (Direct)
 */
export async function migrateAllData() {
    console.log('🚀 Starting data migration to Firestore...');

    try {
        // 1. Migrate Courses
        console.log('📚 Migrating courses...');
        const coursesRes = await fetch(`${API_URL}/data/courses`);
        const courses = await coursesRes.json();

        for (const course of courses) {
            await setDoc(doc(db, 'courses', course.id.toString()), {
                title: course.title,
                description: course.description,
                orderIndex: course.id
            });
            console.log(`  ✓ Course: ${course.title}`);

            // 2. Migrate Topics for each course
            for (const topic of (course.topics || [])) {
                await setDoc(doc(db, 'topics', topic.id.toString()), {
                    title: topic.title,
                    description: topic.description,
                    courseId: course.id.toString(),
                    orderIndex: topic.orderIndex || topic.id
                });
                console.log(`    - Topic: ${topic.title}`);

                // 3. Migrate Study Items for each topic
                const itemsRes = await fetch(`${API_URL}/data/topics/${topic.id}/items`);
                const items = await itemsRes.json();

                const batch = writeBatch(db);
                let opCount = 0;

                for (const item of items) {
                    const itemRef = doc(db, 'study_items', item.id.toString());
                    batch.set(itemRef, {
                        word: item.word,
                        reading: item.reading,
                        meaning: item.meaning,
                        type: item.type,
                        topicId: topic.id.toString(),
                        exampleSentence: item.exampleSentence,
                        exampleReading: item.exampleReading,
                        exampleMeaning: item.exampleMeaning,
                        audioUrl: item.audioUrl
                    });
                    opCount++;
                }

                if (opCount > 0) {
                    await batch.commit();
                    console.log(`      + Migrated ${items.length} items`);
                }
            }
        }

        console.log('✨ Migration Complete!');
        return { success: true };
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

/**
 * Export all data from API to JSON object
 */
export async function exportDataToJson() {
    console.log('📤 Exporting data from API...');
    const data = {
        exportedAt: new Date().toISOString(),
        courses: []
    };

    try {
        const coursesRes = await fetch(`${API_URL}/data/courses`);
        const courses = await coursesRes.json();

        for (const course of courses) {
            const courseData = { ...course, topics: [] };

            // Get topics
            const topicsRes = await fetch(`${API_URL}/data/courses/${course.id}/topics`);
            const topics = await topicsRes.json();

            for (const topic of topics) {
                const topicData = { ...topic, items: [] };

                // Get items
                const itemsRes = await fetch(`${API_URL}/data/topics/${topic.id}/items`);
                const items = await itemsRes.json();
                topicData.items = items;

                courseData.topics.push(topicData);
            }
            data.courses.push(courseData);
        }

        return data;
    } catch (error) {
        console.error('Export failed:', error);
        throw error;
    }
}

/**
 * Import data from JSON object to Firestore
 */
export async function importDataFromJson(jsonData) {
    console.log('📥 Importing data to Firestore...');
    const courses = jsonData.courses || [];

    // Batch 1: Courses & Topics
    const batch1 = writeBatch(db);
    let opCount1 = 0;

    // Batch 2: Study Items (separate batch to avoid limit)
    const batch2 = writeBatch(db);
    let opCount2 = 0;

    for (const course of courses) {
        const courseRef = doc(db, 'courses', course.id.toString());
        batch1.set(courseRef, {
            title: course.title,
            description: course.description,
            orderIndex: course.orderIndex || course.id
        });
        opCount1++;

        for (const topic of course.topics) {
            const topicRef = doc(db, 'topics', topic.id.toString());
            batch1.set(topicRef, {
                title: topic.title,
                description: topic.description,
                courseId: course.id.toString(),
                orderIndex: topic.orderIndex || topic.id
            });
            opCount1++;

            for (const item of topic.items) {
                const itemRef = doc(db, 'study_items', item.id.toString());

                // Map backend fields to Firestore schema
                // Backend: primaryText, secondaryText, detailedInfo
                // Firestore: word, reading, exampleSentence
                const typeName = item.type ? (item.type.name || item.type.toString()) : 'VOCABULARY';

                batch2.set(itemRef, {
                    word: item.primaryText || item.word || '',
                    reading: item.secondaryText || item.reading || '',
                    meaning: item.meaning || '',
                    type: typeName,
                    topicId: topic.id.toString(),
                    exampleSentence: item.detailedInfo || item.exampleSentence || '',
                    exampleReading: item.exampleReading || '',
                    exampleMeaning: item.exampleMeaning || '',
                    audioUrl: item.audioUrl || ''
                });
                opCount2++;

                // Commit batches if they get full
                if (opCount2 >= 450) {
                    await batch2.commit();
                    opCount2 = 0;
                }
            }

            if (opCount1 >= 450) {
                await batch1.commit();
                opCount1 = 0;
            }
        }
    }

    if (opCount1 > 0) await batch1.commit();
    if (opCount2 > 0) await batch2.commit();

    console.log('✅ Import complete!');
}

/**
 * Creates user profile in Firestore
 */
export async function createUserProfile(user, role = 'STUDENT') {
    if (!user) return;
    try {
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            role: role,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            studyStreak: 0,
            totalStudyTime: 0,
            xp: 0,
            level: 1
        }, { merge: true });
        console.log(`User profile created for ${user.email} (${role})`);
    } catch (error) {
        console.error("Error creating user profile:", error);
    }
}

/**
 * Restore data to Spring Boot Backend (SQL)
 */
export async function restoreToBackend(jsonData) {
    console.log('🔙 Restoring data to Backend SQL...');

    try {
        const res = await fetch(`${API_URL}/admin/import`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': '1' // Assuming ID 1 is the Admin created by DataSeeder
            },
            body: JSON.stringify(jsonData)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Import failed');
        }

        const result = await res.json();
        console.log(`✅ Restore complete! Managed ${result.message}`);
        return result;
    } catch (error) {
        console.error('Restore failed:', error);
        throw error;
    }
}
export const createPresetUsers = async (currentUser) => {
    if (!currentUser) return;
    await createUserProfile({ ...currentUser, email: 'admin@example.com', uid: 'admin_user_id', displayName: 'Admin User' }, 'ADMIN');
    await createUserProfile({ ...currentUser, email: 'manager@example.com', uid: 'manager_user_id', displayName: 'Manager User' }, 'MANAGER');
    await createUserProfile({ ...currentUser, email: 'student@example.com', uid: 'student_user_id', displayName: 'Student User' }, 'STUDENT');
    console.log('Preset users created/updated');
};
