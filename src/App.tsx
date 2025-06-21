import React, { useEffect, useState, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import JobcardDashboard from './JobcardDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SplashScreen from './SplashScreen';

interface Message {
  _id: string;
  content?: string;
  sender: string;
  timestamp: string;
  messageType: 'text' | 'image';
  file_id?: string;
  file_unique_id?: string;
  caption?: string;
  file_type?: string;
  whatsappGroup?: string; // WhatsApp group name if WhatsApp
  platform: 'whatsapp' | 'telegram'; // Add platform property
}

interface WhatsAppGroup {
  name: string;
}

const API_URL = 'http://localhost:4000/api';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [filter, setFilter] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState<null | string>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [webhooks, setWebhooks] = useState<string[]>([]);
  const [showSplash, setShowSplash] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/messages`)
      .then(res => res.json())
      .then(setMessages);
    // Real-time updates
    const eventSource = new EventSource(`${API_URL}/messages/stream`);
    eventSource.onmessage = (event) => {
      const newMessages: Message[] = JSON.parse(event.data);
      setMessages(prev => {
        // Avoid duplicates
        const ids = new Set(prev.map(m => m._id));
        return [...prev, ...newMessages.filter(m => !ids.has(m._id))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    };
    eventSourceRef.current = eventSource;
    return () => { eventSource.close(); };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAiResult('');
    const res = await fetch(`${API_URL}/ai-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (data.error) {
      setAiResult(`Error: ${data.error}`);
    } else {
      setAiResult(data.result);
    }
    setLoading(false);
  };

  const handleAddGroup = (name: string) => {
    setGroups([...groups, { name }]);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const tableData = messages.map(m => [
      new Date(m.timestamp).toLocaleString(),
      m.sender,
      m.content || m.caption || '',
      m.platform,
      m.whatsappGroup || '',
      m.messageType,
    ]);
    (doc as any).autoTable({
      head: [['Time', 'Sender', 'Message', 'Platform', 'Group', 'Type']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
      margin: { top: 20 },
    });
    doc.save('messages.pdf');
  };

  const gradientBgStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: -1,
    background: darkMode
      ? 'linear-gradient(135deg, #232b3a 0%, #181c24 100%)'
      : 'linear-gradient(135deg, #90caf9 0%, #fbc2eb 100%)',
    transition: 'background 0.5s',
  };

  const glassStyle: React.CSSProperties = {
    maxWidth: 900,
    margin: '2rem auto',
    fontFamily: 'sans-serif',
    background: darkMode ? 'rgba(24,28,36,0.75)' : 'rgba(255,255,255,0.65)',
    color: darkMode ? '#eee' : '#222',
    borderRadius: 16,
    boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: darkMode ? '1.5px solid rgba(144,202,249,0.12)' : '1.5px solid rgba(255,255,255,0.25)',
    overflow: 'hidden',
    transition: 'background 0.5s, color 0.5s',
  };

  // Admin: Delete message
  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter(m => m._id !== id));
    setNotifications([`Message deleted.`]);
    setTimeout(() => setNotifications([]), 2000);
  };

  // Admin: Pin message
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const handlePinMessage = (id: string) => {
    setPinnedIds(ids => ids.includes(id) ? ids.filter(pid => pid !== id) : [...ids, id]);
    setNotifications([pinnedIds.includes(id) ? 'Message unpinned.' : 'Message pinned!']);
    setTimeout(() => setNotifications([]), 2000);
  };

  // Advanced filter state
  const [advFilter, setAdvFilter] = useState({
    platform: '',
    sender: '',
    group: '',
    dateFrom: '',
    dateTo: '',
    messageType: '',
    keywords: ''
  });

  // Advanced search handler
  const handleAdvancedSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAiResult('');
    const res = await fetch(`${API_URL}/messages/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advFilter)
    });
    const data = await res.json();
    setMessages(data);
    setLoading(false);
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      secondary: { main: '#43a047' },
      background: {
        default: darkMode ? '#181c24' : '#f4f7fa',
        paper: darkMode ? '#232b3a' : '#fff',
      },
    },
    shape: { borderRadius: 14 },
    typography: { fontFamily: 'Inter, Roboto, Arial, sans-serif' },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3 seconds for the splash screen

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 6 }}>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight={700} color="primary">Telegram & WhatsApp Dashboard</Typography>
            <IconButton onClick={() => setDarkMode(dm => !dm)} color="primary">
              {darkMode ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Box>
          {/* Notifications */}
          {notifications.length > 0 && (
            <div style={{ background: '#ffecb3', color: '#795548', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              {notifications.map((n, i) => <div key={i}>{n}</div>)}
            </div>
          )}
          {/* Recent Messages Table with Badges, Threading, Admin Tools */}
          <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: 8, marginBottom: 16 }}>Recent Messages</h2>
          <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, background: darkMode ? 'rgba(24,28,36,0.8)' : 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: darkMode ? '#232b3a' : '#f6f8fa' }}>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 16 }}>Time</th>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 16 }}>Sender</th>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 16 }}>Message</th>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 16 }}>Group/Platform</th>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.filter(m => {
                  const filterLower = filter.toLowerCase();
                  return !filter ||
                    m.sender.toLowerCase().includes(filterLower) ||
                    m.content?.toLowerCase().includes(filterLower) ||
                    m.whatsappGroup?.toLowerCase().includes(filterLower) ||
                    m.platform?.toLowerCase().includes(filterLower);
                }).map(m => (
                  <tr key={m._id} style={pinnedIds.includes(m._id) ? { background: darkMode ? '#2e3b4e' : '#fffde7' } : {}}>
                    <td style={{ padding: 12, fontSize: 14 }}>{new Date(m.timestamp).toLocaleString()}</td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      <span style={{ cursor: 'pointer', color: '#1976d2' }} onClick={() => setShowProfile(m.sender)}>{m.sender}</span>
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {m.messageType === 'image' && m.file_id ? (
                        <div>
                          <img
                            src={`${API_URL}/image/${m.file_id}`}
                            alt={m.caption || 'Telegram image'}
                            style={{ maxWidth: 200, maxHeight: 200, display: 'block', marginBottom: 4 }}
                          />
                          {m.caption && <div style={{ fontStyle: 'italic', color: '#555' }}>{m.caption}</div>}
                        </div>
                      ) : (
                        m.content
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {/* Group/Platform badge using platform property */}
                      {m.platform === 'whatsapp' ? (
                        <span style={{ background: '#43a047', color: '#fff', borderRadius: 6, padding: '2px 8px', marginRight: 4 }}>WhatsApp{m.whatsappGroup ? `: ${m.whatsappGroup}` : ''}</span>
                      ) : (
                        <span style={{ background: '#1976d2', color: '#fff', borderRadius: 6, padding: '2px 8px' }}>Telegram</span>
                      )}
                    </td>
                    <td style={{ padding: 12, fontSize: 14 }}>
                      {/* Admin tools: delete, pin, etc. */}
                      <button onClick={() => handleDeleteMessage(m._id)} style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', marginRight: 4 }}>Delete</button>
                      <button onClick={() => handlePinMessage(m._id)} style={{ background: pinnedIds.includes(m._id) ? '#43a047' : '#fbc02d', color: pinnedIds.includes(m._id) ? '#fff' : '#222', border: 'none', borderRadius: 6, padding: '2px 8px' }}>{pinnedIds.includes(m._id) ? 'Unpin' : 'Pin'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* User Profile Modal */}
          {showProfile && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowProfile(null)}>
              <div style={{ background: darkMode ? '#232b3a' : '#fff', padding: 32, borderRadius: 16, minWidth: 320, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
                <h3>User Profile: {showProfile}</h3>
                {/* User analytics */}
                <div style={{ margin: '16px 0', background: darkMode ? '#181c24' : '#f6f8fa', borderRadius: 10, padding: 12 }}>
                  <b>Total Messages:</b> {messages.filter(m => m.sender === showProfile).length}<br />
                  <b>First Seen:</b> {(() => {
                    const userMsgs = messages.filter(m => m.sender === showProfile);
                    return userMsgs.length ? new Date(userMsgs[userMsgs.length-1].timestamp).toLocaleString() : '-';
                  })()}<br />
                  <b>Last Seen:</b> {(() => {
                    const userMsgs = messages.filter(m => m.sender === showProfile);
                    return userMsgs.length ? new Date(userMsgs[0].timestamp).toLocaleString() : '-';
                  })()}<br />
                  <b>Platforms:</b> {Array.from(new Set(messages.filter(m => m.sender === showProfile).map(m => m.platform))).join(', ')}
                </div>
                <h4 style={{ margin: '12px 0 8px', color: darkMode ? '#90caf9' : '#333' }}>Recent Messages</h4>
                <ul style={{ maxHeight: 120, overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
                  {messages.filter(m => m.sender === showProfile).slice(0, 10).map(m => (
                    <li key={m._id} style={{ marginBottom: 8, background: darkMode ? '#232b3a' : '#f6f8fa', borderRadius: 6, padding: 8 }}>
                      <span style={{ fontSize: 13 }}>{m.content || m.caption || '[Image]'}</span>
                      <span style={{ float: 'right', fontSize: 12, color: '#888' }}>{new Date(m.timestamp).toLocaleString()}</span>
                    </li>
                  ))}
                  {messages.filter(m => m.sender === showProfile).length === 0 && (
                    <li style={{ color: '#888', fontStyle: 'italic' }}>No messages from this user.</li>
                  )}
                </ul>
                <button onClick={() => setShowProfile(null)} style={{ marginTop: 16, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#007bff', color: '#fff' }}>Close</button>
              </div>
            </div>
          )}
          {/* Schedule/Calendar Integration */}
          <div style={{ marginTop: 32, padding: 24, borderRadius: 8, background: darkMode ? '#232b3a' : 'rgba(255,255,255,0.8)', border: '1px solid #ddd' }}>
            <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 24, color: darkMode ? '#90caf9' : '#333' }}>Schedule Dashboard</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 320, background: darkMode ? '#181c24' : '#fff', borderRadius: 10, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Calendar
                  value={selectedDate ? new Date(selectedDate) : undefined}
                  onChange={date => {
                    if (!date) return;
                    if (Array.isArray(date)) {
                      setSelectedDate(date[0] ? date[0].toISOString() : '');
                    } else {
                      setSelectedDate((date as Date).toISOString());
                    }
                  }}
                  calendarType="iso8601"
                />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h4 style={{ margin: '12px 0 8px', color: darkMode ? '#90caf9' : '#333' }}>Messages on Selected Date</h4>
                <ul style={{ maxHeight: 180, overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
                  {messages.filter(m => selectedDate && new Date(m.timestamp).toDateString() === new Date(selectedDate).toDateString()).length === 0 && (
                    <li style={{ color: '#888', fontStyle: 'italic' }}>No messages for this date.</li>
                  )}
                  {messages.filter(m => selectedDate && new Date(m.timestamp).toDateString() === new Date(selectedDate).toDateString()).map(m => (
                    <li key={m._id} style={{ marginBottom: 8, background: darkMode ? '#232b3a' : '#f6f8fa', borderRadius: 6, padding: 8 }}>
                      <b>{m.sender}</b>: {m.content || m.caption || '[Image]'}
                      <span style={{ float: 'right', fontSize: 12, color: '#888' }}>{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* AI Jobcards Section */}
          <JobcardDashboard darkMode={darkMode} />
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
