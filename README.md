# Social Service

A RESTful API and real-time messaging backend for a social networking application similar to Threads, built with Express.js, MySQL/Sequelize, and Socket.io.

## Features

- **User Profiles**: Create and manage user profiles
- **Posts & Threads**: Create posts, reply to threads and conversation chains
- **Social Interactions**: Like, comment on posts
- **Follow System**: Follow/unfollow users, view followers/following
- **Notifications**: Get notifications for interactions
- **Discovery**: Search users, explore trending hashtags
- **Real-time Messaging**: Private messaging between users
- **Online/Offline Status**: Track user online status

## Technologies

- **Node.js & Express.js**: API framework
- **MySQL**: Database with Sequelize ORM
- **JWT Authentication**: Integrated with Authen_service
- **Socket.io**: Real-time communication
- **Zod**: Data validation

## Installation

1. Clone repository
2. Install dependencies:
   ```
   npm install
   ```
3. Setup environment variables:
   ```
   cp .env.example .env
   ```
   Update the `.env` file with your configuration

4. Create database:
   ```
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

5. Start server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register`: Register a new user
- `POST /api/v1/auth/login`: Login with email and password
- `GET /api/v1/auth/me`: Get current user profile

### Profiles
- `GET /api/v1/profiles/:identifier`: Get profile by username or ID
- `GET /api/v1/profiles/me`: Get current user's profile
- `PUT /api/v1/profiles/me`: Update current user's profile
- `GET /api/v1/profiles/search`: Search user profiles

### Posts
- `POST /api/v1/posts`: Create a new post
- `GET /api/v1/posts`: Get all posts (with pagination)
- `GET /api/v1/posts/:id`: Get a specific post with comments
- `PUT /api/v1/posts/:id`: Update a post
- `DELETE /api/v1/posts/:id`: Delete a post
- `GET /api/v1/posts/feed`: Get feed (posts from followed users)
- `GET /api/v1/posts/:id/replies`: Get replies to a post
- `GET /api/v1/posts/profile/:identifier`: Get posts from a specific profile
- `POST /api/v1/posts/:id/like`: Like/unlike a post

### Likes
- `POST /api/v1/likes/:postId`: Like a post
- `DELETE /api/v1/likes/:postId`: Unlike a post
- `GET /api/v1/likes/:postId`: Get users who liked a post

### Comments
- `POST /api/v1/comments`: Add a comment to a post
- `GET /api/v1/comments/post/:postId`: Get comments for a post
- `POST /api/v1/comments/:id/like`: Like/unlike a comment
- `DELETE /api/v1/comments/:id`: Delete a comment

### Follows
- `POST /api/v1/follows/:targetId`: Follow a profile
- `DELETE /api/v1/follows/:targetId`: Unfollow a profile
- `GET /api/v1/follows/followers/:identifier`: Get followers of a profile
- `GET /api/v1/follows/following/:identifier`: Get profiles followed by a user

### Notifications
- `GET /api/v1/notifications`: Get user notifications
- `PATCH /api/v1/notifications/read`: Mark notifications as read
- `GET /api/v1/notifications/unread-count`: Get unread notification count

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

## Authentication

Authentication is handled via JWT tokens, integrated with Authen_service. API expects a Bearer token in the Authorization header for protected endpoints:

```
Authorization: Bearer <token>
```

## Development

```
npm run dev
```

## Production Deployment

1. Ensure all environment variables are correctly configured in `.env`
2. Build project:
   ```
   npm run build
   ```
3. Run in production mode:
   ```
   npm start
   ```

## License

This project is licensed under the MIT License.
