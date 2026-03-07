import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Incident, NeighborhoodRisk } from '../utils/risk';
import { HotspotsLayer } from './HotspotsLayer';

import { Complaint } from '../utils/complaints';

interface MapProps {
    incidents: Incident[];
    risks: NeighborhoodRisk[];
    complaints: Complaint[];
    onMapClick?: (latlng: [number, number]) => void;
    onValidateComplaint?: (id: string, type: 'confirm' | 'reject') => void;
}


// Map Click Handler Component
function MapEventHandler({ onMapClick }: { onMapClick?: (latlng: [number, number]) => void }) {
    useMapEvents({
        click(e) {
            if (onMapClick) {
                onMapClick([e.latlng.lat, e.latlng.lng]);
            }
        }
    });
    return null;
}


// Custom SVG Icon (Google Maps Pin Style)
const createCustomIcon = (type: string) => {
    let color = '#ea4335'; // Default red (Google core pin color)
    if (type.toLowerCase().includes('assault') || type.toLowerCase().includes('homicide') || type.toLowerCase().includes('robbery') || type.toLowerCase().includes('drugs')) {
        color = '#b31412'; // Dark red for severe
    } else if (type.toLowerCase().includes('accident') || type.toLowerCase().includes('fire') || type.toLowerCase().includes('chest')) {
        color = '#fbbc04'; // Yellow/Orange
    } else if (type.toLowerCase().includes('theft') || type.toLowerCase().includes('larceny') || type.toLowerCase().includes('burglary')) {
        color = '#1a73e8'; // Blue
    }

    const svgIcon = `
        <svg viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 2px rgba(0, 0, 0, 0.4)); transform: scale(1.5);">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="white" stroke="none"></circle>
        </svg>
    `;

    return L.divIcon({
        className: 'custom-pin',
        html: svgIcon,
        iconSize: [24, 24],
        iconAnchor: [12, 24], // Anchor at the bottom tip
        popupAnchor: [0, -24] // Popup opens above the pin
    });
};

const createComplaintIcon = (priority: string) => {
    let color = '#3b82f6'; // Default blue
    if (priority === 'High') color = '#ef4444'; // Red
    else if (priority === 'Medium') color = '#f59e0b'; // Amber
    else if (priority === 'Low') color = '#10b981'; // Green

    const svgIcon = `
        <svg viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 3px rgba(0, 0, 0, 0.4)); transform: scale(1.6);">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
    `;

    return L.divIcon({
        className: 'complaint-pin',
        html: svgIcon,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

export function Map({ incidents, risks, complaints, onMapClick, onValidateComplaint }: MapProps) {
    // calculate center from data or default to somewhere central Montgomery (e.g., [32.3668, -86.3000])
    const centerPosition: [number, number] = [32.3668, -86.3000];

    return (
        <div className="w-full h-full relative z-0">
            <MapContainer
                center={centerPosition}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapEventHandler onMapClick={onMapClick} />

                {risks && risks.length > 0 && <HotspotsLayer risks={risks} />}

                {incidents.map((incident, idx) => (
                    <Marker
                        key={`inc-${idx}`}
                        position={[incident.latitude, incident.longitude]}
                        icon={createCustomIcon(incident.type)}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold text-slate-900 text-[15px] mb-1">{incident.type}</h3>
                                <p className="text-slate-600 text-xs m-0">
                                    <span className="font-semibold text-slate-800">Location:</span> {incident.location}
                                </p>
                                <p className="text-slate-400 text-[10px] m-0 mt-1">
                                    Coords: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {complaints.map((complaint) => (
                    <Marker
                        key={complaint.id}
                        position={[complaint.latitude, complaint.longitude]}
                        icon={createComplaintIcon(complaint.priority)}
                    >
                        <Popup>
                            <div className="p-2 min-w-[200px]">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-900 text-sm m-0">{complaint.category} Issue</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${complaint.priority === 'High' ? 'bg-red-100 text-red-700' :
                                        complaint.priority === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {complaint.priority}
                                    </span>
                                </div>

                                <p className="text-slate-600 text-xs mb-2 italic">"{complaint.description}"</p>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Status:</span>
                                        <span className="font-semibold text-indigo-600">{complaint.status}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Dept:</span>
                                        <span className="font-semibold text-slate-700">{complaint.department}</span>
                                    </div>
                                    {(complaint.reporterName || complaint.reporterPhone) && (
                                        <div className="flex justify-between text-xs pt-1 border-t border-slate-50 mt-1">
                                            <span className="text-slate-500">Reporter:</span>
                                            <div className="flex flex-col items-end">
                                                {complaint.reporterName && <span className="font-medium text-slate-700">{complaint.reporterName}</span>}
                                                {complaint.reporterPhone && <span className="text-[10px] text-slate-400">{complaint.reporterPhone}</span>}
                                                {complaint.reporterEmail && <span className="text-[10px] text-slate-400">{complaint.reporterEmail}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onValidateComplaint?.(complaint.id, 'confirm'); }}
                                            className="p-1.5 rounded-full hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors"
                                            title="Confirm Issue"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" /></svg>
                                        </button>
                                        <span className="text-xs font-semibold text-slate-500">{complaint.confirmations || 0}</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onValidateComplaint?.(complaint.id, 'reject'); }}
                                        className="p-1.5 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Reject/Not an Issue"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" /></svg>
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
