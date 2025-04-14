# Social Network Backend

A RESTful API and real-time messaging backend for a social networking application built with Express.js, MySQL/Sequelize, and Socket.io.

## Features

- User authentication (register, login, profile)
- Posts (create, read, update, delete)
- Comments and replies
- Likes
- Friend requests and relationships
- Real-time private messaging
- Real-time notifications
- Online/offline status

## Technologies

- **Node.js & Express.js**: RESTful API framework
- **MySQL**: Relational database
- **Sequelize**: ORM for database interactions
- **Socket.io**: Real-time communication
- **JWT**: Authentication and authorization
- **bcrypt**: Password hashing

## Getting Started

### Prerequisites

- Node.js (v14+)
- MySQL

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file based on the `.env.example` file
4. Create a MySQL database for the project
5. Run database migrations
   ```
   npm run dev
   ```

### Running the Server

Development mode:
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Register a new user
- `POST /api/v1/auth/login`: Login with email and password
- `GET /api/v1/auth/me`: Get current user profile

### Posts
- `POST /api/v1/posts`: Create a new post
- `GET /api/v1/posts`: Get all posts (with pagination)
- `GET /api/v1/posts/:id`: Get a specific post with comments
- `PUT /api/v1/posts/:id`: Update a post
- `DELETE /api/v1/posts/:id`: Delete a post
- `POST /api/v1/posts/:id/like`: Like/unlike a post

### Comments
- `POST /api/v1/comments`: Add a comment to a post
- `GET /api/v1/comments/post/:postId`: Get comments for a post (with pagination)
- `POST /api/v1/comments/:id/like`: Like/unlike a comment
- `DELETE /api/v1/comments/:id`: Delete a comment

## WebSocket Events

### Connection
- `connection`: User connects with JWT authentication
- `disconnect`: User disconnects

### Messages
- `send_message`: Send a private message
- `new_message`: Receive a private message
- `message_sent`: Confirmation message sent
- `message_read`: Message read status update
- `typing`: User is typing indicator

### Notifications
- `notification`: Receive a notification
- `user_status_change`: Friend's online/offline status changed
