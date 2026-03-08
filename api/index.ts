import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// ESM-safe __dirname (needed because package.json has "type": "module")
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load incidents.json ───────────────────────────────────────────────────────
let incidents: any[] = [];
const candidatePaths = [
    path.join(process.cwd(), 'incidents.json'),
    path.join(__dirname, '../incidents.json'),
    path.join(__dirname, 'incidents.json'),
];
for (const p of candidatePaths) {
    try {
        if (fs.existsSync(p)) {
            incidents = JSON.parse(fs.readFileSync(p, 'utf-8'));
            console.log(`[incidents] Loaded ${incidents.length} records from ${p}`);
            break;
        }
    } catch (_) { /* try next */ }
}
// Last resort: try require() for bundled builds
if (incidents.length === 0) {
    try {
        const require = createRequire(import.meta.url);
        incidents = require('../incidents.json');
        console.log(`[incidents] Loaded via require: ${incidents.length} records`);
    } catch (e: any) {
        console.error('[incidents] FAILED to load incidents.json:', e.message);
    }
}

// ── In-memory complaints store (Vercel-safe, no SQLite) ───────────────────────
interface Complaint {
    id: string; category: string; type: string; description: string;
    latitude: number; longitude: number; timestamp: number;
    priority: string; department: string; status: string;
    confirmations: number; rejections: number;
    reporterName: string; reporterPhone: string; reporterEmail: string;
}
const complaintsStore: Complaint[] = [];

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcRisk(incidentCount: number, complaintCount: number, severity: number) {
    return (incidentCount * 0.5) + (complaintCount * 0.3) + (severity * 0.2);
}

function closestNeighborhood(lat: number, lng: number): string {
    let best = 'Downtown', minDist = Infinity;
    for (const inc of incidents) {
        const d = Math.sqrt((inc.latitude - lat) ** 2 + (inc.longitude - lng) ** 2);
        if (d < minDist) { minDist = d; best = inc.location; }
    }
    return best;
}

function sendJson(res: VercelResponse, data: any, status = 200) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(status).end(JSON.stringify(data));
}

// Static news fallback (execSync-based news fetching doesn't work on Vercel)
const FALLBACK_NEWS = [
    {
        link: 'https://www.montgomeryadvertiser.com/news/',
        title: 'Local and River Region News - The Montgomery Advertiser',
        description: 'Local news and events for Montgomery Alabama and the River Region.'
    },
    {
        link: 'https://www.wsfa.com/',
        title: 'Montgomery Area News - WSFA 12 News',
        description: 'Breaking news, weather, sports for Montgomery, Alabama and surrounding areas.'
    },
    {
        link: 'https://www.al.com/news/montgomery/',
        title: 'Montgomery News - AL.com',
        description: 'Latest Montgomery news, crime, weather, and community updates from AL.com.'
    }
];

// ── Main Vercel Handler ───────────────────────────────────────────────────────
export default function handler(req: VercelRequest, res: VercelResponse) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).end();
    }

    const pathname = (req.url || '').split('?')[0];

    // GET /api/incidents
    if (req.method === 'GET' && pathname === '/api/incidents') {
        return sendJson(res, incidents);
    }

    // GET /api/hotspots
    if (req.method === 'GET' && pathname === '/api/hotspots') {
        const stats: Record<string, { incidentCount: number; complaintCount: number; severity: number }> = {};
        for (const inc of incidents) {
            const n = inc.location;
            if (!stats[n]) stats[n] = { incidentCount: 0, complaintCount: 0, severity: 0 };
            stats[n].incidentCount++;
            stats[n].severity += (inc.type === 'Assault' || inc.type === 'Robbery') ? 3 : 1;
        }
        for (const cmp of complaintsStore) {
            const n = closestNeighborhood(cmp.latitude, cmp.longitude);
            if (!stats[n]) stats[n] = { incidentCount: 0, complaintCount: 0, severity: 0 };
            stats[n].complaintCount++;
            stats[n].severity += cmp.priority === 'High' ? 2 : 1;
        }
        const result = Object.entries(stats).map(([neighborhood, s]) => {
            const score = calcRisk(s.incidentCount, s.complaintCount, s.severity);
            const nbhdInc = incidents.filter((i: any) => i.location === neighborhood);
            const centerPosition = nbhdInc.length > 0
                ? [
                    nbhdInc.reduce((sum: number, i: any) => sum + i.latitude, 0) / nbhdInc.length,
                    nbhdInc.reduce((sum: number, i: any) => sum + i.longitude, 0) / nbhdInc.length,
                ]
                : [32.3668, -86.3000];
            return {
                name: neighborhood,
                score: Number(score.toFixed(2)),
                count: s.incidentCount + s.complaintCount,
                level: score > 15 ? 'High' : score > 5 ? 'Medium' : 'Low',
                centerPosition
            };
        });
        return sendJson(res, result);
    }

    // GET /api/analytics
    if (req.method === 'GET' && pathname === '/api/analytics') {
        const byCategory: Record<string, number> = {};
        const byNeighborhood: Record<string, number> = {};
        for (const cmp of complaintsStore) {
            const cat = cmp.category || cmp.type;
            byCategory[cat] = (byCategory[cat] || 0) + 1;
            const n = closestNeighborhood(cmp.latitude, cmp.longitude);
            byNeighborhood[n] = (byNeighborhood[n] || 0) + 1;
        }
        return sendJson(res, { totalComplaints: complaintsStore.length, byCategory, byNeighborhood });
    }

    // GET /api/news
    if (req.method === 'GET' && pathname === '/api/news') {
        return sendJson(res, FALLBACK_NEWS);
    }

    // GET /api/complaints/:id
    const complaintsIdMatch = pathname.match(/^\/api\/complaints\/([^/]+)$/);
    if (req.method === 'GET' && complaintsIdMatch) {
        const c = complaintsStore.find(x => x.id === complaintsIdMatch[1]);
        return c ? sendJson(res, c) : sendJson(res, { error: 'Not found' }, 404);
    }

    // POST /api/complaints
    if (req.method === 'POST' && pathname === '/api/complaints') {
        const body = req.body || {};
        const newC: Complaint = {
            id: body.id || `CP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            type: body.category || body.type || 'General',
            category: body.category || body.type || 'General',
            description: body.description || '',
            latitude: body.latitude,
            longitude: body.longitude,
            timestamp: body.timestamp || Date.now(),
            priority: body.priority || 'Medium',
            department: body.department || 'General Services',
            status: body.status || 'Pending',
            confirmations: 0, rejections: 0,
            reporterName: body.reporterName || '',
            reporterPhone: body.reporterPhone || '',
            reporterEmail: body.reporterEmail || '',
        };
        complaintsStore.push(newC);
        return sendJson(res, newC, 201);
    }

    // PATCH /api/complaints/:id/status
    const patchMatch = pathname.match(/^\/api\/complaints\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && patchMatch) {
        const { status } = req.body || {};
        if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
            return sendJson(res, { error: 'Invalid status' }, 400);
        }
        const c = complaintsStore.find(x => x.id === patchMatch[1]);
        if (c) { c.status = status; return sendJson(res, { success: true }); }
        return sendJson(res, { error: 'Not found' }, 404);
    }

    // GET /api/departments/:name/complaints
    const deptMatch = pathname.match(/^\/api\/departments\/([^/]+)\/complaints$/);
    if (req.method === 'GET' && deptMatch) {
        const dept = decodeURIComponent(deptMatch[1]);
        return sendJson(res, complaintsStore.filter(c => c.department === dept));
    }

    return sendJson(res, { error: 'Not found' }, 404);
}
