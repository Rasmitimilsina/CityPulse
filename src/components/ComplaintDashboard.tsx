import React from 'react';
import { Complaint } from '../utils/complaints';
import { FileWarning, AlertTriangle, Layers } from 'lucide-react';

export interface ComplaintDashboardProps {
    total: number;
    highPriority: number;
    categoryCounts: Record<string, number>;
}

export function ComplaintDashboard({ total, highPriority, categoryCounts }: ComplaintDashboardProps) {

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl w-full border border-slate-100 pointer-events-auto">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileWarning className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                        Civic Complaints
                    </h2>
                    <p className="text-slate-500 text-xs">Citizen Reports</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Layers className="w-4 h-4" />
                        <span className="text-xs font-semibold">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{total}</div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold">High Priority</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{highPriority}</div>
                </div>
            </div>

            {total > 0 && (
                <div className="mt-2">
                    <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Complaints By Category</h3>
                    <div className="space-y-3">
                        {Object.entries(categoryCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, count]) => (
                                <div key={cat} className="flex items-center justify-between text-sm group">
                                    <span className="text-slate-600 font-medium group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors"></div>
                                        {cat}
                                    </span>
                                    <span className="text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-md text-xs font-bold border border-slate-200/60 shadow-sm">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {total === 0 && (
                <div className="text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100/50 border-dashed mt-2">
                    <p className="text-slate-400 text-sm font-medium">No complaints reported yet.</p>
                </div>
            )}
        </div>
    );
}
