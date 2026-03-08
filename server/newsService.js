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
exports.fetchNews = fetchNews;
var child_process_1 = require("child_process");
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
// Keep a simple cache
var cachedNews = null;
var lastFetchTime = 0;
var CACHE_DURATION_MS = 60 * 1000; // 1 minute
function fetchNews() {
    return __awaiter(this, void 0, void 0, function () {
        var now, scriptPath, resultsPath, rawData, result, textResponse, parsed;
        return __generator(this, function (_a) {
            now = Date.now();
            if (cachedNews && (now - lastFetchTime < CACHE_DURATION_MS)) {
                return [2 /*return*/, cachedNews];
            }
            try {
                console.log("Spawning isolated fetch_news.mjs...");
                scriptPath = path_1.default.resolve(process.cwd(), "fetch_news.mjs");
                (0, child_process_1.execSync)("node ".concat(scriptPath), { stdio: 'inherit' });
                resultsPath = path_1.default.resolve(process.cwd(), "news_results.json");
                if (fs_1.default.existsSync(resultsPath)) {
                    rawData = fs_1.default.readFileSync(resultsPath, "utf-8");
                    result = JSON.parse(rawData);
                    if (result && Array.isArray(result.content) && result.content.length > 0) {
                        textResponse = result.content[0].text;
                        if (typeof textResponse === 'string') {
                            parsed = JSON.parse(textResponse);
                            if (parsed.organic) {
                                cachedNews = parsed.organic;
                                lastFetchTime = now;
                                return [2 /*return*/, cachedNews];
                            }
                        }
                    }
                }
            }
            catch (e) {
                console.error("Error executing fetch_news.mjs:", e.message);
            }
            if (!cachedNews || cachedNews.length === 0) {
                console.log("Returning fallback data due to fetch error.");
                cachedNews = [
                    {
                        "link": "https://www.montgomeryadvertiser.com/news/",
                        "title": "Local and River Region News - The Montgomery Advertiser",
                        "description": "Local news and events for Montgomery Alabama and the River Region brought to you by The Montgomery Advertiser."
                    },
                    {
                        "link": "https://www.wsfa.com/2025/10/08/montgomery-suspends-downtown-entertainment-district-following-mass-shooting/",
                        "title": "Montgomery suspends downtown entertainment district ...",
                        "description": "The Montgomery City Council voted unanimously Tuesday night to suspend the downtown entertainment district following recent events."
                    }
                ];
            }
            return [2 /*return*/, cachedNews || []];
        });
    });
}
