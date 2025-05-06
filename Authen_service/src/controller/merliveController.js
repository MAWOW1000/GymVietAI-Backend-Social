import db from '../models/index';
import { Op } from 'sequelize';

/**
 * Controller to handle Merlive allocation operations
 * This provides API endpoints for Merlive to visualize and manage user, role, and permission allocations
 */

// Get all allocation data for Merlive visualization
const getAllocationData = async (req, res) => {
    try {
        // Get all users with their roles
        const users = await db.User.findAll({
            attributes: ['id', 'email', 'firstName', 'lastName', 'roleId'],
            include: {
                model: db.Role,
                as: 'Role',
                attributes: ['id', 'name', 'description']
            }
        });

        // Get all roles with their permissions
        const roles = await db.Role.findAll({
            attributes: ['id', 'name', 'description'],
            include: {
                model: db.Permission,
                as: 'Permissions',
                attributes: ['id', 'url', 'description'],
                through: { attributes: [] } // Don't include junction table data
            }
        });

        // Get all permissions
        const permissions = await db.Permission.findAll({
            attributes: ['id', 'url', 'description']
        });

        // Format data for Merlive visualization
        const formattedData = {
            nodes: [],
            edges: []
        };

        // Add user nodes
        users.forEach(user => {
            formattedData.nodes.push({
                id: `user-${user.id}`,
                label: `${user.firstName} ${user.lastName}`,
                type: 'user',
                data: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });

            // Add edge from user to role if role exists
            if (user.Role) {
                formattedData.edges.push({
                    id: `user-${user.id}-role-${user.roleId}`,
                    source: `user-${user.id}`,
                    target: `role-${user.roleId}`,
                    type: 'has-role'
                });
            }
        });

        // Add role nodes
        roles.forEach(role => {
            formattedData.nodes.push({
                id: `role-${role.id}`,
                label: role.name,
                type: 'role',
                data: {
                    description: role.description
                }
            });

            // Add edges from role to permissions
            role.Permissions.forEach(permission => {
                formattedData.edges.push({
                    id: `role-${role.id}-permission-${permission.id}`,
                    source: `role-${role.id}`,
                    target: `permission-${permission.id}`,
                    type: 'has-permission'
                });
            });
        });

        // Add permission nodes
        permissions.forEach(permission => {
            formattedData.nodes.push({
                id: `permission-${permission.id}`,
                label: permission.url,
                type: 'permission',
                data: {
                    description: permission.description
                }
            });
        });

        return res.status(200).json({
            EM: 'Get allocation data successfully',
            EC: 0,
            DT: formattedData
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

// Get allocation statistics
const getAllocationStats = async (req, res) => {
    try {
        const userCount = await db.User.count();
        const roleCount = await db.Role.count();
        const permissionCount = await db.Permission.count();
        
        // Count users per role
        const usersByRole = await db.User.findAll({
            attributes: ['roleId', [db.sequelize.fn('count', db.sequelize.col('id')), 'count']],
            group: ['roleId'],
            include: {
                model: db.Role,
                as: 'Role',
                attributes: ['name']
            }
        });
        
        // Count permissions per role
        const permissionsByRole = await db.Role.findAll({
            attributes: ['id', 'name'],
            include: {
                model: db.Permission,
                as: 'Permissions',
                attributes: []
            },
            group: ['Role.id'],
            raw: true,
            nest: true,
            subQuery: false,
            attributes: {
                include: [
                    [db.sequelize.fn('COUNT', db.sequelize.col('Permissions.id')), 'permissionCount']
                ]
            }
        });

        return res.status(200).json({
            EM: 'Get allocation statistics successfully',
            EC: 0,
            DT: {
                summary: {
                    totalUsers: userCount,
                    totalRoles: roleCount,
                    totalPermissions: permissionCount
                },
                usersByRole: usersByRole.map(item => ({
                    roleId: item.roleId,
                    roleName: item.Role ? item.Role.name : 'No Role',
                    count: parseInt(item.get('count'))
                })),
                permissionsByRole
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

// Assign role to user (for Merlive demo)
const assignRoleToUser = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        
        if (!userId || !roleId) {
            return res.status(400).json({
                EM: 'Missing required parameters',
                EC: 1,
                DT: null
            });
        }
        
        // Check if user exists
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                EM: 'User not found',
                EC: 2,
                DT: null
            });
        }
        
        // Check if role exists
        const role = await db.Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({
                EM: 'Role not found',
                EC: 3,
                DT: null
            });
        }
        
        // Update user's role
        user.roleId = roleId;
        await user.save();
        
        return res.status(200).json({
            EM: 'Role assigned to user successfully',
            EC: 0,
            DT: {
                userId,
                roleId,
                email: user.email
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

// Bulk update permissions for a role (for Merlive demo)
const updatePermissionsForRole = async (req, res) => {
    try {
        const { roleId, permissionIds } = req.body;
        
        if (!roleId || !Array.isArray(permissionIds)) {
            return res.status(400).json({
                EM: 'Missing or invalid required parameters',
                EC: 1,
                DT: null
            });
        }
        
        // Check if role exists
        const role = await db.Role.findByPk(roleId);
        if (!role) {
            return res.status(404).json({
                EM: 'Role not found',
                EC: 2,
                DT: null
            });
        }
        
        // Verify all permission IDs exist
        const permissions = await db.Permission.findAll({
            where: {
                id: {
                    [Op.in]: permissionIds
                }
            }
        });
        
        if (permissions.length !== permissionIds.length) {
            return res.status(400).json({
                EM: 'One or more permissions do not exist',
                EC: 3,
                DT: null
            });
        }
        
        // Remove all existing permissions for this role
        await db.Permission_Role.destroy({
            where: {
                roleId
            }
        });
        
        // Add new permissions
        const permissionRoles = permissionIds.map(permissionId => ({
            permissionId,
            roleId
        }));
        
        await db.Permission_Role.bulkCreate(permissionRoles);
        
        return res.status(200).json({
            EM: 'Role permissions updated successfully',
            EC: 0,
            DT: {
                roleId,
                permissionCount: permissionIds.length
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'Error from server',
            EC: -1,
            DT: null
        });
    }
};

module.exports = {
    getAllocationData,
    getAllocationStats,
    assignRoleToUser,
    updatePermissionsForRole
}; 