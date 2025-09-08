const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/todoapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  sessionId: String,
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  category: String,
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  aiGenerated: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

const getOrCreateUser = async (req) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const sessionId = req.headers['x-session-id'] || `${ip}-${userAgent}`;
  
  let user = await User.findOne({ sessionId });
  if (!user) {
    user = new User({ ip, userAgent, sessionId });
    await user.save();
  } else {
    user.lastActive = new Date();
    await user.save();
  }
  return user;
};

const generateAISuggestions = (todos) => {
  const categories = [...new Set(todos.map(t => t.category).filter(Boolean))];
  const incomplete = todos.filter(t => !t.completed);
  const overdue = todos.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed);
  
  const suggestions = [];
  
  if (incomplete.length > 5) {
    suggestions.push({
      title: "Break down large tasks",
      description: "Consider splitting your larger tasks into smaller, manageable subtasks",
      priority: "medium",
      category: "productivity",
      aiGenerated: true
    });
  }
  
  if (overdue.length > 0) {
    suggestions.push({
      title: "Review overdue tasks",
      description: `You have ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}. Consider rescheduling or removing them.`,
      priority: "high",
      category: "urgent",
      aiGenerated: true
    });
  }
  
  if (categories.includes('work') && !categories.includes('personal')) {
    suggestions.push({
      title: "Add personal goals",
      description: "Balance work tasks with personal activities for better well-being",
      priority: "low",
      category: "personal",
      aiGenerated: true
    });
  }
  
  const workTasks = todos.filter(t => t.category === 'work').length;
  if (workTasks > 0 && !todos.some(t => t.title.toLowerCase().includes('break'))) {
    suggestions.push({
      title: "Schedule a break",
      description: "Take a 15-minute break to refresh and maintain productivity",
      priority: "medium",
      category: "wellness",
      aiGenerated: true
    });
  }
  
  return suggestions.slice(0, 2);
};

app.get('/api/todos', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todos = await Todo.find({ userId: user._id }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todo = new Todo({ ...req.body, userId: user._id });
    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: user._id },
      req.body,
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todo = await Todo.findOneAndDelete({ _id: req.params.id, userId: user._id });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ai-suggestions', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todos = await Todo.find({ userId: user._id });
    const suggestions = generateAISuggestions(todos);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analytics', async (req, res) => {
  try {
    const user = await getOrCreateUser(req);
    const todos = await Todo.find({ userId: user._id });
    
    const analytics = {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      overdue: todos.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed).length,
      byPriority: {
        high: todos.filter(t => t.priority === 'high').length,
        medium: todos.filter(t => t.priority === 'medium').length,
        low: todos.filter(t => t.priority === 'low').length
      },
      categories: [...new Set(todos.map(t => t.category).filter(Boolean))],
      completionRate: todos.length > 0 ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) : 0
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});