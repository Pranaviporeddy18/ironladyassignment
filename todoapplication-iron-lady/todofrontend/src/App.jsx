import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Check, Clock, Brain, BarChart3 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    dueDate: ''
  });

  // Note: localStorage is not available in Claude artifacts
  // In a real environment, this would work as expected
  const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  useEffect(() => {
    fetchTodos();
    fetchAnalytics();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        headers: { 'X-Session-ID': sessionId }
      });
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      // Demo data for preview
      setTodos([
        {
          _id: '1',
          title: 'Complete project documentation',
          description: 'Write comprehensive documentation for the new feature',
          priority: 'high',
          category: 'Work',
          dueDate: '2025-09-10',
          completed: false,
          aiGenerated: false
        },
        {
          _id: '2',
          title: 'Buy groceries',
          description: 'Milk, eggs, bread, and vegetables',
          priority: 'medium',
          category: 'Personal',
          dueDate: '2025-09-08',
          completed: true,
          aiGenerated: true
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
      console.error('Error fetching suggestions:', error);
      // Demo suggestions
      setSuggestions([
        {
          title: 'Schedule team meeting',
          description: 'Plan quarterly review meeting with the team',
          priority: 'medium'
        },
        {
          title: 'Update portfolio website',
          description: 'Add recent projects and update skills section',
          priority: 'low'
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
      console.error('Error fetching analytics:', error);
      // Demo analytics
      setAnalytics({
        total: 2,
        completed: 1,
        pending: 1,
        overdue: 0,
        completionRate: 50
      });
    }
  };

  const saveTodo = async () => {
    try {
      const url = editingId ? `${API_URL}/todos/${editingId}` : `${API_URL}/todos`;
      const method = editingId ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(formData)
      });
      
      setFormData({ title: '', description: '', priority: 'medium', category: '', dueDate: '' });
      setShowForm(false);
      setEditingId(null);
      fetchTodos();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving todo:', error);
      // Demo functionality
      const newTodo = {
        _id: Date.now().toString(),
        ...formData,
        completed: false,
        aiGenerated: false
      };
      
      if (editingId) {
        setTodos(todos.map(todo => todo._id === editingId ? { ...todo, ...formData } : todo));
      } else {
        setTodos([...todos, newTodo]);
      }
      
      setFormData({ title: '', description: '', priority: 'medium', category: '', dueDate: '' });
      setShowForm(false);
      setEditingId(null);
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
      console.error('Error deleting todo:', error);
      setTodos(todos.filter(todo => todo._id !== id));
    }
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
      console.error('Error updating todo:', error);
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
      dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
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
        body: JSON.stringify(suggestion)
      });
      fetchTodos();
      fetchAnalytics();
      setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
    } catch (error) {
      console.error('Error adding suggestion:', error);
      const newTodo = {
        _id: Date.now().toString(),
        ...suggestion,
        completed: false,
        aiGenerated: true
      };
      setTodos([...todos, newTodo]);
      setSuggestions(suggestions.filter(s => s.title !== suggestion.title));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-default';
    }
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  return (
    <>
      <style>{`
        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%);
          padding: 1rem;
        }

        .main-wrapper {
          max-width: 64rem;
          margin: 0 auto;
        }

        .main-card {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header h1 {
          font-size: 1.875rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .header-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-purple {
          background-color: #8b5cf6;
          color: white;
        }

        .btn-purple:hover {
          background-color: #7c3aed;
        }

        .btn-blue {
          background-color: #3b82f6;
          color: white;
        }

        .btn-blue:hover {
          background-color: #2563eb;
        }

        .btn-green {
          background-color: #10b981;
          color: white;
        }

        .btn-green:hover {
          background-color: #059669;
        }

        .btn-gray {
          background-color: #6b7280;
          color: white;
        }

        .btn-gray:hover {
          background-color: #4b5563;
        }

        .analytics-panel {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .analytics-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          text-align: center;
        }

        @media (min-width: 768px) {
          .analytics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .analytics-card {
          background: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
        }

        .analytics-number {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .analytics-number.blue { color: #2563eb; }
        .analytics-number.green { color: #059669; }
        .analytics-number.orange { color: #ea580c; }
        .analytics-number.red { color: #dc2626; }

        .analytics-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .completion-rate {
          margin-top: 1rem;
          text-align: center;
        }

        .completion-rate-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .progress-bar {
          width: 100%;
          background-color: #e5e7eb;
          border-radius: 9999px;
          height: 0.5rem;
          margin-top: 0.5rem;
        }

        .progress-fill {
          background-color: #10b981;
          height: 0.5rem;
          border-radius: 9999px;
          transition: all 0.3s;
        }

        .suggestions-panel {
          background-color: #eff6ff;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .suggestions-title {
          font-weight: 600;
          color: #1e40af;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .suggestion-card {
          background: white;
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #bfdbfe;
        }

        .suggestion-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .suggestion-info {
          flex: 1;
        }

        .suggestion-title {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .suggestion-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .form-panel {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.75rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          ring: 2px solid #3b82f6;
          border-color: transparent;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
        }

        @media (min-width: 768px) {
          .form-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .form-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .todos-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .empty-state {
          text-align: center;
          padding: 2rem 0;
          color: #6b7280;
        }

        .empty-icon {
          margin: 0 auto 1rem;
          opacity: 0.5;
        }

        .todo-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          transition: all 0.2s;
        }

        .todo-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .todo-card.completed {
          opacity: 0.75;
        }

        .todo-card.overdue {
          border-color: #fca5a5;
          background-color: #fef2f2;
        }

        .todo-content {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .check-button {
          margin-top: 0.25rem;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          border: 2px solid #d1d5db;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: white;
          cursor: pointer;
          flex-shrink: 0;
        }

        .check-button:hover {
          border-color: #10b981;
        }

        .check-button.completed {
          background-color: #10b981;
          border-color: #10b981;
          color: white;
        }

        .todo-main {
          flex: 1;
        }

        .todo-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.5rem;
        }

        .todo-title {
          font-weight: 500;
          color: #1f2937;
          margin: 0;
        }

        .todo-title.completed {
          text-decoration: line-through;
          color: #6b7280;
        }

        .ai-badge {
          margin-left: 0.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          background-color: #f3e8ff;
          color: #7c3aed;
          border-radius: 9999px;
        }

        .todo-description {
          font-size: 0.875rem;
          margin-top: 0.25rem;
          color: #6b7280;
        }

        .todo-description.completed {
          color: #9ca3af;
        }

        .todo-tags {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 9999px;
          border: 1px solid;
        }

        .priority-high {
          background-color: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .priority-medium {
          background-color: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }

        .priority-low {
          background-color: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }

        .priority-default {
          background-color: #f3f4f6;
          color: #1f2937;
          border-color: #e5e7eb;
        }

        .category-tag {
          background-color: #f3f4f6;
          color: #374151;
          border-color: #e5e7eb;
        }

        .date-tag {
          background-color: #dbeafe;
          color: #1e40af;
          border-color: #bfdbfe;
        }

        .date-tag.overdue {
          background-color: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        .todo-actions {
          display: flex;
          gap: 0.25rem;
        }

        .action-button {
          padding: 0.5rem;
          color: #6b7280;
          background: none;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          background-color: #f3f4f6;
        }

        .action-button.edit:hover {
          color: #3b82f6;
          background-color: #eff6ff;
        }

        .action-button.delete:hover {
          color: #ef4444;
          background-color: #fef2f2;
        }

        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-buttons {
            justify-content: center;
          }
          
          .todo-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .todo-actions {
            align-self: flex-end;
          }
        }
      `}</style>

      <div className="app-container">
        <div className="main-wrapper">
          <div className="main-card">
            <div className="header">
              <h1>Smart Todo Manager</h1>
              <div className="header-buttons">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="btn btn-purple"
                >
                  <BarChart3 size={18} />
                  Analytics
                </button>
                <button
                  onClick={fetchSuggestions}
                  className="btn btn-blue"
                >
                  <Brain size={18} />
                  AI Suggestions
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-green"
                >
                  <Plus size={18} />
                  Add Task
                </button>
              </div>
            </div>

            {showAnalytics && analytics.total >= 0 && (
              <div className="analytics-panel">
                <h3 className="analytics-title">Analytics Dashboard</h3>
                <div className="analytics-grid">
                  <div className="analytics-card">
                    <div className="analytics-number blue">{analytics.total}</div>
                    <div className="analytics-label">Total Tasks</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-number green">{analytics.completed}</div>
                    <div className="analytics-label">Completed</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-number orange">{analytics.pending}</div>
                    <div className="analytics-label">Pending</div>
                  </div>
                  <div className="analytics-card">
                    <div className="analytics-number red">{analytics.overdue}</div>
                    <div className="analytics-label">Overdue</div>
                  </div>
                </div>
                <div className="completion-rate">
                  <div className="completion-rate-text">
                    Completion Rate: {analytics.completionRate}%
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${analytics.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-panel">
                <h3 className="suggestions-title">
                  <Brain size={20} />
                  AI Suggestions
                </h3>
                <div className="suggestions-list">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <div className="suggestion-content">
                        <div className="suggestion-info">
                          <h4 className="suggestion-title">{suggestion.title}</h4>
                          <p className="suggestion-description">{suggestion.description}</p>
                          <span className={`tag ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority} priority
                          </span>
                        </div>
                        <button
                          onClick={() => addSuggestion(suggestion)}
                          className="btn btn-blue"
                          style={{marginLeft: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.875rem'}}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showForm && (
              <div className="form-panel">
                <h3 className="form-title">
                  {editingId ? 'Edit Task' : 'Add New Task'}
                </h3>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Task title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="form-input"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="form-input"
                    rows={3}
                  />
                  <div className="form-row">
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="form-input"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Category"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="form-input"
                    />
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div className="form-buttons">
                    <button
                      onClick={saveTodo}
                      className="btn btn-blue"
                    >
                      {editingId ? 'Update' : 'Add'} Task
                    </button>
                    <button
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(null);
                        setFormData({ title: '', description: '', priority: 'medium', category: '', dueDate: '' });
                      }}
                      className="btn btn-gray"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="todos-list">
              {todos.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} className="empty-icon" />
                  <p>No tasks yet. Add your first task to get started!</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo._id}
                    className={`todo-card ${todo.completed ? 'completed' : ''} ${
                      isOverdue(todo.dueDate) && !todo.completed ? 'overdue' : ''
                    }`}
                  >
                    <div className="todo-content">
                      <button
                        onClick={() => toggleComplete(todo._id, todo.completed)}
                        className={`check-button ${todo.completed ? 'completed' : ''}`}
                      >
                        {todo.completed && <Check size={12} />}
                      </button>
                      
                      <div className="todo-main">
                        <div className="todo-header">
                          <div>
                            <h3 className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                              {todo.title}
                              {todo.aiGenerated && (
                                <span className="ai-badge">
                                  <Brain size={10} />
                                  AI
                                </span>
                              )}
                            </h3>
                            {todo.description && (
                              <p className={`todo-description ${todo.completed ? 'completed' : ''}`}>
                                {todo.description}
                              </p>
                            )}
                            <div className="todo-tags">
                              <span className={`tag ${getPriorityColor(todo.priority)}`}>
                                {todo.priority}
                              </span>
                              {todo.category && (
                                <span className="tag category-tag">
                                  {todo.category}
                                </span>
                              )}
                              {todo.dueDate && (
                                <span className={`tag ${
                                  isOverdue(todo.dueDate) && !todo.completed
                                    ? 'date-tag overdue'
                                    : 'date-tag'
                                }`}>
                                  {new Date(todo.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="todo-actions">
                            <button
                              onClick={() => startEdit(todo)}
                              className="action-button edit"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => deleteTodo(todo._id)}
                              className="action-button delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TodoApp;