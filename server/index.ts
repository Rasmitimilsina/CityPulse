import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { fetchNews } from './newsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = process.cwd();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load initial incidents from file
const incidentsPath = path.join(rootDir, 'incidents.json');
let incidents: any[] = [];
try {
    const data = fs.readFileSync(incidentsPath, 'utf8');
    incidents = JSON.parse(data);
} catch (error) {
    console.error("Error reading incidents.json:", error);
}

// Initialize SQLite Database
const dbPath = path.join(rootDir, 'complaints.db');
const db = new Database(dbPath);

// Create Complaints Table
db.exec(`
    CREATE TABLE IF NOT EXISTS complaints (
        id TEXT PRIMARY KEY,
        category TEXT,
        type TEXT,
        description TEXT,
        latitude REAL,
        longitude REAL,
        timestamp INTEGER,
        priority TEXT,
        department TEXT,
        status TEXT,
        confirmations INTEGER,
        rejections INTEGER,
        reporterName TEXT,
        reporterPhone TEXT,
        reporterEmail TEXT
    )
`);

// Helper to calculate risk score
const calculateRiskScore = (incidentCount: number, complaintCount: number, severityFactor: number): number => {
    // Risk Score = (incident_count * 0.5) + (complaints * 0.3) + (severity * 0.2)
    return (incidentCount * 0.5) + (complaintCount * 0.3) + (severityFactor * 0.2);
};

// --- REST APIs --- //

// 1. GET /api/incidents
app.get('/api/incidents', (req, res) => {
    res.json(incidents);
});

// 2. POST /api/complaints
app.post('/api/complaints', (req, res) => {
    const { type, description, latitude, longitude, timestamp } = req.body;

    // In our frontend we pass category instead of type, so we try to map appropriately 
    // to match the requested API signature where "type" was specified.

    // Generate a short memorable ID (e.g. CP-8A2F) if not mapped from frontend
    const shortId = req.body.id || `CP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newComplaint = {
        id: shortId,
        type: type || req.body.category || 'General',
        category: req.body.category || type || 'General', // Keep category for consistency with existing UI
        description,
        latitude,
        longitude,
        timestamp: timestamp || Date.now(),
        // Inherited fields from our app's logic since it expects full objects
        priority: req.body.priority || 'Medium',
        department: req.body.department || 'General Services',
        status: req.body.status || 'Pending',
        confirmations: 0,
        rejections: 0,
        reporterName: req.body.reporterName || '',
        reporterPhone: req.body.reporterPhone || '',
        reporterEmail: req.body.reporterEmail || '',
    };

    const stmt = db.prepare(`
        INSERT INTO complaints (
            id, category, type, description, latitude, longitude, timestamp, 
            priority, department, status, confirmations, rejections, 
            reporterName, reporterPhone, reporterEmail
        ) VALUES (
            @id, @category, @type, @description, @latitude, @longitude, @timestamp, 
            @priority, @department, @status, @confirmations, @rejections, 
            @reporterName, @reporterPhone, @reporterEmail
        )
    `);

    stmt.run(newComplaint);

    res.status(201).json(newComplaint);
});

// 3. GET /api/hotspots
app.get('/api/hotspots', (req, res) => {
    const neighborhoodStats: Record<string, { incidentCount: number, complaintCount: number, severity: number }> = {};

    // Aggregate incidents
    incidents.forEach(inc => {
        const nbhd = inc.location;
        if (!neighborhoodStats[nbhd]) {
            neighborhoodStats[nbhd] = { incidentCount: 0, complaintCount: 0, severity: 0 };
        }
        neighborhoodStats[nbhd].incidentCount += 1;

        // Basic severity estimation (e.g. violent crimes are higher severity)
        if (inc.type === 'Assault' || inc.type === 'Robbery') {
            neighborhoodStats[nbhd].severity += 3;
        } else {
            neighborhoodStats[nbhd].severity += 1;
        }
    });

    // Aggregate complaints from DB
    const complaints = db.prepare('SELECT * FROM complaints').all() as any[];

    complaints.forEach(cmp => {
        // Since complaints use exact lat/lng, we assign them to a neighborhood based on a simple radius logic 
        // or if we had a proper geocoder. For demo, we will find the closest incident's neighborhood.
        let closestNbhd = "Downtown"; // default
        let minDistance = Infinity;

        incidents.forEach(inc => {
            // Simple pythagorean distance for estimating closest neighborhood cluster
            const dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestNbhd = inc.location;
            }
        });

        if (!neighborhoodStats[closestNbhd]) {
            neighborhoodStats[closestNbhd] = { incidentCount: 0, complaintCount: 0, severity: 0 };
        }
        neighborhoodStats[closestNbhd].complaintCount += 1;

        if (cmp.priority === 'High') {
            neighborhoodStats[closestNbhd].severity += 2;
        } else {
            neighborhoodStats[closestNbhd].severity += 1;
        }
    });

    // Calculate final scores
    const riskScores = Object.entries(neighborhoodStats).map(([neighborhood, stats]) => {
        const score = calculateRiskScore(stats.incidentCount, stats.complaintCount, stats.severity);

        let riskLevel = 'Low';
        if (score > 15) riskLevel = 'High';
        else if (score > 5) riskLevel = 'Medium';

        // calculate center
        const incidentsInNbhd = incidents.filter(i => i.location === neighborhood);
        let centerPosition = [32.3668, -86.3000]; // default
        if (incidentsInNbhd.length > 0) {
            const avgLat = incidentsInNbhd.reduce((sum, inc) => sum + inc.latitude, 0) / incidentsInNbhd.length;
            const avgLng = incidentsInNbhd.reduce((sum, inc) => sum + inc.longitude, 0) / incidentsInNbhd.length;
            centerPosition = [avgLat, avgLng];
        }

        return {
            name: neighborhood,
            score: Number(score.toFixed(2)),
            count: stats.incidentCount + stats.complaintCount,
            level: riskLevel,
            centerPosition
        };
    });

    res.json(riskScores);
});

// 4. GET /api/analytics
app.get('/api/analytics', (req, res) => {
    // Fetch all complaints from SQLite
    const complaints = db.prepare('SELECT * FROM complaints').all() as any[];

    // Total complaints
    const totalComplaints = complaints.length;

    // Complaints by category
    const byCategory = complaints.reduce((acc, cmp) => {
        const cat = cmp.category || cmp.type;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Complaints by neighborhood (using the same estimation logic as above)
    const byNeighborhood: Record<string, number> = {};
    complaints.forEach(cmp => {
        let closestNbhd = "Downtown";
        let minDistance = Infinity;

        incidents.forEach(inc => {
            const dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestNbhd = inc.location;
            }
        });

        byNeighborhood[closestNbhd] = (byNeighborhood[closestNbhd] || 0) + 1;
    });

    res.json({
        totalComplaints,
        byCategory,
        byNeighborhood
    });
});

// 5. GET /api/departments/:name/complaints
app.get('/api/departments/:name/complaints', (req, res) => {
    const departmentName = decodeURIComponent(req.params.name);
    try {
        const deptComplaints = db.prepare('SELECT * FROM complaints WHERE department = ?').all(departmentName);
        res.json(deptComplaints);
    } catch (error) {
        res.status(500).json({ error: 'Database error fetching department complaints' });
    }
});

// 6. PATCH /api/complaints/:id/status
app.patch('/api/complaints/:id/status', (req, res) => {
    const complaintId = req.params.id;
    const { status } = req.body;

    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const stmt = db.prepare('UPDATE complaints SET status = ? WHERE id = ?');
        const info = stmt.run(status, complaintId);

        if (info.changes > 0) {
            res.json({ success: true, id: complaintId, status });
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Database error updating status' });
    }
});

// 7. GET /api/complaints/:id
app.get('/api/complaints/:id', (req, res) => {
    const { id } = req.params;
    try {
        const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
        if (complaint) {
            res.json(complaint);
        } else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Database error fetching complaint' });
    }
});

// 8. GET /api/news
app.get('/api/news', async (req, res) => {
    try {
        const news = await fetchNews();
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`CityPulse API Server running on http://localhost:${PORT}`);
    });
}

export default app;
