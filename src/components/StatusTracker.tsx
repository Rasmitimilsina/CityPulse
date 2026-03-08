import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Complaint } from '../utils/complaints';

interface StatusTrackerProps {
    complaints: Complaint[];
}

export function StatusTracker({ complaints }: StatusTrackerProps) {
    const [searchId, setSearchId] = useState('');
    const [complaint, setComplaint] = useState<Complaint | null>(null);
    const [error, setError] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchId.trim();
        if (!trimmed) return;

        // Search locally in React state — no API call needed (Vercel functions are ephemeral)
        const found = complaints.find(
            c => c.id.toLowerCase() === trimmed.toLowerCase()
        );
        if (found) {
            setComplaint(found);
            setError('');
        } else {
            setComplaint(null);
            setError('Complaint ID not found. Make sure you are using the exact tracking ID shown after submission.');
        }
    };

    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-indigo-500" />
                Track Complaint
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Tracking ID (e.g. cmp-123...)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
                >
                    Track
                </button>
            </form>

            {error && <div className="text-xs text-red-500 font-medium mb-2">{error}</div>}

            {complaint && (
                <div className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Category</span>
                            <span className="text-sm font-bold text-slate-800">{complaint.category}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Department</span>
                            <span className="text-sm font-bold text-slate-700">{complaint.department}</span>
                        </div>
                    </div>

                    <div className="mt-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Live Status</span>
                        <div className="flex items-center gap-0 w-full relative">
                            {/* Timeline line */}
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-0 -translate-y-1/2 rounded"></div>

                            {/* Pending Step */}
                            <div className="relative z-10 flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${['Pending', 'In Progress', 'Resolved'].includes(complaint.status)
                                    ? 'bg-indigo-600 text-white shadow-sm ring-4 ring-slate-50'
                                    : 'bg-white border-2 border-slate-200 text-slate-300'
                                    }`}>
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold ${['Pending', 'In Progress', 'Resolved'].includes(complaint.status) ? 'text-indigo-700' : 'text-slate-400'}`}>Pending</span>
                            </div>

                            {/* In Progress Step */}
                            <div className="relative z-10 flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${['In Progress', 'Resolved'].includes(complaint.status)
                                    ? 'bg-blue-500 text-white shadow-sm ring-4 ring-slate-50'
                                    : 'bg-white border-2 border-slate-200 text-slate-300'
                                    }`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold ${['In Progress', 'Resolved'].includes(complaint.status) ? 'text-blue-600' : 'text-slate-400'}`}>In Progress</span>
                            </div>

                            {/* Resolved Step */}
                            <div className="relative z-10 flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors ${complaint.status === 'Resolved'
                                    ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-slate-50'
                                    : 'bg-white border-2 border-slate-200 text-slate-300'
                                    }`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-bold ${complaint.status === 'Resolved' ? 'text-emerald-600' : 'text-slate-400'}`}>Resolved</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
