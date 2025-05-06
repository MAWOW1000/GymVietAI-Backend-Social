#!/bin/bash

# Thiết lập biến môi trường
export NODE_ENV=production
export MERLIVE_ENABLED=true

# Khởi động server với log chi tiết
echo "Starting Authentication Service with Merlive APIs enabled..."
npx nodemon --inspect src/server.js

# Nếu không sử dụng nodemon, có thể dùng node trực tiếp
# node src/server.js 