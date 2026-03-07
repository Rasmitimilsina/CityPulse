import React, { useState } from 'react';
import { Complaint, ComplaintCategory, analyzeComplaint } from '../utils/complaints';
import { Send, MapPin, X, UploadCloud } from 'lucide-react';

interface ComplaintFormProps {
    location: [number, number];
    onCancel: () => void;
    onSubmit: (complaint: Complaint) => void;
}

const CATEGORIES: ComplaintCategory[] = ['Potholes', 'Broken streetlights', 'Trash dumping', 'Water leakage'];

export function ComplaintForm({ location, onCancel, onSubmit }: ComplaintFormProps) {
    const [category, setCategory] = useState<ComplaintCategory>('Potholes');
    const [description, setDescription] = useState('');
    const [reporterName, setReporterName] = useState('');
    const [reporterPhone, setReporterPhone] = useState('');
    const [reporterEmail, setReporterEmail] = useState('');

    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successView, setSuccessView] = useState<{ department: string, trackingId: string } | null>(null);
    const [pendingComplaint, setPendingComplaint] = useState<Complaint | null>(null);

    const charCount = description.length;
    const liveAnalysis = analyzeComplaint(description, category);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Analyze using the AI logic
        const analysis = analyzeComplaint(description, category);

        // Generate a short memorable ID (Matches backend format)
        const shortId = `CP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const newComplaint: Complaint = {
            id: shortId,
            category: analysis.category,
            description,
            latitude: location[0],
            longitude: location[1],
            priority: analysis.priority,
            department: analysis.department,
            status: 'Pending',
            confirmations: 0,
            rejections: 0,
            timestamp: Date.now(),
            reporterName,
            reporterPhone,
            reporterEmail
        };

        if (imageFileName) {
            newComplaint.imageUrl = `mock-image-${imageFileName}`;
        }

        // Show Success view
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSuccessView({ department: analysis.department, trackingId: shortId });
            setPendingComplaint(newComplaint); // Save it so we can push it to App.tsx when 'Done' is clicked
        }, 800);
    };

    const handleCopyId = () => {
        if (successView) {
            navigator.clipboard.writeText(successView.trackingId);
            // Could add a tiny toast here
        }
    };

    const handleDone = () => {
        if (pendingComplaint) {
            onSubmit(pendingComplaint); // Pass the real complaint to App.tsx so it can POST and update state without crashing
        }
        onCancel(); // Force the form to close and return to Dashboard immediately
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImageFileName(e.target.files[0].name);
        }
    }

    if (successView) {
        return (
            <div className="bg-white p-6 rounded-xl border border-green-200 shadow-md flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-95 duration-300 text-center min-h-[300px]">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800">Complaint Submitted</h3>
                <p className="text-sm text-slate-500">Your report has been successfully recorded.</p>

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 w-full my-1 flex justify-between items-center group">
                    <div className="text-left flex flex-col">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Tracking ID</span>
                        <span className="font-mono text-lg font-bold text-indigo-700 tracking-wider">{successView.trackingId}</span>
                    </div>
                    <button
                        onClick={handleCopyId}
                        className="bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200 p-2 rounded-lg transition-colors flex items-center justify-center shadow-sm"
                        title="Copy Tracking ID"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    </button>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 w-full text-left flex flex-col gap-1.5 mt-2">
                    <div className="text-xs flex justify-between">
                        <span className="text-slate-500">Assigned To:</span>
                        <span className="font-semibold text-slate-700">{successView.department}</span>
                    </div>
                    <div className="text-xs flex justify-between">
                        <span className="text-slate-500">Est. Review:</span>
                        <span className="font-semibold text-slate-700">24 hours</span>
                    </div>
                </div>

                <button
                    onClick={handleDone}
                    className="w-full mt-2 bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2"
                >
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-md flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    Report Civic Issue
                </h3>
                <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Issue Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    >
                        {CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between">
                        <label className="text-xs font-semibold text-slate-600">Description</label>
                        <span className={`text-[10px] font-medium ${charCount > 250 ? 'text-red-500' : 'text-slate-400'}`}>
                            {charCount} / 300
                        </span>
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the issue (e.g., large pothole on main street)"
                        maxLength={300}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[80px]"
                        required
                    />

                </div>

                <div className="border border-slate-100 bg-slate-50/50 p-3 rounded-xl flex flex-col gap-3">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Information (Optional)</h4>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-600">Name</label>
                        <input
                            type="text"
                            value={reporterName}
                            onChange={(e) => setReporterName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1.5 w-1/2">
                            <label className="text-xs font-semibold text-slate-600">Phone</label>
                            <input
                                type="tel"
                                value={reporterPhone}
                                onChange={(e) => setReporterPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 w-1/2">
                            <label className="text-xs font-semibold text-slate-600">Email</label>
                            <input
                                type="email"
                                value={reporterEmail}
                                onChange={(e) => setReporterEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600">Optional Image</label>
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-indigo-200 rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors">
                            <UploadCloud className="w-4 h-4" />
                            Upload Photo
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        {imageFileName && <span className="text-xs text-slate-500 truncate">{imageFileName}</span>}
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg flex items-start gap-2 border border-slate-100">
                    <div className="text-[10px] text-slate-500 font-mono tracking-tight leading-loose w-full grid grid-cols-2">
                        <div><span className="font-semibold text-slate-400">LAT:</span> {location[0].toFixed(5)}</div>
                        <div><span className="font-semibold text-slate-400">LNG:</span> {location[1].toFixed(5)}</div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || charCount > 300}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white shadow hover:shadow-md transition-all rounded-lg py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 relative overflow-hidden"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">Processing...</span>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit Complaint
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
