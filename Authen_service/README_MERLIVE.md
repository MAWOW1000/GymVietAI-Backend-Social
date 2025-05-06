# Hướng dẫn sử dụng Merlive cho Trình diễn Phân quyền

## Giới thiệu

Tài liệu này mô tả cách sử dụng các API endpoints được thiết kế đặc biệt cho Merlive để trình diễn và quản lý hệ thống phân quyền. Các API này cho phép bạn lấy dữ liệu và trực quan hóa mối quan hệ giữa Users, Roles và Permissions trong hệ thống.

## Cài đặt Merlive

1. Cài đặt Merlive CLI:
   ```
   npm install -g @merlive/cli
   ```

2. Đăng nhập Merlive (nếu chưa đăng nhập):
   ```
   merlive login
   ```

## API Endpoints

### 1. Lấy dữ liệu phân quyền

Endpoint này trả về dữ liệu phân quyền ở định dạng node-edge để Merlive có thể hiển thị dưới dạng đồ thị.

```
GET /api/v1/merlive/allocation-data
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ví dụ Response:**
```json
{
  "EM": "Get allocation data successfully",
  "EC": 0,
  "DT": {
    "nodes": [
      {
        "id": "user-123",
        "label": "John Doe",
        "type": "user",
        "data": {
          "email": "john@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      },
      {
        "id": "role-1",
        "label": "Admin",
        "type": "role",
        "data": {
          "description": "Administrator with full access"
        }
      },
      {
        "id": "permission-1",
        "label": "/api/v1/user/read",
        "type": "permission",
        "data": {
          "description": "Read user data"
        }
      }
    ],
    "edges": [
      {
        "id": "user-123-role-1",
        "source": "user-123",
        "target": "role-1",
        "type": "has-role"
      },
      {
        "id": "role-1-permission-1",
        "source": "role-1",
        "target": "permission-1",
        "type": "has-permission"
      }
    ]
  }
}
```

### 2. Lấy thống kê phân quyền

Endpoint này trả về thống kê tổng thể về người dùng, vai trò và quyền trong hệ thống.

```
GET /api/v1/merlive/allocation-stats
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Ví dụ Response:**
```json
{
  "EM": "Get allocation statistics successfully",
  "EC": 0,
  "DT": {
    "summary": {
      "totalUsers": 50,
      "totalRoles": 5,
      "totalPermissions": 20
    },
    "usersByRole": [
      {
        "roleId": 1,
        "roleName": "Admin",
        "count": 3
      },
      {
        "roleId": 2,
        "roleName": "User",
        "count": 42
      }
    ],
    "permissionsByRole": [
      {
        "id": 1,
        "name": "Admin",
        "permissionCount": 20
      },
      {
        "id": 2,
        "name": "User",
        "permissionCount": 5
      }
    ]
  }
}
```

### 3. Gán vai trò cho người dùng

Endpoint này cho phép gán vai trò cho người dùng.

```
POST /api/v1/merlive/assign-role
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "uuid-of-user",
  "roleId": 2
}
```

**Ví dụ Response:**
```json
{
  "EM": "Role assigned to user successfully",
  "EC": 0,
  "DT": {
    "userId": "uuid-of-user",
    "roleId": 2,
    "email": "user@example.com"
  }
}
```

### 4. Cập nhật quyền cho vai trò

Endpoint này cho phép cập nhật hàng loạt quyền cho một vai trò.

```
POST /api/v1/merlive/update-permissions
```

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Request Body:**
```json
{
  "roleId": 2,
  "permissionIds": [1, 2, 3, 4, 5]
}
```

**Ví dụ Response:**
```json
{
  "EM": "Role permissions updated successfully",
  "EC": 0,
  "DT": {
    "roleId": 2,
    "permissionCount": 5
  }
}
```

## Cách sử dụng với Merlive

### Thiết lập Merlive Dashboard

1. Tạo mới Dashboard trong Merlive:

```bash
merlive dashboard create --name "Phân quyền hệ thống"
```

2. Thêm API Data Source:

```bash
merlive source add --dashboard "Phân quyền hệ thống" --name "User Roles" --type "api" --url "https://your-api-url/api/v1/merlive/allocation-data" --method "GET" --headers "Authorization: Bearer YOUR_TOKEN"
```

3. Thêm API Statistics Source:

```bash
merlive source add --dashboard "Phân quyền hệ thống" --name "Role Stats" --type "api" --url "https://your-api-url/api/v1/merlive/allocation-stats" --method "GET" --headers "Authorization: Bearer YOUR_TOKEN"
```

### Tạo Visualization

1. Network Graph (Người dùng - Vai trò - Quyền):

```bash
merlive viz create --dashboard "Phân quyền hệ thống" --name "Phân quyền đồ thị" --type "network" --source "User Roles" --config '{
  "nodeColors": {
    "user": "#4CAF50",
    "role": "#2196F3",
    "permission": "#FFC107"
  },
  "edgeColors": {
    "has-role": "#9C27B0",
    "has-permission": "#FF5722"
  },
  "nodeSizes": {
    "user": 30,
    "role": 40,
    "permission": 25
  }
}'
```

2. Pie Chart (Phân bố người dùng theo vai trò):

```bash
merlive viz create --dashboard "Phân quyền hệ thống" --name "Phân bố người dùng" --type "pie" --source "Role Stats" --config '{
  "dataPath": "usersByRole",
  "valueField": "count",
  "labelField": "roleName",
  "colors": ["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"]
}'
```

3. Bar Chart (Số lượng quyền theo vai trò):

```bash
merlive viz create --dashboard "Phân quyền hệ thống" --name "Quyền theo vai trò" --type "bar" --source "Role Stats" --config '{
  "dataPath": "permissionsByRole",
  "xField": "name",
  "yField": "permissionCount",
  "colors": ["#2196F3"]
}'
```

4. Stats Cards (Tổng quan số liệu):

```bash
merlive viz create --dashboard "Phân quyền hệ thống" --name "Tổng quan" --type "stats" --source "Role Stats" --config '{
  "cards": [
    {
      "title": "Tổng người dùng",
      "value": "summary.totalUsers",
      "icon": "user",
      "color": "#4CAF50"
    },
    {
      "title": "Tổng vai trò",
      "value": "summary.totalRoles",
      "icon": "shield",
      "color": "#2196F3"
    },
    {
      "title": "Tổng quyền",
      "value": "summary.totalPermissions",
      "icon": "key",
      "color": "#FFC107"
    }
  ]
}'
```

## Tương tác với Dashboard

### Thiết lập Tương tác

1. Thêm hành động khi click vào node vai trò:

```bash
merlive action create --dashboard "Phân quyền hệ thống" --viz "Phân quyền đồ thị" --event "node:click" --target "api" --config '{
  "url": "https://your-api-url/api/v1/merlive/allocation-stats",
  "method": "GET",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  },
  "params": {
    "roleId": "{{data.id}}"
  },
  "updateSource": "Role Stats"
}'
```

2. Thêm form để gán vai trò cho người dùng:

```bash
merlive form create --dashboard "Phân quyền hệ thống" --name "Gán vai trò" --config '{
  "fields": [
    {
      "name": "userId",
      "label": "User ID",
      "type": "select",
      "options": "dataSource:User Roles.nodes[?(@.type=='user')].{label:label,value:id}"
    },
    {
      "name": "roleId",
      "label": "Role",
      "type": "select",
      "options": "dataSource:User Roles.nodes[?(@.type=='role')].{label:label,value:id.split('role-')[1]}"
    }
  ],
  "submitAction": {
    "url": "https://your-api-url/api/v1/merlive/assign-role",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json"
    },
    "refreshSources": ["User Roles", "Role Stats"]
  }
}'
```

## Tạo Dashboard với Script

Bạn cũng có thể tạo toàn bộ dashboard bằng một script. Tạo file `create-dashboard.sh`:

```bash
#!/bin/bash

# Tạo dashboard
merlive dashboard create --name "Phân quyền hệ thống"

# Thêm data sources
merlive source add --dashboard "Phân quyền hệ thống" --name "User Roles" --type "api" --url "https://your-api-url/api/v1/merlive/allocation-data" --method "GET" --headers "Authorization: Bearer YOUR_TOKEN"
merlive source add --dashboard "Phân quyền hệ thống" --name "Role Stats" --type "api" --url "https://your-api-url/api/v1/merlive/allocation-stats" --method "GET" --headers "Authorization: Bearer YOUR_TOKEN"

# Thêm visualizations
merlive viz create --dashboard "Phân quyền hệ thống" --name "Phân quyền đồ thị" --type "network" --source "User Roles" --config '{
  "nodeColors": {
    "user": "#4CAF50",
    "role": "#2196F3",
    "permission": "#FFC107"
  },
  "edgeColors": {
    "has-role": "#9C27B0",
    "has-permission": "#FF5722"
  }
}'

merlive viz create --dashboard "Phân quyền hệ thống" --name "Phân bố người dùng" --type "pie" --source "Role Stats" --config '{
  "dataPath": "usersByRole",
  "valueField": "count",
  "labelField": "roleName"
}'

merlive viz create --dashboard "Phân quyền hệ thống" --name "Quyền theo vai trò" --type "bar" --source "Role Stats" --config '{
  "dataPath": "permissionsByRole",
  "xField": "name",
  "yField": "permissionCount"
}'

merlive viz create --dashboard "Phân quyền hệ thống" --name "Tổng quan" --type "stats" --source "Role Stats" --config '{
  "cards": [
    {
      "title": "Tổng người dùng",
      "value": "summary.totalUsers",
      "icon": "user"
    },
    {
      "title": "Tổng vai trò",
      "value": "summary.totalRoles",
      "icon": "shield"
    },
    {
      "title": "Tổng quyền",
      "value": "summary.totalPermissions",
      "icon": "key"
    }
  ]
}'

# Thêm forms
merlive form create --dashboard "Phân quyền hệ thống" --name "Gán vai trò" --config '{
  "fields": [
    {
      "name": "userId",
      "label": "User ID",
      "type": "select",
      "options": "dataSource:User Roles.nodes[?(@.type==\'user\')].{label:label,value:id}"
    },
    {
      "name": "roleId",
      "label": "Role",
      "type": "select",
      "options": "dataSource:User Roles.nodes[?(@.type==\'role\')].{label:label,value:id.split(\'role-\')[1]}"
    }
  ],
  "submitAction": {
    "url": "https://your-api-url/api/v1/merlive/assign-role",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer YOUR_TOKEN",
      "Content-Type": "application/json"
    },
    "refreshSources": ["User Roles", "Role Stats"]
  }
}'

echo "Dashboard created successfully!"
```

## Kết luận

Với các API endpoints và hướng dẫn này, bạn có thể tạo một dashboard trực quan để theo dõi và quản lý phân quyền trong hệ thống. Dashboard này cho phép bạn:

1. Xem mối quan hệ giữa người dùng, vai trò và quyền dưới dạng đồ thị mạng
2. Xem thống kê về phân bố người dùng theo vai trò
3. Xem số lượng quyền được gán cho mỗi vai trò
4. Gán vai trò cho người dùng qua form tương tác
5. Cập nhật quyền cho vai trò

Bằng cách sử dụng Merlive, bạn có thể tạo ra các dashboard tương tác mà không cần phải xây dựng giao diện người dùng từ đầu. 