import permissionRoleApiService from '../service/permissionRoleApiService';

const readFunc = async (req, res) => {
    try {
        if (req.query.page && req.query.limit) {
            let page = parseInt(req.query.page);
            let limit = parseInt(req.query.limit);

            let data = await permissionRoleApiService.getPermissionRolesWithPagination(page, limit);
            return res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT
            });
        } else {
            let data = await permissionRoleApiService.getAllPermissionRoles();
            return res.status(200).json({
                EM: data.EM,
                EC: data.EC,
                DT: data.DT
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: ''
        });
    }
};

const createFunc = async (req, res) => {
    try {
        const { permissionId, roleId } = req.body;
        if (!permissionId || !roleId) {
            return res.status(400).json({
                EM: 'Missing required parameters',
                EC: 1,
                DT: null
            });
        }

        let data = await permissionRoleApiService.createPermissionRole(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: ''
        });
    }
};

const deleteFunc = async (req, res) => {
    try {
        const { permissionId, roleId } = req.body;
        if (!permissionId || !roleId) {
            return res.status(400).json({
                EM: 'Missing required parameters',
                EC: 1,
                DT: null
            });
        }

        let data = await permissionRoleApiService.deletePermissionRole(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: ''
        });
    }
};

const updateFunc = async (req, res) => {
    try {
        const { oldPermissionId, oldRoleId, newPermissionId, newRoleId } = req.body;
        
        // Validate required fields
        if (!oldPermissionId || !oldRoleId || !newPermissionId || !newRoleId) {
            return res.status(400).json({
                EM: 'Missing required parameters',
                EC: 1,
                DT: null
            });
        }

        let data = await permissionRoleApiService.updatePermissionRole(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: ''
        });
    }
};

module.exports = {
    readFunc,
    createFunc,
    deleteFunc,
    updateFunc
};
