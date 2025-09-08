const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { CohereClientV2 } = require('cohere-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log("MongoDB connection error:", err));

// Initialize Cohere AI
const cohere = new CohereClientV2({ 
  token: process.env.COHERE_API_KEY 
});

// Enhanced Todo Schema
const TodoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  category: { type: String },
  dueDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  estimatedTime: { type: Number }, // in minutes
  actualTime: { type: Number }, // in minutes
  tags: [{ type: String }],
  aiGenerated: { type: Boolean, default: false },
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false }
  }],
  sessionId: { type: String } // for session-based todos in demo
});

TodoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Todo = mongoose.model('Todo', TodoSchema);

// Session storage for demo purposes (replace with proper session management in production)
const sessionTodos = new Map();

// AI Helper Functions
const generateTodoSuggestions = async (existingTodos) => {
  try {
    const todosContext = existingTodos.map(todo => 
      `${todo.title} (${todo.category || 'uncategorized'}, ${todo.priority})`
    ).join(', ');

    const prompt = `Based on these existing todos: ${todosContext}
    
    Suggest 3 productive, actionable todo items that would complement the existing tasks. Consider:
    - Different categories (work, personal, health, learning)
    - Various priority levels
    - Realistic time estimates
    - Seasonal relevance
    
    Return only a JSON array with objects containing: title, description, priority (low/medium/high), category, estimatedTime (minutes)`;

    const response = await cohere.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      model: "command-r-plus-08-2024",
    });

    const suggestions = JSON.parse(response.message.content[0].text);
    return suggestions;
  } catch (error) {
    console.error('AI suggestion error:', error);
    return [
      {
        title: "Review weekly goals",
        description: "Take 15 minutes to review and adjust weekly objectives",
        priority: "medium",
        category: "Planning",
        estimatedTime: 15
      },
      {
        title: "Exercise for 30 minutes",
        description: "Physical activity to maintain health and energy",
        priority: "high",
        category: "Health",
        estimatedTime: 30
      },
      {
        title: "Learn something new",
        description: "Spend time on skill development or reading",
        priority: "low",
        category: "Learning",
        estimatedTime: 45
      }
    ];
  }
};

const optimizeTodoOrder = async (todos) => {
  try {
    const prompt = `Given these todos with their details, suggest an optimal order for completion considering:
    - Priority levels
    - Due dates
    - Dependencies
    - Energy levels throughout the day
    
    Todos: ${JSON.stringify(todos.map(t => ({
      id: t._id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      estimatedTime: t.estimatedTime
    })))}
    
    Return a JSON array of todo IDs in optimal order with brief reasoning.`;

    const response = await cohere.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      model: "command-r-plus-08-2024",
    });

    return JSON.parse(response.message.content[0].text);
  } catch (error) {
    console.error('AI optimization error:', error);
    return todos.map(t => ({ id: t._id, reasoning: "Standard priority order" }));
  }
};

// Utility Functions
const getTodosBySession = (sessionId) => {
  if (!sessionTodos.has(sessionId)) {
    sessionTodos.set(sessionId, []);
  }
  return sessionTodos.get(sessionId);
};

const saveTodoToSession = (sessionId, todo) => {
  const todos = getTodosBySession(sessionId);
  todos.push(todo);
  sessionTodos.set(sessionId, todos);
};


app.post('/api/todos', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      const todoData = {
        ...req.body,
        _id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId
      };
      saveTodoToSession(sessionId, todoData);
      res.status(201).json(todoData);
    } else {
      const todo = new Todo(req.body);
      const savedTodo = await todo.save();
      res.status(201).json(savedTodo);
    }
  } catch (error) {
    res.status(400).json({ message: "Error creating todo", error: error.message });
  }
});

// READ all todos
app.get('/api/todos', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      // Demo mode
      const todos = getTodosBySession(sessionId);
      res.json(todos.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }));
    } else {
      // Production mode
      const todos = await Todo.find()
        .sort({ completed: 1, priority: -1, dueDate: 1 });
      res.json(todos);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch todos", error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      // Demo mode
      const todos = getTodosBySession(sessionId);
      const todoIndex = todos.findIndex(t => t._id === req.params.id);
      if (todoIndex === -1) {
        return res.status(404).json({ message: "Todo not found" });
      }
      
      todos[todoIndex] = { ...todos[todoIndex], ...req.body, updatedAt: new Date() };
      sessionTodos.set(sessionId, todos);
      res.json(todos[todoIndex]);
    } else {
      const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        { new: true }
      );
      if (!updatedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }
      res.json(updatedTodo);
    }
  } catch (error) {
    res.status(400).json({ message: "Error updating todo", error: error.message });
  }
});

// DELETE a todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      // Demo mode
      const todos = getTodosBySession(sessionId);
      const filteredTodos = todos.filter(t => t._id !== req.params.id);
      if (todos.length === filteredTodos.length) {
        return res.status(404).json({ message: "Todo not found" });
      }
      sessionTodos.set(sessionId, filteredTodos);
      res.json({ message: 'Todo deleted successfully' });
    } else {
      // Production mode
      const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
      if (!deletedTodo) {
        return res.status(404).json({ message: "Todo not found" });
      }
      res.json({ message: 'Todo deleted successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting todo", error: error.message });
  }
});

// BULK operations
app.patch('/api/todos/bulk', async (req, res) => {
  try {
    const { action, ids } = req.body;
    const sessionId = req.headers['x-session-id'];
    
    if (sessionId) {
      // Demo mode
      const todos = getTodosBySession(sessionId);
      ids.forEach(id => {
        const todo = todos.find(t => t._id === id);
        if (todo) {
          switch (action) {
            case 'complete':
              todo.completed = true;
              break;
            case 'delete':
              const index = todos.indexOf(todo);
              todos.splice(index, 1);
              break;
          }
        }
      });
      sessionTodos.set(sessionId, todos);
      res.json({ message: `Bulk ${action} completed` });
    } else {
      // Production mode
      let result;
      switch (action) {
        case 'complete':
          result = await Todo.updateMany(
            { _id: { $in: ids } },
            { completed: true }
          );
          break;
        case 'delete':
          result = await Todo.deleteMany({ _id: { $in: ids } });
          break;
        default:
          return res.status(400).json({ message: "Invalid bulk action" });
      }
      res.json({ message: `Bulk ${action} completed`, result });
    }
  } catch (error) {
    res.status(500).json({ message: `Bulk ${req.body.action} failed`, error: error.message });
  }
});

// AI-powered suggestions
app.get('/api/ai-suggestions', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    let existingTodos;
    
    if (sessionId) {
      existingTodos = getTodosBySession(sessionId);
    } else {
      existingTodos = await Todo.find({ completed: false }).limit(10);
    }
    
    const suggestions = await generateTodoSuggestions(existingTodos);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: "Error generating suggestions", error: error.message });
  }
});

// AI-powered todo optimization
app.post('/api/ai-optimize', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    let todos;
    
    if (sessionId) {
      todos = getTodosBySession(sessionId).filter(t => !t.completed);
    } else {
      todos = await Todo.find({ completed: false });
    }
    
    const optimizedOrder = await optimizeTodoOrder(todos);
    res.json(optimizedOrder);
  } catch (error) {
    res.status(500).json({ message: "Error optimizing todos", error: error.message });
  }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    let todos;
    
    if (sessionId) {
      todos = getTodosBySession(sessionId);
    } else {
      todos = await Todo.find();
    }
    
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => 
      !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Category breakdown
    const categoryStats = todos.reduce((acc, todo) => {
      const category = todo.category || 'Uncategorized';
      if (!acc[category]) acc[category] = { total: 0, completed: 0 };
      acc[category].total++;
      if (todo.completed) acc[category].completed++;
      return acc;
    }, {});
    
    // Priority breakdown
    const priorityStats = {
      high: todos.filter(t => t.priority === 'high').length,
      medium: todos.filter(t => t.priority === 'medium').length,
      low: todos.filter(t => t.priority === 'low').length
    };
    
    res.json({
      total,
      completed,
      pending,
      overdue,
      completionRate,
      categoryStats,
      priorityStats,
      averageCompletionTime: todos
        .filter(t => t.completed && t.actualTime)
        .reduce((acc, t) => acc + t.actualTime, 0) / 
        Math.max(1, todos.filter(t => t.completed && t.actualTime).length)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
});

app.get('/api/todos/search', async (req, res) => {
  try {
    const { q, category, priority, completed, dueDate } = req.query;
    const sessionId = req.headers['x-session-id'];
    let todos;
    
    if (sessionId) {
      todos = getTodosBySession(sessionId);
    } else {
      todos = await Todo.find();
    }
    
    let filteredTodos = todos;
    
    if (q) {
      const searchQuery = q.toLowerCase();
      filteredTodos = filteredTodos.filter(todo =>
        todo.title.toLowerCase().includes(searchQuery) ||
        (todo.description && todo.description.toLowerCase().includes(searchQuery))
      );
    }
    
    if (category) {
      filteredTodos = filteredTodos.filter(todo => todo.category === category);
    }
    
    if (priority) {
      filteredTodos = filteredTodos.filter(todo => todo.priority === priority);
    }
    
    if (completed !== undefined) {
      filteredTodos = filteredTodos.filter(todo => 
        todo.completed === (completed === 'true')
      );
    }
    
    if (dueDate) {
      const targetDate = new Date(dueDate);
      filteredTodos = filteredTodos.filter(todo => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate);
        return todoDate.toDateString() === targetDate.toDateString();
      });
    }
    
    res.json(filteredTodos);
  } catch (error) {
    res.status(500).json({ message: "Error searching todos", error: error.message });
  }
});

app.get('/api/todos/export', async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    let todos;
    
    if (sessionId) {
      todos = getTodosBySession(sessionId);
    } else {
      todos = await Todo.find();
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="todos-export.json"');
    res.json({
      exportDate: new Date().toISOString(),
      version: "1.0",
      todos: todos
    });
  } catch (error) {
    res.status(500).json({ message: "Error exporting todos", error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Enhanced Todo Server running on port ${PORT}`);
  console.log(`🔗 API ready at http://localhost:${PORT}/api`);
});