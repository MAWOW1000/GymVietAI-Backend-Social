import db from '../models/index';

const createNewPermission = async (permissionData) => {
    try {
        const { url, description } = permissionData;
        
        const newPermission = await db.Permission.create({
            url,
            description
        });

        return {
            EM: 'Create permission successfully',
            EC: 0,
            DT: newPermission
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

const getAllPermissions = async () => {
    try {
        let permissions = await db.Permission.findAll({
            include: {
                model: db.Role,
                through: { attributes: [] }
            },
            order: [['id', 'DESC']]
        });

        return {
            EM: 'Get all permissions successfully',
            EC: 0,
            DT: permissions
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

const updatePermission = async (permissionData) => {
    try {
        const { id, url, description } = permissionData;
        
        const permission = await db.Permission.findByPk(id);
        if (!permission) {
            return {
                EM: 'Permission not found',
                EC: 2,
                DT: []
            }
        }

        await permission.update({ url, description });

        return {
            EM: 'Update permission successfully',
            EC: 0,
            DT: permission
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

const deletePermission = async (id) => {
    try {
        const permission = await db.Permission.findByPk(id);
        if (!permission) {
            return {
                EM: 'Permission not found',
                EC: 2,
                DT: []
            }
        }

        await permission.destroy();

        return {
            EM: 'Delete permission successfully',
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
    createNewPermission,
    getAllPermissions,
    updatePermission,
    deletePermission
}
