import React from 'react';
import { motion } from 'framer-motion';
import { NeighborhoodRisk } from '../utils/risk';
import { TrendingUp } from 'lucide-react';

interface TrendAnalysisProps {
    risks: NeighborhoodRisk[];
}

export function TrendAnalysis({ risks }: TrendAnalysisProps) {
    // Top 5 highest risk neighborhoods
    const topRisks = [...risks].sort((a, b) => b.score - a.score).slice(0, 5);
    const maxScore = Math.max(...topRisks.map(r => r.score), 1);

    return (
        <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Neighborhood Risk Heatmap
            </h3>

            <div className="space-y-4">
                {topRisks.map((risk, index) => {
                    const percentage = (risk.score / maxScore) * 100;
                    const barColor =
                        risk.level === 'High' ? 'bg-red-500' :
                            risk.level === 'Medium' ? 'bg-orange-500' : 'bg-green-500';

                    return (
                        <div key={risk.name}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-slate-700">{risk.name}</span>
                                <span className="text-slate-500 text-xs">{risk.score} pts</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 1, delay: index * 0.1 }}
                                    className={`h-full rounded-full ${barColor}`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
