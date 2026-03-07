import React from 'react';
import { ShieldAlert, Map as MapIcon, Activity } from 'lucide-react';
import { NeighborhoodRisk, calculateNeighborhoodRisks } from '../utils/risk';
import { TrendAnalysis } from './TrendAnalysis';

interface Incident {
    type: string;
    latitude: number;
    longitude: number;
    location: string;
}

interface DashboardProps {
    totalIncidents: number;
    topTypes: [string, number][];
    risks: NeighborhoodRisk[];
}

export function Dashboard({ totalIncidents, topTypes, risks }: DashboardProps) {

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl w-full pointer-events-auto border border-slate-100 shrink-0">
            <div className="flex flex-col gap-6">

                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <MapIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                            Incident Reports
                        </h1>
                        <p className="text-slate-500 text-xs">
                            Montgomery, AL
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Metric 1 */}
                    {/* Metric 1 */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Total Incidents</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900">{totalIncidents}</span>
                    </div>

                    {/* Metric 2 */}
                    <div className="pt-1">
                        <h3 className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-3">Top Offenses</h3>
                        <div className="space-y-2.5">
                            {topTypes.map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center text-sm">
                                    <span className="text-slate-700 font-medium truncate pr-4">{type}</span>
                                    <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-semibold">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <TrendAnalysis risks={risks} />

            </div>
        </div>
    );
}
