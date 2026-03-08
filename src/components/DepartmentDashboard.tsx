import React, { useState } from 'react';
import { Department, Complaint, ComplaintStatus } from '../utils/complaints';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface DepartmentDashboardProps {
    department: Department;
    complaints: Complaint[];
    onStatusUpdate?: (id: string, newStatus: ComplaintStatus) => void;
}

const customIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export function DepartmentDashboard({ department, complaints: allComplaints, onStatusUpdate }: DepartmentDashboardProps) {
    // Filter complaints for this department from parent state (no API call needed)
    const complaints = allComplaints.filter(c => c.department === department);
    const [filter, setFilter] = useState<ComplaintStatus | 'All'>('All');

    const handleStatusUpdate = async (id: string, newStatus: ComplaintStatus) => {
        try {
            await fetch(`/api/complaints/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
        // Always update parent state (works even if API fails on Vercel)
        onStatusUpdate?.(id, newStatus);
    };

    const filteredComplaints = filter === 'All' ? complaints : complaints.filter(c => c.status === filter);

    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-slate-50 relative z-0">
            {/* Left Panel: Map */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-full relative z-0 border-r border-slate-200">
                <MapContainer center={[32.3668, -86.3000]} zoom={13} className="w-full h-full" zoomControl={false}>
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {filteredComplaints.map(complaint => (
                        <Marker key={complaint.id} position={[complaint.latitude, complaint.longitude]} icon={customIcon}>
                            <Popup className="rounded-xl overflow-hidden shadow-lg border-none p-0">
                                <div className="p-3 w-56">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{complaint.category}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${complaint.priority === 'High' ? 'bg-red-100 text-red-600' :
                                            complaint.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>{complaint.priority} Priority</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2 leading-snug">{complaint.description}</p>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: {complaint.id}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            {/* Right Panel: Tickets */}
            <div className="w-full md:w-1/2 h-[50vh] md:h-full overflow-y-auto p-6 bg-white relative z-10 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{department} Portal</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage and update active civic issues</p>
                    </div>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                        {['All', 'Pending', 'In Progress', 'Resolved'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setFilter(opt as any)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filter === opt ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {filteredComplaints.length === 0 ? (
                        <div className="text-center p-12 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                            No {filter !== 'All' ? filter.toLowerCase() : ''} complaints found.
                        </div>
                    ) : (
                        filteredComplaints.map(complaint => (
                            <div key={complaint.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{complaint.category}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">#{complaint.id.split('-')[1]}</span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${complaint.priority === 'High' ? 'bg-red-100 text-red-600' :
                                            complaint.priority === 'Medium' ? 'bg-amber-100 text-amber-600' :
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>{complaint.priority}</span>
                                    </div>

                                    {/* Status Updater */}
                                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                                        {(['Pending', 'In Progress', 'Resolved'] as ComplaintStatus[]).map(status => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusUpdate(complaint.id, status)}
                                                className={`p-1.5 rounded transition-colors ${complaint.status === status
                                                    ? (status === 'Pending' ? 'bg-amber-100 text-amber-700' : status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')
                                                    : 'text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                title={`Mark as ${status}`}
                                            >
                                                {status === 'Pending' && <AlertCircle className="w-4 h-4" />}
                                                {status === 'In Progress' && <Clock className="w-4 h-4" />}
                                                {status === 'Resolved' && <CheckCircle2 className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{complaint.description}</p>

                                {(complaint.reporterName || complaint.reporterPhone) && (
                                    <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                                        <span className="font-semibold">Reporter:</span> {complaint.reporterName || 'Anonymous'} {complaint.reporterPhone ? `• ${complaint.reporterPhone}` : ''}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
