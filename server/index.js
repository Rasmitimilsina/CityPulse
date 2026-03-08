"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var url_1 = require("url");
var better_sqlite3_1 = __importDefault(require("better-sqlite3"));
var newsService_js_1 = require("./newsService.js");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var rootDir = process.cwd();
var app = (0, express_1.default)();
var PORT = 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Load initial incidents from file
var incidentsPath = path_1.default.join(rootDir, 'incidents.json');
var incidents = [];
try {
    var data = fs_1.default.readFileSync(incidentsPath, 'utf8');
    incidents = JSON.parse(data);
}
catch (error) {
    console.error("Error reading incidents.json:", error);
}
// Initialize SQLite Database
var dbPath = path_1.default.join(rootDir, 'complaints.db');
var db = new better_sqlite3_1.default(dbPath);
// Create Complaints Table
db.exec("\n    CREATE TABLE IF NOT EXISTS complaints (\n        id TEXT PRIMARY KEY,\n        category TEXT,\n        type TEXT,\n        description TEXT,\n        latitude REAL,\n        longitude REAL,\n        timestamp INTEGER,\n        priority TEXT,\n        department TEXT,\n        status TEXT,\n        confirmations INTEGER,\n        rejections INTEGER,\n        reporterName TEXT,\n        reporterPhone TEXT,\n        reporterEmail TEXT\n    )\n");
// Helper to calculate risk score
var calculateRiskScore = function (incidentCount, complaintCount, severityFactor) {
    // Risk Score = (incident_count * 0.5) + (complaints * 0.3) + (severity * 0.2)
    return (incidentCount * 0.5) + (complaintCount * 0.3) + (severityFactor * 0.2);
};
// --- REST APIs --- //
// 1. GET /api/incidents
app.get('/api/incidents', function (req, res) {
    res.json(incidents);
});
// 2. POST /api/complaints
app.post('/api/complaints', function (req, res) {
    var _a = req.body, type = _a.type, description = _a.description, latitude = _a.latitude, longitude = _a.longitude, timestamp = _a.timestamp;
    // In our frontend we pass category instead of type, so we try to map appropriately 
    // to match the requested API signature where "type" was specified.
    // Generate a short memorable ID (e.g. CP-8A2F) if not mapped from frontend
    var shortId = req.body.id || "CP-".concat(Math.random().toString(36).substring(2, 6).toUpperCase());
    var newComplaint = {
        id: shortId,
        type: type || req.body.category || 'General',
        category: req.body.category || type || 'General', // Keep category for consistency with existing UI
        description: description,
        latitude: latitude,
        longitude: longitude,
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
    var stmt = db.prepare("\n        INSERT INTO complaints (\n            id, category, type, description, latitude, longitude, timestamp, \n            priority, department, status, confirmations, rejections, \n            reporterName, reporterPhone, reporterEmail\n        ) VALUES (\n            @id, @category, @type, @description, @latitude, @longitude, @timestamp, \n            @priority, @department, @status, @confirmations, @rejections, \n            @reporterName, @reporterPhone, @reporterEmail\n        )\n    ");
    stmt.run(newComplaint);
    res.status(201).json(newComplaint);
});
// 3. GET /api/hotspots
app.get('/api/hotspots', function (req, res) {
    var neighborhoodStats = {};
    // Aggregate incidents
    incidents.forEach(function (inc) {
        var nbhd = inc.location;
        if (!neighborhoodStats[nbhd]) {
            neighborhoodStats[nbhd] = { incidentCount: 0, complaintCount: 0, severity: 0 };
        }
        neighborhoodStats[nbhd].incidentCount += 1;
        // Basic severity estimation (e.g. violent crimes are higher severity)
        if (inc.type === 'Assault' || inc.type === 'Robbery') {
            neighborhoodStats[nbhd].severity += 3;
        }
        else {
            neighborhoodStats[nbhd].severity += 1;
        }
    });
    // Aggregate complaints from DB
    var complaints = db.prepare('SELECT * FROM complaints').all();
    complaints.forEach(function (cmp) {
        // Since complaints use exact lat/lng, we assign them to a neighborhood based on a simple radius logic 
        // or if we had a proper geocoder. For demo, we will find the closest incident's neighborhood.
        var closestNbhd = "Downtown"; // default
        var minDistance = Infinity;
        incidents.forEach(function (inc) {
            // Simple pythagorean distance for estimating closest neighborhood cluster
            var dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
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
        }
        else {
            neighborhoodStats[closestNbhd].severity += 1;
        }
    });
    // Calculate final scores
    var riskScores = Object.entries(neighborhoodStats).map(function (_a) {
        var neighborhood = _a[0], stats = _a[1];
        var score = calculateRiskScore(stats.incidentCount, stats.complaintCount, stats.severity);
        var riskLevel = 'Low';
        if (score > 15)
            riskLevel = 'High';
        else if (score > 5)
            riskLevel = 'Medium';
        // calculate center
        var incidentsInNbhd = incidents.filter(function (i) { return i.location === neighborhood; });
        var centerPosition = [32.3668, -86.3000]; // default
        if (incidentsInNbhd.length > 0) {
            var avgLat = incidentsInNbhd.reduce(function (sum, inc) { return sum + inc.latitude; }, 0) / incidentsInNbhd.length;
            var avgLng = incidentsInNbhd.reduce(function (sum, inc) { return sum + inc.longitude; }, 0) / incidentsInNbhd.length;
            centerPosition = [avgLat, avgLng];
        }
        return {
            name: neighborhood,
            score: Number(score.toFixed(2)),
            count: stats.incidentCount + stats.complaintCount,
            level: riskLevel,
            centerPosition: centerPosition
        };
    });
    res.json(riskScores);
});
// 4. GET /api/analytics
app.get('/api/analytics', function (req, res) {
    // Fetch all complaints from SQLite
    var complaints = db.prepare('SELECT * FROM complaints').all();
    // Total complaints
    var totalComplaints = complaints.length;
    // Complaints by category
    var byCategory = complaints.reduce(function (acc, cmp) {
        var cat = cmp.category || cmp.type;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    // Complaints by neighborhood (using the same estimation logic as above)
    var byNeighborhood = {};
    complaints.forEach(function (cmp) {
        var closestNbhd = "Downtown";
        var minDistance = Infinity;
        incidents.forEach(function (inc) {
            var dist = Math.sqrt(Math.pow(inc.latitude - cmp.latitude, 2) + Math.pow(inc.longitude - cmp.longitude, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestNbhd = inc.location;
            }
        });
        byNeighborhood[closestNbhd] = (byNeighborhood[closestNbhd] || 0) + 1;
    });
    res.json({
        totalComplaints: totalComplaints,
        byCategory: byCategory,
        byNeighborhood: byNeighborhood
    });
});
// 5. GET /api/departments/:name/complaints
app.get('/api/departments/:name/complaints', function (req, res) {
    var departmentName = decodeURIComponent(req.params.name);
    try {
        var deptComplaints = db.prepare('SELECT * FROM complaints WHERE department = ?').all(departmentName);
        res.json(deptComplaints);
    }
    catch (error) {
        res.status(500).json({ error: 'Database error fetching department complaints' });
    }
});
// 6. PATCH /api/complaints/:id/status
app.patch('/api/complaints/:id/status', function (req, res) {
    var complaintId = req.params.id;
    var status = req.body.status;
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    try {
        var stmt = db.prepare('UPDATE complaints SET status = ? WHERE id = ?');
        var info = stmt.run(status, complaintId);
        if (info.changes > 0) {
            res.json({ success: true, id: complaintId, status: status });
        }
        else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Database error updating status' });
    }
});
// 7. GET /api/complaints/:id
app.get('/api/complaints/:id', function (req, res) {
    var id = req.params.id;
    try {
        var complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
        if (complaint) {
            res.json(complaint);
        }
        else {
            res.status(404).json({ error: 'Complaint not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Database error fetching complaint' });
    }
});
// 8. GET /api/news
app.get('/api/news', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var news, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, newsService_js_1.fetchNews)()];
            case 1:
                news = _a.sent();
                res.json(news);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: 'Failed to fetch news' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, function () {
        console.log("CityPulse API Server running on http://localhost:".concat(PORT));
    });
}
exports.default = app;
