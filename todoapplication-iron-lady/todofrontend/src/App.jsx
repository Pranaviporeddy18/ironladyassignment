import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, Clock, Brain, BarChart3, Filter, Search, Calendar, X, CheckSquare, Square, AlertCircle, TrendingUp, Target, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [filteredTodos, setFilteredTodos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
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

const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    fetchTodos();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [todos, searchQuery, filters]);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
      });
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.log(error);

      setTodos([
        {
          _id: '1',
          title: 'Complete project documentation',
          description: 'Write comprehensive documentation for the new feature including API specs and user guides',
          priority: 'high',
          category: 'Work',
          dueDate: '2025-09-12',
          completed: false,
          aiGenerated: false,
          estimatedTime: 120,
          createdAt: '2025-09-08T10:00:00Z'
        },
        {
          _id: '2',
          title: 'Review pull requests',
          description: 'Review and provide feedback on team pull requests',
          priority: 'medium',
          category: 'Work',
          dueDate: '2025-09-09',
          completed: false,
          aiGenerated: true,
          estimatedTime: 60,
          createdAt: '2025-09-08T09:00:00Z'
        },
        {
          _id: '3',
          title: 'Buy groceries for the week',
          description: 'Get milk, eggs, bread, vegetables, and fruits from the local market',
          priority: 'medium',
          category: 'Personal',
          dueDate: '2025-09-08',
          completed: true,
          aiGenerated: false,
          estimatedTime: 45,
          createdAt: '2025-09-07T15:00:00Z'
        },
        {
          _id: '4',
          title: 'Exercise session',
          description: '30-minute cardio workout at the gym',
          priority: 'high',
          category: 'Health',
          dueDate: '2025-09-08',
          completed: false,
          aiGenerated: true,
          estimatedTime: 30,
          createdAt: '2025-09-08T06:00:00Z'
        },
        {
          _id: '5',
          title: 'Read quarterly reports',
          description: 'Analyze Q3 performance metrics and prepare insights',
          priority: 'low',
          category: 'Work',
          dueDate: '2025-09-15',
          completed: false,
          aiGenerated: false,
          estimatedTime: 90,
          createdAt: '2025-09-07T14:00:00Z'
        }
      ]);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch(`${API_URL}/ai-suggestions`, {
        headers: { 'X-Session-ID': sessionId }
      });
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.log(error);
      setSuggestions([
        {
          title: 'Schedule weekly team standup',
          description: 'Coordinate with team members for regular progress updates',
          priority: 'medium',
          category: 'Work',
          estimatedTime: 30
        },
        {
          title: 'Update portfolio website',
          description: 'Add recent projects and refresh the design',
          priority: 'low',
          category: 'Personal',
          estimatedTime: 180
        },
        {
          title: 'Plan weekend hiking trip',
          description: 'Research trails and prepare gear for outdoor adventure',
          priority: 'low',
          category: 'Recreation',
          estimatedTime: 60
        }
      ]);
      setShowSuggestions(true);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics`, {
        headers: { 'X-Session-ID': sessionId }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.log(error);
      setAnalytics({
        total: 5,
        completed: 1,
        pending: 4,
        overdue: 1,
        completionRate: 20,
        categoryStats: {
          'Work': { total: 3, completed: 0 },
          'Personal': { total: 1, completed: 1 },
          'Health': { total: 1, completed: 0 }
        }
      });
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
      filtered = filtered.filter(todo => todo.category === filters.category);
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
    if (!formData.title.trim()) return;

    try {
      const url = editingId ? `${API_URL}/todos/${editingId}` : `${API_URL}/todos`;
      const method = editingId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null
        })
      });
      
      resetForm();
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.log(error);

      const newTodo = {
        _id: Date.now().toString(),
        ...formData,
        completed: false,
        aiGenerated: false,
        createdAt: new Date().toISOString(),
        estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null
      };
      
      if (editingId) {
        setTodos(todos.map(todo => todo._id === editingId ? { ...todo, ...formData } : todo));
      } else {
        setTodos([...todos, newTodo]);
      }
      
      resetForm();
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: { 'X-Session-ID': sessionId }
      });
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.log(error);
      setTodos(todos.filter(todo => todo._id !== id));
    }
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const toggleComplete = async (id, completed) => {
    try {
      await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ completed: !completed })
      });
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.log(error);

      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
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
    try {
      await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ ...suggestion, aiGenerated: true })
      });
      fetchTodos();
      fetchAnalytics();
      setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
    } catch (error) {
      console.log(error);
      const newTodo = {
        _id: Date.now().toString(),
        ...suggestion,
        completed: false,
        aiGenerated: true,
        createdAt: new Date().toISOString()
      };
      setTodos([...todos, newTodo]);
      setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
    }
  };

  const bulkDelete = async () => {
    const selectedIds = Array.from(selectedTodos);
    try {
      await fetch(`${API_URL}/todos/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ action: 'delete', ids: selectedIds })
      });
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.log(error);
      setTodos(todos.filter(todo => !selectedIds.includes(todo._id)));
    }
    setSelectedTodos(new Set());
  };

  const bulkComplete = async () => {
    const selectedIds = Array.from(selectedTodos);
    try {
      await fetch(`${API_URL}/todos/bulk`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify({ action: 'complete', ids: selectedIds })
      });
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.log(error);

      setTodos(todos.map(todo => 
        selectedIds.includes(todo._id) ? { ...todo, completed: true } : todo
      ));
    }
    setSelectedTodos(new Set());
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      dueDate: '',
      estimatedTime: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const toggleTodoSelection = (id) => {
    setSelectedTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllTodos = () => {
    const visibleTodoIds = filteredTodos.map(todo => todo._id);
    setSelectedTodos(new Set(visibleTodoIds));
  };

  const clearSelection = () => {
    setSelectedTodos(new Set());
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      case 'low': return '#dcfce7';
      default: return '#f3f4f6';
    }
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  const getCategories = () => {
    const categories = new Set(todos.map(todo => todo.category).filter(Boolean));
    return Array.from(categories);
  };

  const formatEstimatedTime = (minutes) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
    }
    return `${mins}m`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 0.5rem 0'
              }}>
                Smart Todo
              </h1>
              <p style={{
                color: '#64748b',
                margin: '0',
                fontSize: '1.1rem'
              }}>
                Organize your life with AI-powered productivity
              </p>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: showAnalytics ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.8)',
                  color: showAnalytics ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <BarChart3 size={18} />
                Analytics
              </button>
              
              <button
                onClick={fetchSuggestions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <Brain size={18} />
                AI Suggest
              </button>
              
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
              >
                <Plus size={18} />
                New Task
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <TrendingUp size={24} />
                Performance Analytics
              </h3>
              <button
                onClick={() => setShowAnalytics(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {analytics.total || 0}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Total Tasks</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {analytics.completed || 0}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Completed</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {analytics.pending || 0}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Pending</div>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                  {analytics.overdue || 0}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: '0.9' }}>Overdue</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                Completion Rate: {analytics.completionRate || 0}%
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                background: '#e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${analytics.completionRate || 0}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                  transition: 'all 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* AI Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: '#1e40af',
                margin: '0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Brain size={24} />
                AI Suggestions
              </h3>
              <button
                onClick={() => setShowSuggestions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {suggestions.map((suggestion, index) => (
                <div key={index} style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {suggestion.title}
                      </h4>
                      <p style={{
                        color: '#6b7280',
                        margin: '0 0 1rem 0',
                        fontSize: '0.95rem',
                        lineHeight: '1.5'
                      }}>
                        {suggestion.description}
                      </p>
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          borderRadius: '20px',
                          background: getPriorityBgColor(suggestion.priority),
                          color: getPriorityColor(suggestion.priority)
                        }}>
                          {suggestion.priority} priority
                        </span>
                        {suggestion.category && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: '#f3f4f6',
                            color: '#374151'
                          }}>
                            {suggestion.category}
                          </span>
                        )}
                        {suggestion.estimatedTime && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: '#e0f2fe',
                            color: '#0369a1'
                          }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                            {formatEstimatedTime(suggestion.estimatedTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => addSuggestion(suggestion)}
                      style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              position: 'relative',
              flex: '1',
              minWidth: '250px'
            }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '0.95rem',
                  background: 'white',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: showFilters ? '#6366f1' : 'white',
                color: showFilters ? 'white' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <Filter size={18} />
              Filters
              <ChevronDown size={16} style={{
                transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }} />
            </button>

            {selectedTodos.size > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={bulkComplete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  <CheckSquare size={16} />
                  Complete ({selectedTodos.size})
                </button>
                <button
                  onClick={bulkDelete}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  <Trash2 size={16} />
                  Delete ({selectedTodos.size})
                </button>
              </div>
            )}
          </div>

          {showFilters && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(249, 250, 251, 0.8)',
              borderRadius: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white'
                  }}
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white'
                  }}
                >
                  <option value="all">All Categories</option>
                  {getCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: 'white'
                  }}
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Todo List */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#1f2937',
              margin: '0'
            }}>
              Tasks ({filteredTodos.length})
            </h3>
            {filteredTodos.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={selectAllTodos}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: '#6366f1',
                    border: '1px solid #6366f1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {filteredTodos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              color: '#6b7280'
            }}>
              <Target size={48} style={{ margin: '0 auto 1rem auto', opacity: '0.5' }} />
              <h4 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0 0 0.5rem 0'
              }}>
                No tasks found
              </h4>
              <p style={{ margin: '0', fontSize: '0.95rem' }}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {filteredTodos.map((todo) => (
                <div
                  key={todo._id}
                  style={{
                    background: todo.completed 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
                      : isOverdue(todo.dueDate) 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                        : 'white',
                    border: `1px solid ${
                      todo.completed 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : isOverdue(todo.dueDate) 
                          ? 'rgba(239, 68, 68, 0.2)'
                          : '#e5e7eb'
                    }`,
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.2s ease',
                    opacity: todo.completed ? '0.8' : '1'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <button
                      onClick={() => toggleTodoSelection(todo._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: selectedTodos.has(todo._id) ? '#6366f1' : '#d1d5db'
                      }}
                    >
                      {selectedTodos.has(todo._id) ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>

                    <button
                      onClick={() => toggleComplete(todo._id, todo.completed)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: todo.completed ? '#10b981' : '#d1d5db'
                      }}
                    >
                      {todo.completed ? <Check size={20} /> : <Square size={20} />}
                    </button>

                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: todo.completed ? '#6b7280' : '#1f2937',
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          margin: '0'
                        }}>
                          {todo.title}
                        </h4>
                        
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: getPriorityColor(todo.priority)
                        }} />
                        
                        {todo.aiGenerated && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white'
                          }}>
                            AI
                          </span>
                        )}
                        
                        {isOverdue(todo.dueDate) && !todo.completed && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderRadius: '12px',
                            background: '#fee2e2',
                            color: '#dc2626'
                          }}>
                            <AlertCircle size={12} />
                            Overdue
                          </span>
                        )}
                      </div>

                      {todo.description && (
                        <p style={{
                          color: '#6b7280',
                          margin: '0 0 1rem 0',
                          fontSize: '0.95rem',
                          lineHeight: '1.5'
                        }}>
                          {todo.description}
                        </p>
                      )}

                      <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          borderRadius: '20px',
                          background: getPriorityBgColor(todo.priority),
                          color: getPriorityColor(todo.priority)
                        }}>
                          {todo.priority} priority
                        </span>

                        {todo.category && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: '#f3f4f6',
                            color: '#374151'
                          }}>
                            {todo.category}
                          </span>
                        )}

                        {todo.dueDate && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: isOverdue(todo.dueDate) && !todo.completed ? '#fee2e2' : '#e0f2fe',
                            color: isOverdue(todo.dueDate) && !todo.completed ? '#dc2626' : '#0369a1'
                          }}>
                            <Calendar size={12} />
                            {formatDate(todo.dueDate)}
                          </span>
                        )}

                        {todo.estimatedTime && (
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            borderRadius: '20px',
                            background: '#f0f9ff',
                            color: '#0369a1'
                          }}>
                            <Clock size={12} />
                            {formatEstimatedTime(todo.estimatedTime)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => startEdit(todo)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#6b7280',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f3f4f6';
                          e.target.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                          e.target.style.color = '#6b7280';
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      
                      <button
                        onClick={() => deleteTodo(todo._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.5rem',
                          color: '#6b7280',
                          borderRadius: '6px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#fee2e2';
                          e.target.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                          e.target.style.color = '#6b7280';
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: '1000'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  margin: '0'
                }}>
                  {editingId ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={resetForm}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter task title..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter task description..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: 'white'
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Work, Personal..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Estimated Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                      placeholder="e.g. 60"
                      min="1"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  <button
                    onClick={resetForm}
                    style={{
                      flex: '1',
                      padding: '0.75rem 1.5rem',
                      background: 'white',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTodo}
                    disabled={!formData.title.trim()}
                    style={{
                      flex: '1',
                      padding: '0.75rem 1.5rem',
                      background: formData.title.trim() 
                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                        : '#d1d5db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: formData.title.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.95rem',
                      fontWeight: '500'
                    }}
                  >
                    {editingId ? 'Update Task' : 'Create Task'}
                  </button>
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