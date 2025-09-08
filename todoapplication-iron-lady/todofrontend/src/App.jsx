import React,{useState,useEffect} from 'react';
import { Plus, Trash2, Edit3, Check, Clock, Brain, BarChart3, Filter, Search, Calendar, X, CheckSquare, Square, AlertCircle, TrendingUp, Target, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [filters, setFilters] = useState({
    priority: 'all',
    category: 'all',
    status: 'all'
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: '',
    estimatedTime: ''
  });

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (userToken) {
      fetchTodos();
      fetchAnalytics();
    }
  }, [userToken]);

  useEffect(() => {
    applyFilters();
  }, [todos, searchQuery, filters]);

  const initializeUser = async () => {
    let token = localStorage.getItem('todo-user-token');
    
    if (!token) {
      try {
        const response = await fetch(`${API_URL}/generate-token`, { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          token = data.token;
          localStorage.setItem('todo-user-token', token);
        } else {
          throw new Error('Failed to generate token from server');
        }
      } catch (error) {
        console.error('Error generating token:', error);
        // Fallback for when the backend is not reachable on first load
        token = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('todo-user-token', token);
      }
    }
    
    setUserToken(token);
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'User-Token': userToken
  });

  const fetchTodos = async () => {
    if (!userToken) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/todos`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      } else {
        console.error('Failed to fetch todos, server responded with:', response.status);
        setTodos([]);
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!userToken) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai-suggestions`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
         console.error('Failed to fetch AI suggestions');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`${API_URL}/analytics`, { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...todos];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(query) ||
        (todo.description && todo.description.toLowerCase().includes(query)) ||
        (todo.category && todo.category.toLowerCase().includes(query))
      );
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === filters.priority);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(todo => (todo.category || 'Uncategorized') === filters.category);
    }

    if (filters.status === 'completed') {
      filtered = filtered.filter(todo => todo.completed);
    } else if (filters.status === 'pending') {
      filtered = filtered.filter(todo => !todo.completed);
    } else if (filters.status === 'overdue') {
      filtered = filtered.filter(todo => !todo.completed && isOverdue(todo.dueDate));
    }

    setFilteredTodos(filtered);
  };

  const saveTodo = async () => {
    if (!formData.title.trim() || !userToken) return;

    setLoading(true);
    try {
      const url = editingId ? `${API_URL}/todos/${editingId}` : `${API_URL}/todos`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime, 10) : null
        })
      });

      if (response.ok) {
        resetForm();
        await fetchTodos();
        await fetchAnalytics();
      } else {
        console.error('Failed to save todo');
      }
    } catch (error) {
      console.error('Error saving todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTodo = async (id) => {
    if (!userToken) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.ok) {
        await fetchTodos();
        await fetchAnalytics();
        setSelectedTodos(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (id, completed) => {
    if (!userToken) return;
    
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ completed: !completed })
      });
      if (response.ok) {
        await fetchTodos();
        await fetchAnalytics();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const startEdit = (todo) => {
    setFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      category: todo.category || '',
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
      estimatedTime: todo.estimatedTime || ''
    });
    setEditingId(todo._id);
    setShowForm(true);
  };

    const addSuggestion = async (suggestion) => {
    if (!userToken) return;
    setLoading(true);
    try {
      const suggestionPayload = {
        ...suggestion,
        priority: suggestion.priority ? suggestion.priority.toLowerCase() : 'medium', 
        aiGenerated: true
      };
      
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(suggestionPayload)
      });

      if (response.ok) {
        await fetchTodos();
        await fetchAnalytics();
        // Remove the suggestion from the list after it's been successfully added
        setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
        // Hide the suggestion panel if it was the last one
        if(suggestions.length <= 1) setShowSuggestions(false);
      } else {
          const errorData = await response.json();
          console.error('Error adding suggestion:', errorData);
      }
    } catch (error) {
      console.error('Error adding suggestion:', error);
    } finally {
        setLoading(false);
    }
  };

  const bulkAction = async (action) => {
    if (!userToken || selectedTodos.size === 0) return;
    setLoading(true);
    const selectedIds = Array.from(selectedTodos);
    try {
        const response = await fetch(`${API_URL}/todos/bulk`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action, ids: selectedIds })
        });
        if (response.ok) {
            await fetchTodos();
            await fetchAnalytics();
            setSelectedTodos(new Set());
        }
    } catch (error) {
        console.error(`Error with bulk ${action}:`, error);
    } finally {
        setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', priority: 'medium', category: '', dueDate: '', estimatedTime: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const toggleTodoSelection = (id) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllTodos = () => setSelectedTodos(new Set(filteredTodos.map(todo => todo._id)));
  const clearSelection = () => setSelectedTodos(new Set());
  
  const getPriorityColor = (priority) => ({ high: '#ef4444', medium: '#f59e0b', low: '#10b981' }[priority] || '#6b7280');
  const getPriorityBgColor = (priority) => ({ high: '#fee2e2', medium: '#fef3c7', low: '#dcfce7' }[priority] || '#f3f4f6');
  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  const getCategories = () => Array.from(new Set(todos.map(todo => todo.category).filter(Boolean)));
  
  const formatEstimatedTime = (minutes) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m` : ''}`.trim();
  };
  
  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (!userToken) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px', padding: '2rem', textAlign: 'center' }}>
          <h2>Initializing your workspace...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 0.5rem 0' }}>Smart Todo</h1>
              <p style={{ color: '#64748b', margin: '0', fontSize: '1.1rem' }}>Organize your life with AI-powered productivity</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => setShowAnalytics(!showAnalytics)} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: showAnalytics ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white', color: showAnalytics ? 'white' : '#374151', border: '1px solid #e5e7eb', borderRadius: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                <BarChart3 size={18} /> Analytics
              </button>
              <button onClick={fetchSuggestions} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                <Brain size={18} /> AI Suggest
              </button>
              <button onClick={() => { setEditingId(null); setShowForm(true); }} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                <Plus size={18} /> New Task
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && analytics && (
            <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={24} /> Performance Analytics</h3>
                    <button onClick={() => setShowAnalytics(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    {[{label: 'Total Tasks', value: analytics.total, gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}, {label: 'Completed', value: analytics.completed, gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)'}, {label: 'Pending', value: analytics.pending, gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}, {label: 'Overdue', value: analytics.overdue, gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'}].map(stat => (
                        <div key={stat.label} style={{ background: stat.gradient, color: 'white', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{stat.value || 0}</div>
                            <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '0.75rem' }}>Completion Rate: {analytics.completionRate || 0}%</div>
                    <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${analytics.completionRate || 0}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', transition: 'width 0.5s ease-in-out' }} />
                    </div>
                </div>
            </div>
        )}
        
        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e40af', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Brain size={24} /> AI Suggestions</h3>
              <button onClick={() => setShowSuggestions(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.5rem' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {suggestions.map((suggestion, index) => (
                <div key={index} style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{suggestion.title}</h4>
                      <p style={{ color: '#6b7280', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{suggestion.description}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: getPriorityBgColor(suggestion.priority), color: getPriorityColor(suggestion.priority) }}>{suggestion.priority} priority</span>
                        {suggestion.category && <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: '#f3f4f6', color: '#374151' }}>{suggestion.category}</span>}
                        {suggestion.estimatedTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1' }}><Clock size={12} /> {formatEstimatedTime(suggestion.estimatedTime)}</span>}
                      </div>
                    </div>
                    <button onClick={() => addSuggestion(suggestion)} disabled={loading} style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: loading ? 0.7 : 1 }}>Add Task</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Search and Filters */}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
                    <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.75rem 2.5rem', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem', background: '#f9fafb' }}/>
                </div>
                <button onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', fontWeight: '500' }}>
                    <Filter size={18} /> Filters <ChevronDown size={16} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
                </button>
                {selectedTodos.size > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => bulkAction('complete')} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: loading ? 0.7 : 1 }}><CheckSquare size={16} /> Complete ({selectedTodos.size})</button>
                        <button onClick={() => bulkAction('delete')} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: loading ? 0.7 : 1 }}><Trash2 size={16} /> Delete ({selectedTodos.size})</button>
                    </div>
                )}
            </div>
            {showFilters && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {[{label: 'Priority', value: filters.priority, action: (v) => setFilters({...filters, priority: v}), options: ['all', 'high', 'medium', 'low']}, {label: 'Category', value: filters.category, action: (v) => setFilters({...filters, category: v}), options: ['all', ...getCategories()]}, {label: 'Status', value: filters.status, action: (v) => setFilters({...filters, status: v}), options: ['all', 'pending', 'completed', 'overdue']}].map(filter => (
                        <div key={filter.label}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>{filter.label}</label>
                            <select value={filter.value} onChange={(e) => filter.action(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                                {filter.options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Todo List */}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>Tasks ({filteredTodos.length}) {loading && !showForm && <span style={{ fontSize: '0.9rem', color: '#6b7280' }}> Loading...</span>}</h3>
            {filteredTodos.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={selectAllTodos} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#6366f1', border: '1px solid #6366f1', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Select All</button>
                <button onClick={clearSelection} disabled={loading} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>Clear</button>
              </div>
            )}
          </div>
          {filteredTodos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
              <Target size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h4 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>{loading ? 'Loading tasks...' : 'No tasks found'}</h4>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{loading ? 'Please wait...' : searchQuery || filters.status !== 'all' ? 'Try adjusting your search or filters' : 'Create your first task to get started!'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredTodos.map((todo) => (
                <div key={todo._id} style={{ background: todo.completed ? '#f0fdf4' : isOverdue(todo.dueDate) ? '#fef2f2' : 'white', border: `1px solid ${todo.completed ? '#bbf7d0' : isOverdue(todo.dueDate) ? '#fecaca' : '#e5e7eb'}`, borderRadius: '12px', padding: '1.25rem', opacity: todo.completed ? 0.8 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <button onClick={() => toggleTodoSelection(todo._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: selectedTodos.has(todo._id) ? '#6366f1' : '#9ca3af' }}>{selectedTodos.has(todo._id) ? <CheckSquare size={20} /> : <Square size={20} />}</button>
                    <button onClick={() => toggleComplete(todo._id, todo.completed)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: todo.completed ? '#10b981' : '#9ca3af' }}>{todo.completed ? <CheckSquare size={20} /> : <Square size={20} />}</button>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: todo.completed ? '#6b7280' : '#1f2937', textDecoration: todo.completed ? 'line-through' : 'none', margin: 0 }}>{todo.title}</h4>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getPriorityColor(todo.priority) }} />
                            {todo.aiGenerated && <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: '600', borderRadius: '12px', background: 'linear-gradient(135deg, #a5b4fc 0%, #c4b5fd 100%)', color: '#4338ca' }}>AI</span>}
                            {isOverdue(todo.dueDate) && !todo.completed && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.1rem 0.5rem', fontSize: '0.75rem', fontWeight: '600', borderRadius: '12px', background: '#fee2e2', color: '#dc2626' }}><AlertCircle size={12} /> Overdue</span>}
                        </div>
                        {todo.description && <p style={{ color: '#6b7280', margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{todo.description}</p>}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: getPriorityBgColor(todo.priority), color: getPriorityColor(todo.priority) }}>{todo.priority} priority</span>
                            {todo.category && <span style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: '#f3f4f6', color: '#374151' }}>{todo.category}</span>}
                            {todo.dueDate && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: isOverdue(todo.dueDate) && !todo.completed ? '#fee2e2' : '#e0f2fe', color: isOverdue(todo.dueDate) && !todo.completed ? '#dc2626' : '#0369a1' }}><Calendar size={12} /> {formatDate(todo.dueDate)}</span>}
                            {todo.estimatedTime && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem', fontWeight: '500', borderRadius: '20px', background: '#f0f9ff', color: '#0369a1' }}><Clock size={12} /> {formatEstimatedTime(todo.estimatedTime)}</span>}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button onClick={() => startEdit(todo)} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#6b7280' }}><Edit3 size={16} /></button>
                        <button onClick={() => deleteTodo(todo._id)} disabled={loading} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: '#6b7280' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Add/Edit Form Modal */}
        {showForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{editingId ? 'Edit Task' : 'Create New Task'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title *" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Description" rows={3} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                            </select>
                            <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Category" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                            <input type="number" value={formData.estimatedTime} onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})} placeholder="Est. Time (min)" min="1" style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}/>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button onClick={resetForm} style={{ flex: 1, padding: '0.75rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveTodo} disabled={!formData.title.trim() || loading} style={{ flex: 1, padding: '0.75rem', background: !formData.title.trim() ? '#d1d5db' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: !formData.title.trim() ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TodoApp;