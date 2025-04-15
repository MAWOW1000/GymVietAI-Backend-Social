# Social Service

Dịch vụ mạng xã hội giống Threads, cung cấp API endpoints cho các tính năng mạng xã hội.

## Tính năng

- **User Profiles**: Tạo và quản lý hồ sơ người dùng
- **Posts & Threads**: Tạo bài đăng, phản hồi thread và chuỗi hội thoại
- **Social Interactions**: Like, comment bài viết
- **Follow System**: Follow/unfollow người dùng, xem follower/following
- **Notifications**: Thông báo cho các tương tác
- **Discovery**: Tìm kiếm người dùng, khám phá hashtag xu hướng

## Công nghệ sử dụng

- Node.js
- Express.js
- MySQL với Sequelize ORM
- JWT Authentication (tích hợp với Authen_service)
- Zod Validation

## Cài đặt

1. Clone repository về máy
2. Cài đặt các dependencies:
   ```
   npm install
   ```
3. Thiết lập biến môi trường:
   ```
   cp .env.example .env
   ```
   Cập nhật file `.env` với cấu hình của bạn

4. Tạo database:
   ```
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   ```

5. Khởi chạy server:
   ```
   npm start
   ```

## API Endpoints

### Endpoint Profiles
- `GET /api/v1/profiles/:identifier` - Lấy thông tin hồ sơ theo username hoặc ID
- `GET /api/v1/profiles/me` - Lấy thông tin hồ sơ của người dùng hiện tại
- `PUT /api/v1/profiles/me` - Cập nhật hồ sơ của người dùng hiện tại
- `GET /api/v1/profiles/search` - Tìm kiếm hồ sơ người dùng

### Endpoint Posts
- `POST /api/v1/posts` - Tạo bài đăng mới
- `GET /api/v1/posts/:id` - Lấy thông tin bài đăng
- `DELETE /api/v1/posts/:id` - Xóa bài đăng
- `GET /api/v1/posts/feed` - Lấy feed (bài đăng từ người dùng đang theo dõi)
- `GET /api/v1/posts/:id/replies` - Lấy các phản hồi của bài đăng
- `GET /api/v1/posts/profile/:identifier` - Lấy bài đăng của một hồ sơ cụ thể

### Endpoint Likes
- `POST /api/v1/likes/:postId` - Like một bài đăng
- `DELETE /api/v1/likes/:postId` - Unlike một bài đăng
- `GET /api/v1/likes/:postId` - Lấy danh sách người dùng đã like bài đăng

### Endpoint Follows
- `POST /api/v1/follows/:targetId` - Follow một hồ sơ
- `DELETE /api/v1/follows/:targetId` - Unfollow một hồ sơ
- `GET /api/v1/follows/followers/:identifier` - Lấy danh sách follower của một hồ sơ
- `GET /api/v1/follows/following/:identifier` - Lấy danh sách following của một hồ sơ

### Endpoint Notifications
- `GET /api/v1/notifications` - Lấy thông báo của người dùng
- `PATCH /api/v1/notifications/read` - Đánh dấu thông báo đã đọc
- `GET /api/v1/notifications/unread-count` - Lấy số lượng thông báo chưa đọc

## Xác thực

Xác thực được xử lý thông qua JWT token, tích hợp với Authen_service. API mong đợi một Bearer token trong header Authorization cho các endpoint được bảo vệ.

```
Authorization: Bearer <token>
```

## Tích hợp với Authen_service

Social_service tích hợp với Authen_service để:
1. Xác thực người dùng thông qua JWT token
2. Tự động tạo hồ sơ cho người dùng mới từ Authen_service
3. Kiểm tra quyền hạn thông qua Authen_service

## Testing 

```
npm test
```

## Phát triển

```
npm run dev
```

## Deployment

1. Đảm bảo tất cả biến môi trường được cấu hình chính xác trong `.env`
2. Build project:
   ```
   npm run build
   ```
3. Khởi chạy trong môi trường production:
   ```
   npm run start:prod
   ```

## License

Project này được cấp phép theo giấy phép MIT. 