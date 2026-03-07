import React, { useState } from 'react';
import { Incident } from '../utils/risk';
import { Send, MapPin, X } from 'lucide-react';

interface ReportFormProps {
    location: [number, number];
    onCancel: () => void;
    onSubmit: (incident: Incident) => void;
}

const incidentTypes = [
    'Assault', 'Burglary', 'Larceny', 'Robbery', 'Motor Vehicle Theft',
    'Drugs / Alcohol', 'Disturbing Peace', 'Vandalism', 'Fraud',
    'Motor vehicle collision', 'Fire / smoke alarm', 'Sick case',
    'Chest pain (non-trauma)', 'Breathing problems', 'Lift assist'
];

export function ReportForm({ location, onCancel, onSubmit }: ReportFormProps) {
    const [type, setType] = useState(incidentTypes[0]);
    const [neighborhood, setNeighborhood] = useState('Downtown'); // default mock

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newIncident: Incident = {
            type,
            latitude: location[0],
            longitude: location[1],
            location: neighborhood
        };

        // Placeholder for API Integration
        // fetch('/api/reports', { method: 'POST', body: JSON.stringify(newIncident) }).then(...)

        onSubmit(newIncident);
    };

    return (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-md flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    New Incident Report
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Incident Type</label>
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                        {incidentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Location Name / Area</label>
                    <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="e.g. Downtown, West Side..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        required
                    />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg flex items-start gap-2 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-mono tracking-tight leading-loose w-full grid grid-cols-2">
                        <div><span className="font-semibold text-slate-400">LAT:</span> {location[0].toFixed(5)}</div>
                        <div><span className="font-semibold text-slate-400">LNG:</span> {location[1].toFixed(5)}</div>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow hover:shadow-md transition-all rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    Submit Report
                </button>
            </form>
        </div>
    );
}
