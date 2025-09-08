# Smart Todo Application

This is a Todo Application that leverages AI suggestions and task optimization to help you stay organized and productive. The application allows you to create, edit, prioritize, categorize, and track tasks, with the added benefit of AI-generated task suggestions and intelligent task ordering.

## Features

* **Task Management**:

  * Create, update, and delete tasks.
  * Set priorities: low, medium, high.
  * Categorize tasks (e.g., Work, Personal, Health).
  * Add due dates and estimated time for tasks.
  * Subtasks for breaking down tasks into smaller pieces.

* **AI Integration**:

  * **AI Task Suggestions**: Generate new tasks based on existing ones with consideration for categories, priorities, and time estimates.
  * **AI Optimization**: Optimize the order of tasks considering priority, deadlines, dependencies, and energy levels throughout the day.

* **Task Analytics**:

  * Track total tasks, completed tasks, pending tasks, overdue tasks, and completion rate.
  * View stats based on priority, category, and status.

* **Filters and Search**:

  * Filter tasks by priority, category, status (completed, pending, overdue).
  * Full-text search for task titles and descriptions.

* **Bulk Operations**:

  * Complete or delete multiple tasks at once.

* **Session Management**:

  * Support for session-based task management, enabling isolated task handling across multiple sessions.

## Technologies Used

* **Frontend**:

  * React.js
  * Lucide-React for icons
  * CSS for styling

* **Backend**:

  * Node.js
  * Express.js
  * MongoDB for task storage
  * Cohere API for AI suggestions and optimization

* **Additional**:

  * CORS for cross-origin requests
  * .env for environment variable management

## Getting Started

### Prerequisites

1. Node.js and npm must be installed on your system.
2. MongoDB database access (local or cloud, MongoDB URI needs to be configured).
3. Cohere API key (for AI functionality).

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/Pranaviporeddy18/ironladyassignment.git
cd ironladyassignment/todoapplication-iron-lady
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following:

```env
MONGODB_URI=your-mongodb-uri-here
COHERE_API_KEY=your-cohere-api-key-here
PORT=5000
```

#### 4. Start the Application

```bash
npm start
```

The application should now be running on [http://localhost:5000](http://localhost:5000).

### Frontend

The frontend React app can be built and run separately if needed:

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```
2. Install the required packages:

   ```bash
   npm install
   ```
3. Start the frontend:

   ```bash
   npm start
   ```

This will launch the frontend on [http://localhost:3000](http://localhost:3000).

## API Endpoints

### **GET /api/todos**

* Fetches all tasks.
* Supports session-based task management when a session ID is provided.

### **POST /api/todos**

* Creates a new task.
* Supports both session-based and regular task creation.

### **PUT /api/todos/\:id**

* Updates an existing task by ID.

### **DELETE /api/todos/\:id**

* Deletes a task by ID.

### **POST /api/todos/bulk**

* Perform bulk operations like completing or deleting multiple tasks.

### **GET /api/ai-suggestions**

* Fetch AI-generated task suggestions based on existing tasks.

### **POST /api/ai-optimize**

* Optimize the task order based on priority, deadlines, and other factors.

### **GET /api/analytics**

* Provides task analytics: total tasks, completion rate, category statistics, etc.

### **GET /api/todos/search**

* Search tasks by title, description, priority, status, or category.

### **GET /api/todos/export**

* Export tasks as a JSON file for backup or external use.

### **GET /api/health**

* Check the health of the API server.

## Usage

### Task Operations

* **Create**: Add new tasks through the form in the frontend interface.
* **Update**: Edit task details such as title, description, priority, and due date.
* **Complete**: Mark tasks as complete by clicking the checkbox.
* **Delete**: Remove tasks from the list.
* **Bulk Actions**: Complete or delete multiple tasks at once.

### AI Suggestions

Click on the **AI Suggest** button to fetch AI-generated task suggestions based on existing tasks in your list. You can add these tasks to your to-do list directly from the suggestions panel.

### Analytics

Click on the **Analytics** button to view insights about your task management, including task completion rate and breakdown by categories and priorities.

