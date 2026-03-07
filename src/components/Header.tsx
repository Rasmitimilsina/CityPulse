import React from 'react';
import { Activity } from 'lucide-react';
import { Department } from '../utils/complaints';

interface HeaderProps {
    onSelectDepartment: (dept: Department | null) => void;
    currentDepartment: Department | null;
}

const DEPARTMENTS: Department[] = ['Road Department', 'Electricity Department', 'Sanitation Department', 'Water Department'];

export function Header({ onSelectDepartment, currentDepartment }: HeaderProps) {
    return (
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-20 relative shadow-sm">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-lg text-white cursor-pointer" onClick={() => onSelectDepartment(null)}>
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 leading-none cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onSelectDepartment(null)}>CityPulse</h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Urban Incident & Civic Management</p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <select
                    value={currentDepartment || ''}
                    onChange={(e) => onSelectDepartment(e.target.value ? e.target.value as Department : null)}
                    className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 font-bold text-indigo-700 shadow-sm transition-all"
                >
                    <option value="">Public Citizen View</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d} Portal</option>)}
                </select>

                {!currentDepartment && (
                    <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 font-medium hidden md:block">
                        Click anywhere on the map to <span className="text-indigo-600 font-semibold">Report an Incident</span>
                    </div>
                )}
            </div>
        </header>
    );
}
