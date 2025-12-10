/**
 * Data Migration Component
 * Temporary component to run data migration from H2 to Firestore
 */
import React, { useState } from 'react';
import { migrateAllData, testFirestoreConnection, createPresetUsers } from '@/lib/migrationScript';

export default function DataMigration() {
    const [status, setStatus] = useState('idle');
    const [log, setLog] = useState([]);

    const addLog = (msg) => setLog(prev => [...prev, msg]);

    const handleTestConnection = async () => {
        setStatus('testing');
        addLog('Testing Firestore connection...');
        const success = await testFirestoreConnection();
        if (success) {
            addLog('✅ Firestore connection successful!');
        } else {
            addLog('❌ Firestore connection failed. Check console for details.');
        }
        setStatus('idle');
    };

    const handleMigrate = async () => {
        if (!window.confirm('This will migrate all data from H2 to Firestore. Continue?')) return;

        setStatus('migrating');
        setLog([]);
        addLog('🚀 Starting migration...');

        // Intercept console.log to capture migration progress
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(...args);
            addLog(args.join(' '));
        };

        const result = await migrateAllData();

        console.log = originalLog;

        if (result.success) {
            addLog('');
            addLog('🎉 Migration completed successfully!');
            addLog('You can now use Firebase as your data source.');
        } else {
            addLog(`❌ Migration failed: ${result.message}`);
        }

        setStatus('done');
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Data Migration</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Migrate data from Spring Boot H2 database to Firebase Firestore
                </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                <strong>⚠️ Important:</strong> Make sure your Spring Boot backend is running on localhost:8080 before migrating.
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleTestConnection}
                    disabled={status === 'migrating'}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    Test Firestore Connection
                </button>
                <button
                    onClick={async () => {
                        setStatus('creating');
                        setLog([]);
                        addLog('👥 Creating preset users...');
                        const originalLog = console.log;
                        console.log = (...args) => { originalLog(...args); addLog(args.join(' ')); };
                        await createPresetUsers();
                        console.log = originalLog;
                        setStatus('done');
                    }}
                    disabled={status === 'migrating'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                    Create Preset Users
                </button>
                <button
                    onClick={handleMigrate}
                    disabled={status === 'migrating'}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                    {status === 'migrating' ? 'Migrating...' : 'Migrate All Data'}
                </button>
            </div>

            {log.length > 0 && (
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-xs max-h-96 overflow-auto">
                    {log.map((line, i) => (
                        <div key={i} className="py-0.5">{line}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
