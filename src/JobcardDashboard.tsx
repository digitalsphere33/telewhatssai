import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

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

const JobcardDashboard: React.FC<{ darkMode?: boolean }> = ({ darkMode }) => {
  const [jobcards, setJobcards] = useState<Jobcard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notification, setNotification] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [editJobcard, setEditJobcard] = useState<Jobcard | null>(null);
  const [editFields, setEditFields] = useState<Partial<Jobcard>>({});
  const [commentText, setCommentText] = useState('');

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

  // Jobcard actions
  const handleMarkDone = (id: string) => {
    setJobcards(jcs => jcs.map(jc => jc._id === id ? { ...jc, status: 'done' } : jc));
    fetch(`${API_URL}/jobcards/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done' })
    });
  };
  const handleDelete = (id: string) => {
    setJobcards(jcs => jcs.filter(jc => jc._id !== id));
    fetch(`${API_URL}/jobcards/${id}`, { method: 'DELETE' });
  };
  const handleEdit = (jc: Jobcard) => {
    setEditJobcard(jc);
    setEditFields(jc);
  };
  const handleEditSave = async () => {
    if (!editJobcard?._id) return;
    const res = await fetch(`${API_URL}/jobcards/${editJobcard._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFields)
    });
    const updated = await res.json();
    setJobcards(jcs => jcs.map(jc => jc._id === updated._id ? updated : jc));
    setEditJobcard(null);
    setEditFields({});
  };
  const handleAssign = async (id: string, userId: string) => {
    const res = await fetch(`${API_URL}/jobcards/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const updated = await res.json();
    setJobcards(jcs => jcs.map(jc => jc._id === updated._id ? updated : jc));
  };
  const handleAddComment = async (id: string) => {
    if (!commentText) return;
    const res = await fetch(`${API_URL}/jobcards/${id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: users[0]?._id, text: commentText })
    });
    const updated = await res.json();
    setJobcards(jcs => jcs.map(jc => jc._id === updated._id ? updated : jc));
    setCommentText('');
  };

  return (
    <div style={{ margin: '32px 0', padding: 24, borderRadius: 8, background: darkMode ? 'rgba(24,28,36,0.95)' : '#f6f8fa', border: darkMode ? '1px solid #333' : '1px solid #ddd', color: darkMode ? '#fff' : '#222' }}>
      <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, color: darkMode ? '#90caf9' : undefined }}>Jobcards</h2>
      <button onClick={fetchAIJobcards} disabled={aiLoading} style={{ marginBottom: 16, padding: '10px 18px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', minWidth: 120 }}>
        {aiLoading ? 'Loading AI Jobcards...' : 'Load AI Jobcards'}
      </button>
      {notification && <div style={{ background: '#ffecb3', color: '#795548', padding: 12, borderRadius: 8, marginBottom: 12 }}>{notification}</div>}
      {aiError && <div style={{ background: '#ffcdd2', color: '#b71c1c', padding: 12, borderRadius: 8, marginBottom: 12 }}>{aiError}</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, overflowX: 'auto', display: 'block' }}>
        <thead>
          <tr style={{ background: darkMode ? '#232b3a' : '#e3f2fd', color: darkMode ? '#90caf9' : undefined }}>
            <th style={{ minWidth: 120, padding: 12 }}>Title</th>
            <th style={{ minWidth: 90, padding: 12 }}>Status</th>
            <th style={{ minWidth: 100, padding: 12 }}>Who</th>
            <th style={{ minWidth: 140, padding: 12 }}>When</th>
            <th style={{ minWidth: 120, padding: 12 }}>Assigned</th>
            <th style={{ minWidth: 120, padding: 12 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobcards.map((jc, idx) => {
            const [showDetails, setShowDetails] = useState(false);
            return (
              <React.Fragment key={jc._id || idx}>
                <tr style={{ background: darkMode ? (jc.status === 'done' ? '#2e7d32' : jc.status === 'in progress' ? '#bfa900' : '#232b3a') : (jc.status === 'done' ? '#c8e6c9' : jc.status === 'in progress' ? '#fff9c4' : '#fff'), color: darkMode ? '#fff' : undefined }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>
                    {jc.title || '-'}
                    <button onClick={() => setShowDetails(d => !d)} style={{ marginLeft: 8, fontSize: 12, padding: '2px 8px', borderRadius: 6, border: 'none', background: '#eee', color: '#1976d2', cursor: 'pointer' }}>
                      {showDetails ? 'Hide' : 'Details'}
                    </button>
                  </td>
                  <td style={{ padding: 12 }}>{jc.status || '-'}</td>
                  <td style={{ padding: 12 }}>{jc.who || '-'}</td>
                  <td style={{ padding: 12 }}>{jc.when ? new Date(jc.when).toLocaleString() : '-'}</td>
                  <td style={{ padding: 12 }}>
                    <select value={jc.assignedTo?._id || ''} onChange={e => handleAssign(jc._id!, e.target.value)} style={{ background: darkMode ? '#232b3a' : undefined, color: darkMode ? '#fff' : undefined }}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u._id} value={u._id}>{u.displayName || u.username}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button onClick={() => handleMarkDone(jc._id!)} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#388e3c', color: '#fff' }}>Done</button>
                    <button onClick={() => handleEdit(jc)} style={{ marginRight: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff' }}>Edit</button>
                    <button onClick={() => handleDelete(jc._id!)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#b71c1c', color: '#fff' }}>Delete</button>
                  </td>
                </tr>
                {showDetails && (
                  <tr style={{ background: darkMode ? '#1a1d24' : '#f9f9f9', color: darkMode ? '#90caf9' : '#333' }}>
                    <td colSpan={6} style={{ padding: 16 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                        <div><b>What:</b> {jc.what || '-'}</div>
                        <div><b>Where:</b> {jc.where || '-'}</div>
                        <div><b>Trophy:</b> {jc.trophyDetails || '-'}</div>
                        <div><b>Contact:</b> {jc.contactInfo || '-'}</div>
                        <div><b>Notes:</b> {jc.specialInstructions || '-'}</div>
                      </div>
                    </td>
                  </tr>
                )}
                {/* Comments row */}
                <tr key={jc._id + '-comments'} style={{ background: darkMode ? '#1a1d24' : '#f9f9f9', color: darkMode ? '#90caf9' : '#333' }}>
                  <td colSpan={6}>
                    <b>Comments:</b>
                    <ul style={{ maxHeight: 80, overflowY: 'auto', margin: 0, padding: 0, listStyle: 'none' }}>
                      {jc.comments?.map((c, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <span>{c.text}</span>
                          <span style={{ float: 'right', fontSize: 12, color: darkMode ? '#90caf9' : '#888' }}>{c.user?.displayName || c.user?.username || 'User'} @ {new Date(c.timestamp).toLocaleString()}</span>
                        </li>
                      ))}
                      {(!jc.comments || jc.comments.length === 0) && <li style={{ color: '#888', fontStyle: 'italic' }}>No comments yet.</li>}
                    </ul>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..." style={{ flex: 1, padding: 6, borderRadius: 6, border: '1px solid #bbb' }} />
                      <button onClick={() => handleAddComment(jc._id!)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff' }}>Add</button>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {/* Edit Jobcard Modal */}
      <Dialog open={!!editJobcard} onClose={() => setEditJobcard(null)}>
        <DialogTitle>Edit Jobcard</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 320 }}>
            <input value={editFields.title || ''} onChange={e => setEditFields(f => ({ ...f, title: e.target.value }))} placeholder="Title" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.who || ''} onChange={e => setEditFields(f => ({ ...f, who: e.target.value }))} placeholder="Who" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.what || ''} onChange={e => setEditFields(f => ({ ...f, what: e.target.value }))} placeholder="What" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.where || ''} onChange={e => setEditFields(f => ({ ...f, where: e.target.value }))} placeholder="Where" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input type="datetime-local" value={editFields.when || ''} onChange={e => setEditFields(f => ({ ...f, when: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.trophyDetails || ''} onChange={e => setEditFields(f => ({ ...f, trophyDetails: e.target.value }))} placeholder="Trophy Details" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.contactInfo || ''} onChange={e => setEditFields(f => ({ ...f, contactInfo: e.target.value }))} placeholder="Contact Info" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
            <input value={editFields.specialInstructions || ''} onChange={e => setEditFields(f => ({ ...f, specialInstructions: e.target.value }))} placeholder="Special Instructions" style={{ padding: 8, borderRadius: 6, border: '1px solid #bbb' }} />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditJobcard(null)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default JobcardDashboard;
