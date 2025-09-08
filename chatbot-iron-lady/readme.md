
# Iron Lady Chatbot

## Overview

The **Iron Lady Chatbot** is a conversational assistant built to help women in leadership development, career growth, and entrepreneurship. It provides guidance based on the **Iron Lady Leadership Methodology** using AI powered by the **Cohere API**.

---

## Features

* **AI-Powered Responses**: The chatbot uses the **Cohere API** to provide insightful responses based on leadership principles.
* **Fallback Responses**: In case the AI fails to generate a response, fallback messages are provided for common queries.
* **Leadership Focus**: Helps with career advancement, leadership development, and entrepreneurship.
* **Quick Prompts**: Predefined prompts for frequently asked questions to streamline interaction.
* **Responsive UI**: The application is designed to work well on both desktop and mobile devices.

---

## Technologies Used

* **Frontend**: React.js
* **Backend**: Node.js, Express.js
* **AI API**: Cohere API

---

## Installation

### Prerequisites

* Node.js (version 18 or above)
* npm or yarn

### Step 1: Clone the Repository

Clone the repository to your local system:

```bash
git clone https://github.com/Pranaviporeddy18/ironladyassignment.git
cd ironladyassignment/chatbot-iron-lady
```

### Step 2: Install Dependencies

Run the following command to install required dependencies:

```bash
npm install
```

Alternatively, if you're using yarn:

```bash
yarn install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root of the backend folder and add your **Cohere API key**:

```
COHERE_API_KEY=your-cohere-api-key
PORT=3001
```

### Step 4: Run the Backend

Start the backend server:

```bash
npm run start:server
```

Or using yarn:

```bash
yarn start:server
```

### Step 5: Run the Frontend

In another terminal, start the frontend:

```bash
npm run start:frontend
```

Or with yarn:

```bash
yarn start:frontend
```

By default, the frontend will be available at `http://localhost:3000`.

---

## API Endpoints

### `/api/chat` (POST)

* **Description**: Sends a message to the chatbot and receives a response.
* **Request Body**:

  ```json
  {
    "message": "Your message here"
  }
  ```
* **Response**:

  ```json
  {
    "response": "AI's response here",
    "timestamp": "2025-09-08T12:00:00.000Z"
  }
  ```

### `/api/health` (GET)

* **Description**: Health check for the API.
* **Response**:

  ```json
  {
    "status": "healthy",
    "timestamp": "2025-09-08T12:00:00.000Z",
    "uptime": 12345
  }
  ```

### `/` (GET)

* **Description**: Basic information about the chatbot API.
* **Response**:

  ```json
  {
    "name": "Iron Lady Chatbot API",
    "status": "running",
    "api": "REST"
  }
  ```

---

## Frontend Features

* **User Input**: Send messages to the chatbot and get responses.
* **AI Responses**: Get AI-generated responses or fallback responses if needed.
* **Quick Prompts**: Pre-configured questions for easy access to common information.
* **Responsive Design**: The app is fully responsive, supporting both desktop and mobile devices.

