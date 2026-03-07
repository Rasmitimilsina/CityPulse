export interface Incident {
    type: string;
    latitude: number;
    longitude: number;
    location: string;
}

export interface NeighborhoodRisk {
    name: string;
    score: number;
    count: number;
    level: 'High' | 'Medium' | 'Low';
    centerPosition: [number, number];
}

export function calculateNeighborhoodRisks(incidents: Incident[]): NeighborhoodRisk[] {
    const neighborhoodGroups: Record<string, Incident[]> = {};

    incidents.forEach(incident => {
        if (!neighborhoodGroups[incident.location]) {
            neighborhoodGroups[incident.location] = [];
        }
        neighborhoodGroups[incident.location].push(incident);
    });

    const risks: NeighborhoodRisk[] = [];

    for (const [name, neighborhoodIncidents] of Object.entries(neighborhoodGroups)) {
        const count = neighborhoodIncidents.length;

        // Simple risk score calculation (could be more complex involving weights per incident type)
        const score = count * 10;

        let level: 'High' | 'Medium' | 'Low' = 'Low';
        if (count >= 10) level = 'High';
        else if (count >= 4) level = 'Medium';

        // Calculate approximate center for the neighborhood marker/hotspot
        const avgLat = neighborhoodIncidents.reduce((sum, inc) => sum + inc.latitude, 0) / count;
        const avgLng = neighborhoodIncidents.reduce((sum, inc) => sum + inc.longitude, 0) / count;

        risks.push({
            name,
            score,
            count,
            level,
            centerPosition: [avgLat, avgLng]
        });
    }

    return risks;
}
