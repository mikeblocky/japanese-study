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
 * Migrate all data from H2 to Firestore
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

                // 3. Migrate Items for each topic
                const itemsRes = await fetch(`${API_BASE}/data/topics/${topic.id}/items`);
                const items = await itemsRes.json();

                // Use batch writes for efficiency (max 500 per batch)
                const batchSize = 400;
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = writeBatch(db);
                    const batchItems = items.slice(i, i + batchSize);

                    for (const item of batchItems) {
                        const itemRef = doc(db, 'studyItems', item.id.toString());
                        batch.set(itemRef, {
                            primaryText: item.primaryText || '',
                            secondaryText: item.secondaryText || '',
                            meaning: item.meaning || '',
                            detailedInfo: item.detailedInfo || '',
                            imageUrl: item.imageUrl || '',
                            audioUrl: item.audioUrl || '',
                            courseId: course.id.toString(),
                            topicId: topic.id.toString(),
                            type: item.type?.name || 'vocabulary'
                        });
                    }

                    await batch.commit();
                }

                console.log(`    ✓ Topic: ${topic.title} (${items.length} items)`);
            }
        }

        console.log('✅ Migration complete!');
        return { success: true, message: 'Migration completed successfully' };

    } catch (error) {
        console.error('❌ Migration failed:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Migrate item types
 */
export async function migrateItemTypes() {
    console.log('📝 Migrating item types...');
    try {
        const res = await fetch(`${API_BASE}/data/types`);
        const types = await res.json();

        for (const type of types) {
            await setDoc(doc(db, 'itemTypes', type.id.toString()), {
                name: type.name,
                description: type.description || ''
            });
            console.log(`  ✓ Type: ${type.name}`);
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to migrate types:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Quick test to verify Firestore connection
 */
export async function testFirestoreConnection() {
    try {
        const testRef = doc(db, '_test', 'connection');
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            test: true
        });
        console.log('✅ Firestore connection working!');
        return true;
    } catch (error) {
        console.error('❌ Firestore connection failed:', error);
        return false;
    }
}

/**
 * Create preset users in Firestore
 * Note: These are Firestore profiles only. To create Firebase Auth accounts,
 * users need to sign up through the app or be created via Firebase Console.
 */
export async function createPresetUsers() {
    console.log('👥 Creating preset user profiles...');

    const presetUsers = [
        {
            id: 'admin-preset',
            username: 'admin',
            email: 'admin@management.app',
            role: 'ADMIN',
            displayName: 'Administrator'
        },
        {
            id: 'manager-preset',
            username: 'manager1',
            email: 'manager@management.app',
            role: 'MANAGER',
            displayName: 'Manager'
        },
        {
            id: 'student-preset',
            username: 'student1',
            email: 'student@management.app',
            role: 'STUDENT',
            displayName: 'Student'
        }
    ];

    try {
        for (const user of presetUsers) {
            await setDoc(doc(db, 'users', user.id), {
                username: user.username,
                email: user.email,
                role: user.role,
                displayName: user.displayName,
                createdAt: new Date().toISOString(),
                isPreset: true
            });
            console.log(`  ✓ Created: ${user.username} (${user.role})`);
        }

        console.log('✅ Preset users created!');
        console.log('');
        console.log('⚠️  Note: These are Firestore profiles only.');
        console.log('   To actually login, create matching Firebase Auth accounts');
        console.log('   in Firebase Console → Authentication → Users → Add user');
        console.log('   Or sign up through the app with matching emails.');

        return { success: true };
    } catch (error) {
        console.error('❌ Failed to create preset users:', error);
        return { success: false, message: error.message };
    }
}

export default {
    migrateAllData,
    migrateItemTypes,
    testFirestoreConnection,
    createPresetUsers
};


