import db from '../models/index';

const getAllPermissionRoles = async () => {
    try {
        const permissionRoles = await db.Permission_Role.findAll({
            include: [
                {
                    model: db.Permission,
                    attributes: ['id', 'url', 'description']
                },
                {
                    model: db.Role,
                    attributes: ['id', 'name', 'description']
                }
            ]
        });

        return {
            EM: 'Get permission-roles successfully',
            EC: 0,
            DT: permissionRoles
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: []
        };
    }
};

const getPermissionRolesWithPagination = async (page, limit) => {
    try {
        let offset = (page - 1) * limit;
        const { count, rows } = await db.Permission_Role.findAndCountAll({
            include: [
                {
                    model: db.Permission,
                    attributes: ['id', 'url', 'description']
                },
                {
                    model: db.Role,
                    attributes: ['id', 'name', 'description']
                }
            ],
            offset: offset,
            limit: limit
        });

        return {
            EM: 'Get permission-roles successfully',
            EC: 0,
            DT: {
                totalRows: count,
                totalPages: Math.ceil(count / limit),
                permissionRoles: rows
            }
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: []
        };
    }
};

const createPermissionRole = async (data) => {
    try {
        const { permissionId, roleId } = data;
        
        // Check if relationship already exists
        const existing = await db.Permission_Role.findOne({
            where: { permissionId, roleId }
        });

        if (existing) {
            return {
                EM: 'Permission-Role relationship already exists',
                EC: 1,
                DT: null
            };
        }

        const newPermissionRole = await db.Permission_Role.create({
            permissionId,
            roleId
        });

        return {
            EM: 'Create permission-role successfully',
            EC: 0,
            DT: newPermissionRole
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        };
    }
};

const deletePermissionRole = async (data) => {
    try {
        const { permissionId, roleId } = data;
        
        const result = await db.Permission_Role.destroy({
            where: { permissionId, roleId }
        });

        if (!result) {
            return {
                EM: 'Permission-Role relationship not found',
                EC: 1,
                DT: null
            };
        }

        return {
            EM: 'Delete permission-role successfully',
            EC: 0,
            DT: null
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        };
    }
};

const updatePermissionRole = async (data) => {
    try {
        const { oldPermissionId, oldRoleId, newPermissionId, newRoleId } = data;
        
        // Check if old relationship exists
        const existingRelation = await db.Permission_Role.findOne({
            where: { 
                permissionId: oldPermissionId, 
                roleId: oldRoleId 
            }
        });

        if (!existingRelation) {
            return {
                EM: 'Permission-Role relationship not found',
                EC: 1,
                DT: null
            };
        }

        // Check if new relationship already exists
        if (newPermissionId !== oldPermissionId || newRoleId !== oldRoleId) {
            const duplicateRelation = await db.Permission_Role.findOne({
                where: { 
                    permissionId: newPermissionId, 
                    roleId: newRoleId 
                }
            });

            if (duplicateRelation) {
                return {
                    EM: 'New Permission-Role relationship already exists',
                    EC: 1,
                    DT: null
                };
            }
        }

        // Update the relationship
        await existingRelation.update({
            permissionId: newPermissionId,
            roleId: newRoleId
        });

        return {
            EM: 'Update permission-role successfully',
            EC: 0,
            DT: existingRelation
        };
    } catch (error) {
        console.log('Error:', error);
        return {
            EM: 'Error from service',
            EC: 1,
            DT: null
        };
    }
};

module.exports = {
    getAllPermissionRoles,
    getPermissionRolesWithPagination,
    createPermissionRole,
    deletePermissionRole,
    updatePermissionRole
};
