export type ComplaintCategory = 'Potholes' | 'Broken streetlights' | 'Trash dumping' | 'Water leakage';
export type ComplaintPriority = 'High' | 'Medium' | 'Low';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';
export type Department = 'Road Department' | 'Electricity Department' | 'Sanitation Department' | 'Water Department';

export interface Complaint {
    id: string;
    category: ComplaintCategory;
    description: string;
    latitude: number;
    longitude: number;
    priority: ComplaintPriority;
    department: Department;
    status: ComplaintStatus;
    confirmations: number;
    rejections: number;
    reporterName?: string;
    reporterPhone?: string;
    reporterEmail?: string;
    imageUrl?: string;
    timestamp: number;
}

const CATEGORY_KEYWORDS: Record<ComplaintCategory, string[]> = {
    'Potholes': ['hole', 'road', 'pothole', 'crack', 'street', 'pavement', 'sidewalk', 'asphalt'],
    'Broken streetlights': ['light', 'power', 'electricity', 'wire', 'pole', 'outage', 'spark', 'broken', 'streetlight'],
    'Trash dumping': ['trash', 'garbage', 'dumping', 'smell', 'litter', 'waste', 'bin'],
    'Water leakage': ['leak', 'water', 'pipe', 'flood', 'drain', 'sewer', 'puddle']
};

const HIGH_PRIORITY_KEYWORDS = ['large', 'huge', 'dangerous', 'emergency', 'massive', 'wire', 'spark', 'flood', 'crime'];

export function analyzeComplaint(description: string, selectedCategory: string): { category: ComplaintCategory; priority: ComplaintPriority; department: Department } {
    const text = description.toLowerCase();

    // 1. Categorization
    let category: ComplaintCategory = selectedCategory as ComplaintCategory;
    // Fallback if somehow invalid
    if (!['Potholes', 'Broken streetlights', 'Trash dumping', 'Water leakage'].includes(category)) {
        let maxMatches = -1;
        let matchedCategory: ComplaintCategory = 'Potholes';

        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            let matches = 0;
            for (const word of keywords) {
                if (text.includes(word)) matches++;
            }
            if (matches > maxMatches) {
                maxMatches = matches;
                matchedCategory = cat as ComplaintCategory;
            }
        }
        category = matchedCategory;
    }

    // 2. Priority Detection
    let priority: ComplaintPriority = 'Low';

    // Check for high priority keywords
    const isHigh = HIGH_PRIORITY_KEYWORDS.some(word => text.includes(word));
    if (isHigh) {
        priority = 'High';
    } else {
        priority = 'Medium';
    }

    // 3. Department Routing
    const routingMap: Record<ComplaintCategory, Department> = {
        'Potholes': 'Road Department',
        'Broken streetlights': 'Electricity Department',
        'Trash dumping': 'Sanitation Department',
        'Water leakage': 'Water Department'
    };

    const department = routingMap[category];

    return { category, priority, department };
}

export function validateComplaint(complaint: Complaint, type: 'confirm' | 'reject'): Complaint {
    const updated = { ...complaint };

    if (type === 'confirm') {
        updated.confirmations += 1;
        // Logic: If confirmations > 3 -> increase priority level.
        if (updated.confirmations > 3) {
            updated.priority = 'High';
        }
    } else if (type === 'reject') {
        updated.rejections += 1;
    }

    return updated;
}
