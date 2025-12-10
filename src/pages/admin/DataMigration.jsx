/**
 * Data Migration Component
 * Temporary component to run data migration from H2 to Firestore
 */
import React, { useState } from 'react';
import { migrateAllData, testFirestoreConnection, createPresetUsers, exportDataToJson, importDataFromJson } from '@/lib/migrationScript';
import { Download, Upload, Server, Database } from 'lucide-react';

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
        if (!window.confirm('This will migrate all data directly. Only works if network allows. Continue?')) return;

        setStatus('migrating');
        setLog([]);
        addLog('🚀 Starting direct migration...');

        // Intercept console.log
        const originalLog = console.log;
        console.log = (...args) => {
            originalLog(...args);
            addLog(args.join(' '));
        };

        try {
            await migrateAllData();
            addLog('🎉 Migration completed successfully!');
        } catch (err) {
            addLog(`❌ Failed: ${err.message}`);
        } finally {
            console.log = originalLog;
            setStatus('done');
        }
    };

    const handleExport = async () => {
        try {
            setStatus('processing');
            addLog('📤 Exporting data to JSON...');
            const data = await exportDataToJson();

            // Create download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `japanese_study_data_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            addLog('✅ Data exported! Now upload this file on the Vercel app.');
        } catch (err) {
            addLog(`❌ Export failed: ${err.message}`);
        } finally {
            setStatus('idle');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setStatus('processing');
            addLog('📥 Reading file...');
            const text = await file.text();
            const json = JSON.parse(text);

            addLog('🚀 Importing to Firestore...');
            await importDataFromJson(json);
            addLog('🎉 Import completed successfully!');
        } catch (err) {
            addLog(`❌ Import failed: ${err.message}`);
        } finally {
            setStatus('idle');
        }
    };

    const handleCreateUsers = async () => {
        // Mock current user for simplified call
        await createPresetUsers({ uid: 'current_admin', email: 'admin@example.com' });
        addLog('✅ User profiles created');
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

            <div className="grid gap-6">
                {/* Section 1: Direct Migration (Local Network) */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50/50">
                    <h3 className="font-medium flex items-center gap-2">
                        <Server className="w-4 h-4" /> Direct Migration
                        <span className="text-xs font-normal text-muted-foreground ml-auto">Requires local Firestore Access</span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={status !== 'idle'}
                            className="px-4 py-2 border bg-white rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                        >
                            Test Connection
                        </button>
                        <button
                            onClick={handleMigrate}
                            disabled={status !== 'idle'}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                        >
                            Start Direct Migration
                        </button>
                    </div>
                </div>

                {/* Section 2: Backup/Restore Strategy */}
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50/30">
                    <h3 className="font-medium flex items-center gap-2">
                        <Database className="w-4 h-4" /> Backup & Restore Strategy
                        <span className="text-xs font-normal text-muted-foreground ml-auto">Recommended if Network Blocks</span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        1. Export data from Localhost (Spring Boot) <br />
                        2. Upload file here to import to <strong>Fireworks (Cloud)</strong> OR <strong>Postgres (Render)</strong>
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleExport}
                            disabled={status !== 'idle'}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" /> Export JSON
                        </button>

                        <div className="flex gap-2">
                            <label className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-sm">
                                <Upload className="w-4 h-4" /> Import to Firestore
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => handleImport(e, 'firestore')}
                                    disabled={status !== 'idle'}
                                    className="hidden"
                                />
                            </label>

                            <label className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 cursor-pointer disabled:opacity-50 flex items-center gap-2 text-sm">
                                <Upload className="w-4 h-4" /> Restore to SQL Backend
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={(e) => handleImport(e, 'sql')}
                                    disabled={status !== 'idle'}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 3: Utils */}
                <div className="pt-4 border-t">
                    <button
                        onClick={handleCreateUsers}
                        disabled={status !== 'idle'}
                        className="px-3 py-1.5 text-xs border rounded hover:bg-gray-50 text-muted-foreground"
                    >
                        Re-create Preset Users
                    </button>
                </div>
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


