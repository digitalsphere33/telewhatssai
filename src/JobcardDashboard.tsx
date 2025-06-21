import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:4000/api';

export interface Jobcard {
  _id?: string;
  title?: string;
  description?: string;
  who?: string;
  what?: string;
  where?: string;
  when?: string;
  trophyDetails?: string;
  contactInfo?: string;
  specialInstructions?: string;
  status?: 'open' | 'in progress' | 'done';
  assignedTo?: any;
  createdBy?: any;
  comments?: { user: any; text: string; timestamp: string }[];
  platform?: 'telegram' | 'whatsapp';
  messageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  username: string;
  displayName?: string;
  email?: string;
  role?: string;
}

const JobcardDashboard: React.FC = () => {
  const [jobcards, setJobcards] = useState<Jobcard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Fetch users and manual jobcards
  useEffect(() => {
    fetch(`${API_URL}/users`).then(res => res.json()).then(setUsers);
    fetch(`${API_URL}/jobcards`).then(res => res.json()).then(setJobcards);
  }, []);

  // Fetch AI jobcards
  const fetchAIJobcards = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch(`${API_URL}/ai-jobcards`);
      const data = await res.json();
      if (data.jobcards && Array.isArray(data.jobcards)) {
        setJobcards(jcs => [...data.jobcards, ...jcs]);
        setNotification('AI jobcards loaded!');
      } else if (data.raw) {
        setAiError('AI did not return valid jobcards. Raw output: ' + JSON.stringify(data.raw));
      } else {
        setAiError('No jobcards found.');
      }
    } catch (e) {
      setAiError('Failed to fetch AI jobcards.');
    }
    setAiLoading(false);
    setTimeout(() => setNotification(''), 2000);
  };

  return (
    <div style={{ margin: '32px 0', padding: 24, borderRadius: 8, background: '#f6f8fa', border: '1px solid #ddd' }}>
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24 }}>Jobcards</h2>
      <button onClick={fetchAIJobcards} disabled={aiLoading} style={{ marginBottom: 16, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', minWidth: 120 }}>
        {aiLoading ? 'Loading AI Jobcards...' : 'Load AI Jobcards'}
      </button>
      {notification && <div style={{ background: '#ffecb3', color: '#795548', padding: 12, borderRadius: 8, marginBottom: 12 }}>{notification}</div>}
      {aiError && <div style={{ background: '#ffcdd2', color: '#b71c1c', padding: 12, borderRadius: 8, marginBottom: 12 }}>{aiError}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ background: '#e3f2fd' }}>
            <th>Title</th>
            <th>Status</th>
            <th>Who</th>
            <th>What</th>
            <th>Where</th>
            <th>When</th>
            <th>Trophy Details</th>
            <th>Contact Info</th>
            <th>Special Instructions</th>
          </tr>
        </thead>
        <tbody>
          {jobcards.map((jc, idx) => (
            <tr key={jc._id || idx} style={{ background: jc.status === 'done' ? '#c8e6c9' : jc.status === 'in progress' ? '#fff9c4' : '#fff' }}>
              <td style={{ padding: 8 }}>{jc.title || '-'}</td>
              <td style={{ padding: 8 }}>{jc.status || '-'}</td>
              <td style={{ padding: 8 }}>{jc.who || '-'}</td>
              <td style={{ padding: 8 }}>{jc.what || '-'}</td>
              <td style={{ padding: 8 }}>{jc.where || '-'}</td>
              <td style={{ padding: 8 }}>{jc.when ? new Date(jc.when).toLocaleString() : '-'}</td>
              <td style={{ padding: 8 }}>{jc.trophyDetails || '-'}</td>
              <td style={{ padding: 8 }}>{jc.contactInfo || '-'}</td>
              <td style={{ padding: 8 }}>{jc.specialInstructions || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JobcardDashboard;
