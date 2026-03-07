import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NewsArticle {
    title: string;
    link: string;
    description: string;
    date?: string;
    source?: string;
}

export function NewsFeed() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNews = () => {
            fetch('http://localhost:3001/api/news')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        // Show at most 5 latest news items
                        setNews(data.slice(0, 5));
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch news:", err);
                    setLoading(false);
                });
        };

        // Initial load
        loadNews();

        // Check for live updates every 60 seconds
        const intervalId = setInterval(loadNews, 60000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl w-full border border-slate-100 shrink-0">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Newspaper className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                        City Updates
                    </h1>
                    <p className="text-slate-500 text-xs">
                        Live from Bright Data Feed
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="animate-pulse flex flex-col gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-slate-100 rounded-xl w-full"></div>
                        ))}
                    </div>
                ) : news.length > 0 ? (
                    <div className="flex flex-col gap-3">
                        <AnimatePresence>
                            {news.map((item, index) => (
                                <motion.a
                                    key={index}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="group flex flex-col p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                                >
                                    <div className="flex justify-between items-start gap-2 mb-1">
                                        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                                        <Clock className="w-3 h-3" />
                                        <span>Recent</span>
                                    </div>
                                </motion.a>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                        No recent news available at this time.
                    </div>
                )}
            </div>
        </div>
    );
}
