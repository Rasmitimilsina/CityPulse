import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Map } from './components/Map';
import { Header } from './components/Header';
import { ComplaintForm } from './components/ComplaintForm';
import incidentsData from '../incidents.json';
import { Incident, calculateNeighborhoodRisks, NeighborhoodRisk } from './utils/risk';
import { Complaint, validateComplaint, Department } from './utils/complaints';

import { ComplaintDashboard } from './components/ComplaintDashboard';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { StatusTracker } from './components/StatusTracker';
import { NewsFeed } from './components/NewsFeed';

const initialIncidents = incidentsData as Incident[];

const API_URL = '/api';

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [risks, setRisks] = useState<NeighborhoodRisk[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null);

  useEffect(() => {
    // Initial data load
    Promise.all([
      fetch(`${API_URL}/incidents`).then(res => res.json()),
      fetch(`${API_URL}/hotspots`).then(res => res.json()),
      fetch(`${API_URL}/analytics`).then(res => res.json())
    ]).then(([fetchedIncidents, fetchedRisks, fetchedAnalytics]) => {
      setIncidents(fetchedIncidents);
      setRisks(fetchedRisks);
      setAnalytics(fetchedAnalytics);
    }).catch(err => console.error("Error fetching initial data:", err));
  }, []);

  // For Citizen Reporting - will hold coordinates of map click
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const handleMapClick = (latlng: [number, number]) => {
    setSelectedLocation(latlng);
  };

  const handleComplaintSubmit = async (newComplaint: Complaint) => {
    try {
      const response = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: newComplaint.id,
          category: newComplaint.category,
          description: newComplaint.description,
          latitude: newComplaint.latitude,
          longitude: newComplaint.longitude,
          priority: newComplaint.priority,
          department: newComplaint.department,
          status: newComplaint.status,
          reporterName: newComplaint.reporterName,
          reporterPhone: newComplaint.reporterPhone,
          reporterEmail: newComplaint.reporterEmail
        })
      });

      const savedComplaint = await response.json();
      setComplaints(prev => [...prev, savedComplaint]);

      // Refresh hotspots and analytics after a new complaint
      fetch(`${API_URL}/hotspots`).then(res => res.json()).then(setRisks);
      fetch(`${API_URL}/analytics`).then(res => res.json()).then(setAnalytics);

    } catch (err) {
      console.error("Error submitting complaint:", err);
      // Fallback optimistic update
      setComplaints(prev => [...prev, newComplaint]);
    }

    setSelectedLocation(null);
  };

  const handleValidateComplaint = (id: string, type: 'confirm' | 'reject') => {
    // Ideally this would be a PUT/PATCH to the respective API.
    // We are mocking this update purely on the frontend state for the demo,
    // as Phase 13 didn't explicitly request an API route for validations.
    setComplaints(prev => prev.map(c =>
      c.id === id ? validateComplaint(c, type) : c
    ));
  };

  return (
    <div className="h-screen w-full bg-slate-50 overflow-hidden flex flex-col font-sans">
      <Header onSelectDepartment={setActiveDepartment} currentDepartment={activeDepartment} />

      {activeDepartment ? (
        <div className="flex-1 w-full h-full relative overflow-hidden">
          <DepartmentDashboard department={activeDepartment} />
        </div>
      ) : (
        <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-[420px] bg-slate-50/90 backdrop-blur-md border-r border-slate-200 p-4 shrink-0 z-10 flex flex-col gap-6 overflow-y-auto h-full shadow-lg">
            {!selectedLocation ? (
              <>
                <Dashboard
                  totalIncidents={incidents.length + (analytics?.totalComplaints || 0)}
                  topTypes={(Object.entries(
                    incidents.reduce((acc, incident) => {
                      acc[incident.type] = (acc[incident.type] || 0) + 1;
                      return acc;
                    }, { ...(analytics?.byCategory || {}) } as Record<string, number>)
                  ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3)}
                  risks={risks}
                />
                <StatusTracker />
                <ComplaintDashboard
                  total={analytics?.totalComplaints || 0}
                  highPriority={complaints.filter(c => c.priority === 'High').length}
                  categoryCounts={analytics?.byCategory || {}}
                />
                <NewsFeed />
              </>
            ) : (
              <ComplaintForm
                location={selectedLocation}
                onCancel={() => setSelectedLocation(null)}
                onSubmit={handleComplaintSubmit}
              />
            )}
          </div>

          {/* Map Area */}
          <div className="flex-1 relative z-0">
            <Map
              incidents={incidents}
              risks={risks}
              complaints={complaints}
              onMapClick={handleMapClick}
              onValidateComplaint={handleValidateComplaint}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
