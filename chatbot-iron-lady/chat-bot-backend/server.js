import express from 'express';
import cors from 'cors';
import { CohereClientV2 } from 'cohere-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

const systemPrompt = `You are an AI assistant specialized in Iron Lady Bangalore's leadership methodology. Iron Lady is a women's leadership development organization that delivers high-impact programs using principles including:

CORE PRINCIPLES:
- Crucibles of Leadership: Transformational challenges that forge strong leaders
- Powerful Requests: Strategic communication for effective influence
- Living in The Now: Present-moment awareness for decision-making
- Art of War methodology: Strategic thinking in business leadership
- Mission: Enabling a Million Women to reach the TOP

LEADERSHIP FOCUS AREAS:
- Women's career advancement and leadership development
- Entrepreneurship support and business strategy
- Transformational programs (1-crore Club, 100 Board Members, Leadership Essentials)
- Executive coaching by ex-CEOs and entrepreneurs from companies like Bajaj, Aviva
- Breaking barriers between family expectations and professional growth

Always respond with authority on women's leadership development, entrepreneurship, and Iron Lady's proven methodologies. Keep responses conversational, inspiring, and actionable. Format with markdown for better readability.`;

const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('program') || lowerMessage.includes('course')) {
    return `**Iron Lady's Signature Programs:**\n\n🏆 **1-Crore Club** - For ambitious women entrepreneurs ready to scale their businesses\n👩‍💼 **100 Board Members Initiative** - Executive leadership development for board readiness\n⭐ **Leadership Essentials** - Our foundational transformation program\n\nEach program uses our proven **Crucibles of Leadership** methodology - designed challenges that forge resilient, authentic leaders.\n\n*Which program interests you most?*`;
  }
  
  if (lowerMessage.includes('powerful request')) {
    return `**Powerful Requests - A Core Iron Lady Principle:**\n\nA Powerful Request is strategic communication that creates commitment and drives action. It's about:\n\n✨ **Making requests that honor both parties**\n🎯 **Creating clear expectations and timelines**\n💪 **Influencing without positional authority**\n🚀 **Driving breakthrough results through strategic communication**\n\nThis principle helps women leaders navigate corporate environments and entrepreneurship with confidence.\n\n*Want to learn how to apply this in your leadership journey?*`;
  }
  
  if (lowerMessage.includes('crucible') || lowerMessage.includes('challenge')) {
    return `**Crucibles of Leadership - Iron Lady's Transformational Methodology:**\n\nCrucibles are defining moments that test and transform leaders. Our programs create structured crucibles for accelerated growth:\n\n🔥 **Strategic Challenges** - Real business scenarios that stretch capabilities\n💎 **Pressure Testing** - Safe environments to develop resilience\n🌟 **Breakthrough Moments** - Catalysts for authentic leadership emergence\n📈 **Accelerated Development** - Years of growth in months\n\n*These experiences become the foundation of your leadership strength.*`;
  }
  
  if (lowerMessage.includes('career') || lowerMessage.includes('advancement')) {
    return `**Career Advancement Through Iron Lady's Methodology:**\n\nWe address the unique challenges women face in leadership:\n\n🎯 **Strategic Positioning** - How to position yourself for executive roles\n💬 **Executive Communication** - Master the art of influential dialogue\n⚖️ **Work-Life Integration** - Balance family expectations with career ambitions\n🏛️ **Corporate Navigation** - Use Art of War principles in business environments\n👑 **Executive Presence** - Develop authentic leadership authority\n\n*Our ex-CEO mentors from companies like Bajaj and Aviva guide your journey.*`;
  }
  
  return `**Welcome to Iron Lady Leadership!**\n\nWe're dedicated to **Enabling a Million Women to reach the TOP** through our transformational programs.\n\n**Our Core Approach:**\n- **Crucibles of Leadership** - Challenges that forge strong leaders\n- **Powerful Requests** - Strategic influence without authority\n- **Art of War Methodology** - Strategic thinking for modern business\n- **Executive Mentorship** - Guidance from proven leaders\n\n**Ready to Transform Your Leadership?**\nAsk me about our programs, methodology, or how we can help you break through to the next level!\n\n*What specific leadership challenge are you facing?*`;
};

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    let responseText;

    try {
      const response = await cohere.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        model: "command-a-03-2025",
      });
      responseText = response.message.content[0].text;
    } catch (aiError) {
      responseText = getFallbackResponse(message);
    }
    
    res.json({
      response: responseText,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Unable to process message',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Iron Lady Chatbot API',
    status: 'running',
    api: 'REST',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Iron Lady Chatbot Server running on port ${PORT}`);
  console.log(`🔗 REST API ready at http://localhost:${PORT}/api/chat`);
});
