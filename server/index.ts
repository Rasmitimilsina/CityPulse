import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { fetchNews } from './newsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ── Load incidents.json ──────────────────────────────────────────────────────
// Try several paths so it works locally, on the server, and on Vercel
let incidents: any[] = [];
const incidentCandidates = [
    path.join(__dirname, '../incidents.json'),
    path.join(__dirname, 'incidents.json'),
    path.join(process.cwd(), 'incidents.json'),
];
for (const p of incidentCandidates) {
    try {
        if (fs.existsSync(p)) {
            incidents = JSON.parse(fs.readFileSync(p, 'utf8'));
            console.log(`[incidents] Loaded ${incidents.length} records from ${p}`);
            break;
        }
    } catch (_) { /* try next */ }
}
if (incidents.length === 0) {
    // Last resort: try require() which works with bundled files
    try {
        incidents = require('../incidents.json');
        console.log(`[incidents] Loaded via require: ${incidents.length} records`);
    } catch (e) {
        console.error('[incidents] FAILED to load incidents.json:', e);
    }
}

// ── In-Memory Complaint Store (Vercel-safe, no native binaries) ──────────────
interface Complaint {
    id: string;
    category: string;
    type: string;
    description: string;
    latitude: number;
    longitude: number;
    timestamp: number;
    priority: string;
    department: string;
    status: string;
    confirmations: number;
    rejections: number;
    reporterName: string;
    reporterPhone: string;
    reporterEmail: string;
}

let complaintsStore: Complaint[] = [];

// Try to pre-load existing complaints from SQLite if available (non-Vercel environments)
try {
    const { default: Database } = await import('better-sqlite3');
    const dbCandidates = [
        path.join(__dirname, '../complaints.db'),
        path.join(process.cwd(), 'complaints.db'),
    ];
    for (const dbPath of dbCandidates) {
        if (fs.existsSync(dbPath)) {
            const db = new Database(dbPath, { readonly: true });
            complaintsStore = db.prepare('SELECT * FROM complaints').all() as Complaint[];
            db.close();
            console.log(`[db] Loaded ${complaintsStore.length} complaints from ${dbPath}`);
            break;
        }
    }
} catch (e: any) {
    console.warn('[db] better-sqlite3 not available, using in-memory store:', e.message);
}

// ── Helper ───────────────────────────────────────────────────────────────────
const calculateRiskScore = (incidentCount: number, complaintCount: number, severityFactor: number): number => {
    return (incidentCount * 0.5) + (complaintCount * 0.3) + (severityFactor * 0.2);
};

// ── API Routes ───────────────────────────────────────────────────────────────

// 1. GET /api/incidents
app.get('/api/incidents', (_req, res) => {
    res.json(incidents);
});

// 2. POST /api/complaints
app.post('/api/complaints', (req, res) => {
    const { type, description, latitude, longitude, timestamp } = req.body;
    const shortId = req.body.id || `CP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newComplaint: Complaint = {
        id: shortId,
        type: type || req.body.category || 'General',
        category: req.body.category || type || 'General',
        description,
        latitude,
        longitude,
        timestamp: timestamp || Date.now(),
        priority: req.body.priority || 'Medium',
        department: req.body.department || 'General Services',
        status: req.body.status || 'Pending',
        confirmations: 0,
        rejections: 0,
        reporterName: req.body.reporterName || '',
        reporterPhone: req.body.reporterPhone || '',
        reporterEmail: req.body.reporterEmail || '',
    };

    complaintsStore.push(newComplaint);
    res.status(201).json(newComplaint);
});

// 3. GET /api/hotspots
app.get('/api/hotspots', (_req, res) => {
    const neighborhoodStats: Record<string, { incidentCount: number; complaintCount: number; severity: number }> = {};

    incidents.forEach(inc => {
        const nbhd = inc.location;
        if (!neighborhoodStats[nbhd]) neighborhoodStats[nbhd] = { incidentCount: 0, complaintCount: 0, severity: 0 };
        neighborhoodStats[nbhd].incidentCount += 1;
        neighborhoodStats[nbhd].severity += (inc.type === 'Assault' || inc.type === 'Robbery') ? 3 : 1;
    });

    complaintsStore.forEach(cmp => {
        let closestNbhd = 'Downtown';
        let minDist = Infinity;
        incidents.forEach(inc => {
            const dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
            if (dist < minDist) { minDist = dist; closestNbhd = inc.location; }
        });
        if (!neighborhoodStats[closestNbhd]) neighborhoodStats[closestNbhd] = { incidentCount: 0, complaintCount: 0, severity: 0 };
        neighborhoodStats[closestNbhd].complaintCount += 1;
        neighborhoodStats[closestNbhd].severity += cmp.priority === 'High' ? 2 : 1;
    });

    const riskScores = Object.entries(neighborhoodStats).map(([neighborhood, stats]) => {
        const score = calculateRiskScore(stats.incidentCount, stats.complaintCount, stats.severity);
        let riskLevel = score > 15 ? 'High' : score > 5 ? 'Medium' : 'Low';
        const incidentsInNbhd = incidents.filter(i => i.location === neighborhood);
        let centerPosition = [32.3668, -86.3000];
        if (incidentsInNbhd.length > 0) {
            const avgLat = incidentsInNbhd.reduce((sum, inc) => sum + inc.latitude, 0) / incidentsInNbhd.length;
            const avgLng = incidentsInNbhd.reduce((sum, inc) => sum + inc.longitude, 0) / incidentsInNbhd.length;
            centerPosition = [avgLat, avgLng];
        }
        return { name: neighborhood, score: Number(score.toFixed(2)), count: stats.incidentCount + stats.complaintCount, level: riskLevel, centerPosition };
    });

    res.json(riskScores);
});

// 4. GET /api/analytics
app.get('/api/analytics', (_req, res) => {
    const totalComplaints = complaintsStore.length;
    const byCategory = complaintsStore.reduce((acc, cmp) => {
        const cat = cmp.category || cmp.type;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const byNeighborhood: Record<string, number> = {};
    complaintsStore.forEach(cmp => {
        let closestNbhd = 'Downtown';
        let minDist = Infinity;
        incidents.forEach(inc => {
            const dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
            if (dist < minDist) { minDist = dist; closestNbhd = inc.location; }
        });
        byNeighborhood[closestNbhd] = (byNeighborhood[closestNbhd] || 0) + 1;
    });

    res.json({ totalComplaints, byCategory, byNeighborhood });
});

// 5. GET /api/departments/:name/complaints
app.get('/api/departments/:name/complaints', (req, res) => {
    const dept = decodeURIComponent(req.params.name);
    res.json(complaintsStore.filter(c => c.department === dept));
});

// 6. PATCH /api/complaints/:id/status
app.patch('/api/complaints/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const complaint = complaintsStore.find(c => c.id === id);
    if (complaint) {
        complaint.status = status;
        res.json({ success: true, id, status });
    } else {
        res.status(404).json({ error: 'Complaint not found' });
    }
});

// 7. GET /api/complaints/:id
app.get('/api/complaints/:id', (req, res) => {
    const complaint = complaintsStore.find(c => c.id === req.params.id);
    if (complaint) {
        res.json(complaint);
    } else {
        res.status(404).json({ error: 'Complaint not found' });
    }
});

// 8. GET /api/news
app.get('/api/news', async (_req, res) => {
    try {
        const news = await fetchNews();
        res.json(news);
    } catch {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// ── Start (local dev only) ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`CityPulse API Server running on http://localhost:${PORT}`);
    });
}

export default app;
