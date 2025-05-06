import permissionApiService from '../service/permissionApiService';

const readFunc = async (req, res) => {
    try {
        let data = await permissionApiService.getAllPermissions();
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
}

const createFunc = async (req, res) => {
    try {
        let data = await permissionApiService.createNewPermission(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
}

const updateFunc = async (req, res) => {
    try {
        let data = await permissionApiService.updatePermission(req.body);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
}

const deleteFunc = async (req, res) => {
    try {
        let data = await permissionApiService.deletePermission(req.body.id);
        return res.status(200).json({
            EM: data.EM,
            EC: data.EC,
            DT: data.DT,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            EM: 'error from server',
            EC: -1,
            DT: '',
        });
    }
}

module.exports = {
    readFunc,
    createFunc,
    updateFunc,
    deleteFunc
}
