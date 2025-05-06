import db from '../models/index';

const createNewRoles = async (roleData) => {
    try {
        const { name, description, permissions } = roleData;
        
        // Create new role
        const newRole = await db.Role.create({
            name,
            description
        });

        // Associate permissions if provided
        if (permissions && permissions.length > 0) {
            await newRole.setPermissions(permissions);
        }

        return {
            EM: 'Create role successfully',
            EC: 0,
            DT: newRole
        }
    } catch (error) {
        console.log(error);
        return {
            EM: 'Something wrong with service',
            EC: 1,
            DT: []
        }
    }
}

const getAllRoles = async () => {
    try {
        let roles = await db.Role.findAll({
            include: {
                model: db.Permission,
                as: 'Permissions',
                through: { attributes: [] }
            },
            order: [['id', 'DESC']]
        });

        return {
            EM: 'Get all roles successfully',
            EC: 0,
            DT: roles
        }
    } catch (error) {
        console.log(error);
        return {
            EM: 'Something wrong with service',
            EC: 1,
            DT: []
        }
    }
}

const updateRole = async (roleData) => {
    try {
        const { id, name, description, permissions } = roleData;
        
        const role = await db.Role.findByPk(id);
        if (!role) {
            return {
                EM: 'Role not found',
                EC: 2,
                DT: []
            }
        }

        // Update role details
        await role.update({ name, description });

        // Update permissions
        if (permissions) {
            await role.setPermissions(permissions);
        }

        return {
            EM: 'Update role successfully',
            EC: 0,
            DT: role
        }
    } catch (error) {
        console.log(error);
        return {
            EM: 'Something wrong with service',
            EC: 1,
            DT: []
        }
    }
}

const deleteRole = async (id) => {
    try {
        const role = await db.Role.findByPk(id);
        if (!role) {
            return {
                EM: 'Role not found',
                EC: 2,
                DT: []
            }
        }

        // Remove role-permission associations first
        await role.setPermissions([]);
        // Delete the role
        await role.destroy();

        return {
            EM: 'Delete role successfully',
            EC: 0,
            DT: []
        }
    } catch (error) {
        console.log(error);
        return {
            EM: 'Something wrong with service',
            EC: 1,
            DT: []
        }
    }
}

module.exports = {
    createNewRoles,
    getAllRoles,
    updateRole,
    deleteRole
}