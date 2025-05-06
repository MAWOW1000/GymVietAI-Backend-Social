#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import matplotlib.pyplot as plt
import networkx as nx
import numpy as np
from matplotlib.patches import Patch
import sys

# Cấu hình
API_BASE_URL = "http://localhost:8080/api/v1"  # Thay đổi phù hợp với cấu hình của bạn
TOKEN = ""  # Thêm token của bạn vào đây

# Headers cho API request
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def get_token(email, password):
    """Lấy token để sử dụng các API"""
    login_url = f"{API_BASE_URL}/login"
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(login_url, json=payload)
        data = response.json()
        
        if data.get("EC") == 0 and "DT" in data:
            token = data["DT"].get("access_token")
            if token:
                print("Đăng nhập thành công!")
                return token
        
        print(f"Đăng nhập thất bại: {data.get('EM', 'Unknown error')}")
        return None
    except Exception as e:
        print(f"Lỗi khi đăng nhập: {str(e)}")
        return None

def get_allocation_data():
    """Lấy dữ liệu phân quyền để trực quan hóa"""
    url = f"{API_BASE_URL}/merlive/allocation-data"
    
    try:
        response = requests.get(url, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu phân quyền: {str(e)}")
        return None

def get_allocation_stats():
    """Lấy thống kê phân quyền"""
    url = f"{API_BASE_URL}/merlive/allocation-stats"
    
    try:
        response = requests.get(url, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Lỗi khi lấy thống kê phân quyền: {str(e)}")
        return None

def assign_role_to_user(user_id, role_id):
    """Gán vai trò cho người dùng"""
    url = f"{API_BASE_URL}/merlive/assign-role"
    payload = {
        "userId": user_id,
        "roleId": role_id
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Lỗi khi gán vai trò: {str(e)}")
        return None

def update_permissions_for_role(role_id, permission_ids):
    """Cập nhật quyền cho vai trò"""
    url = f"{API_BASE_URL}/merlive/update-permissions"
    payload = {
        "roleId": role_id,
        "permissionIds": permission_ids
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    except Exception as e:
        print(f"Lỗi khi cập nhật quyền: {str(e)}")
        return None

def display_network_graph(data):
    """Hiển thị biểu đồ mạng lưới phân quyền"""
    if not data or "DT" not in data or data["EC"] != 0:
        print("Không có dữ liệu hợp lệ để hiển thị")
        return
    
    # Tạo đồ thị
    G = nx.DiGraph()
    
    # Node colors
    node_colors = {
        "user": "#4CAF50",
        "role": "#2196F3",
        "permission": "#FFC107"
    }
    
    # Edge colors
    edge_colors = {
        "has-role": "#9C27B0",
        "has-permission": "#FF5722"
    }
    
    # Thêm nodes
    node_color_map = []
    node_size_map = []
    node_types = {}
    
    for node in data["DT"]["nodes"]:
        G.add_node(node["id"], label=node["label"])
        node_types[node["id"]] = node["type"]
        
        if node["type"] == "user":
            node_color_map.append(node_colors["user"])
            node_size_map.append(500)
        elif node["type"] == "role":
            node_color_map.append(node_colors["role"])
            node_size_map.append(800)
        else:
            node_color_map.append(node_colors["permission"])
            node_size_map.append(300)
    
    # Thêm edges
    edge_color_map = []
    
    for edge in data["DT"]["edges"]:
        G.add_edge(edge["source"], edge["target"])
        if edge["type"] == "has-role":
            edge_color_map.append(edge_colors["has-role"])
        else:
            edge_color_map.append(edge_colors["has-permission"])
    
    # Vẽ đồ thị
    plt.figure(figsize=(12, 10))
    
    # Sử dụng spring layout để sắp xếp các node
    pos = nx.spring_layout(G, k=0.5, iterations=50)
    
    # Vẽ nodes
    nx.draw_networkx_nodes(G, pos, node_color=node_color_map, node_size=node_size_map, alpha=0.8)
    
    # Vẽ edges
    nx.draw_networkx_edges(G, pos, edge_color=edge_color_map, width=2, arrowsize=20, alpha=0.7)
    
    # Vẽ labels
    nx.draw_networkx_labels(G, pos, font_size=10, font_weight="bold")
    
    # Tạo legend
    legend_elements = [
        Patch(facecolor=node_colors["user"], label="Người dùng"),
        Patch(facecolor=node_colors["role"], label="Vai trò"),
        Patch(facecolor=node_colors["permission"], label="Quyền")
    ]
    
    plt.legend(handles=legend_elements, loc="upper right")
    plt.title("Biểu đồ Phân quyền Hệ thống", fontsize=16)
    plt.axis("off")
    plt.tight_layout()
    
    # Lưu hình ảnh
    plt.savefig("allocation_graph.png", dpi=300, bbox_inches="tight")
    print("Đã lưu biểu đồ vào allocation_graph.png")
    
    # Hiển thị
    plt.show()

def display_role_stats(data):
    """Hiển thị thống kê về vai trò"""
    if not data or "DT" not in data or data["EC"] != 0:
        print("Không có dữ liệu hợp lệ để hiển thị")
        return
    
    stats = data["DT"]
    
    # Tạo figure với 2 subplots
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    
    # 1. Biểu đồ tròn: Phân bố người dùng theo vai trò
    if "usersByRole" in stats and stats["usersByRole"]:
        role_names = [item["roleName"] for item in stats["usersByRole"]]
        user_counts = [item["count"] for item in stats["usersByRole"]]
        
        ax1.pie(user_counts, labels=role_names, autopct='%1.1f%%', 
                startangle=90, shadow=True, 
                textprops={'fontsize': 10, 'fontweight': 'bold'})
        ax1.set_title("Phân bố người dùng theo vai trò", fontsize=14)
    else:
        ax1.text(0.5, 0.5, "Không có dữ liệu", ha='center', va='center')
    
    # 2. Biểu đồ cột: Số lượng quyền theo vai trò
    if "permissionsByRole" in stats and stats["permissionsByRole"]:
        role_names = [item["name"] for item in stats["permissionsByRole"]]
        permission_counts = [int(item.get("permissionCount", 0)) for item in stats["permissionsByRole"]]
        
        bars = ax2.bar(role_names, permission_counts, color="#2196F3")
        
        # Thêm nhãn số lượng trên mỗi cột
        for i, v in enumerate(permission_counts):
            ax2.text(i, v + 0.5, str(v), ha='center', fontsize=10, fontweight='bold')
        
        ax2.set_title("Số lượng quyền theo vai trò", fontsize=14)
        ax2.set_xlabel("Vai trò")
        ax2.set_ylabel("Số lượng quyền")
    else:
        ax2.text(0.5, 0.5, "Không có dữ liệu", ha='center', va='center')
    
    plt.tight_layout()
    
    # Lưu hình ảnh
    plt.savefig("role_stats.png", dpi=300, bbox_inches="tight")
    print("Đã lưu biểu đồ vào role_stats.png")
    
    # Hiển thị
    plt.show()

def display_summary_stats(data):
    """Hiển thị thống kê tổng thể"""
    if not data or "DT" not in data or data["EC"] != 0 or "summary" not in data["DT"]:
        print("Không có dữ liệu hợp lệ để hiển thị")
        return
    
    summary = data["DT"]["summary"]
    
    # Tạo figure
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # Dữ liệu
    labels = ["Người dùng", "Vai trò", "Quyền"]
    values = [summary.get("totalUsers", 0), summary.get("totalRoles", 0), summary.get("totalPermissions", 0)]
    colors = ["#4CAF50", "#2196F3", "#FFC107"]
    
    # Vẽ biểu đồ cột
    bars = ax.bar(labels, values, color=colors, width=0.6)
    
    # Thêm nhãn số lượng trên mỗi cột
    for i, v in enumerate(values):
        ax.text(i, v + 0.5, str(v), ha='center', fontsize=12, fontweight='bold')
    
    ax.set_title("Tổng quan phân quyền hệ thống", fontsize=16)
    ax.set_ylabel("Số lượng")
    
    plt.tight_layout()
    
    # Lưu hình ảnh
    plt.savefig("summary_stats.png", dpi=300, bbox_inches="tight")
    print("Đã lưu biểu đồ vào summary_stats.png")
    
    # Hiển thị
    plt.show()

def main():
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "login" and len(sys.argv) == 4:
            email = sys.argv[2]
            password = sys.argv[3]
            token = get_token(email, password)
            if token:
                print("Token:", token)
                print("Sao chép token này và đặt vào biến TOKEN trong script.")
            return
    
    # Kiểm tra token
    if not TOKEN:
        print("Vui lòng thêm token bằng cách chạy: python merlive-test.py login your_email your_password")
        return
    
    print("=== Trực quan hóa Phân quyền với Merlive API ===")
    
    # Lấy và hiển thị dữ liệu
    allocation_data = get_allocation_data()
    if allocation_data and allocation_data.get("EC") == 0:
        print("Đã lấy dữ liệu phân quyền thành công.")
        display_network_graph(allocation_data)
    else:
        print("Lỗi khi lấy dữ liệu phân quyền.")
    
    # Lấy và hiển thị thống kê
    stats_data = get_allocation_stats()
    if stats_data and stats_data.get("EC") == 0:
        print("Đã lấy thống kê phân quyền thành công.")
        display_role_stats(stats_data)
        display_summary_stats(stats_data)
    else:
        print("Lỗi khi lấy thống kê phân quyền.")

if __name__ == "__main__":
    main() 