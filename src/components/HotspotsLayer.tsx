import React from 'react';
import { Circle, Tooltip } from 'react-leaflet';
import { NeighborhoodRisk } from '../utils/risk';

interface HotspotsLayerProps {
    risks: NeighborhoodRisk[];
}

export function HotspotsLayer({ risks }: HotspotsLayerProps) {
    const getColor = (level: string) => {
        if (level === 'High') return '#ef4444'; // red-500
        if (level === 'Medium') return '#f97316'; // orange-500
        return '#22c55e'; // green-500
    };

    return (
        <>
            {risks.map((risk, idx) => (
                <Circle
                    key={`risk-${idx}`}
                    center={risk.centerPosition}
                    pathOptions={{
                        color: getColor(risk.level),
                        fillColor: getColor(risk.level),
                        fillOpacity: 0.3,
                        weight: 2
                    }}
                    radius={1500} // ~1.5km radius to represent a neighborhood roughly
                >
                    <Tooltip sticky>
                        <div className="p-1">
                            <h4 className="font-bold text-slate-800 text-[14px]">{risk.name}</h4>
                            <div className="flex gap-2 text-xs mt-1">
                                <span className="text-slate-500">Risk Level:</span>
                                <span className={`font-semibold ${risk.level === 'High' ? 'text-red-600' :
                                        risk.level === 'Medium' ? 'text-orange-600' : 'text-green-600'
                                    }`}>{risk.level}</span>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <span className="text-slate-500">Incidents:</span>
                                <span className="font-semibold text-slate-700">{risk.count}</span>
                            </div>
                            <div className="flex gap-2 text-xs">
                                <span className="text-slate-500">Risk Score:</span>
                                <span className="font-semibold text-slate-700">{risk.score}</span>
                            </div>
                        </div>
                    </Tooltip>
                </Circle>
            ))}
        </>
    );
}
