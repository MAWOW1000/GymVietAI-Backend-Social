require('dotenv').config();
import db from '../models/index';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { last } from 'lodash';
const salt = bcrypt.genSaltSync(10);

//Authentication
const hashUserPassword = (userPassword) => {
    let hashPassword = bcrypt.hashSync(userPassword, salt);
    return hashPassword;
}

const checkPassword = (inputPassword, hashPassword) => {
    // Đảm bảo cả hai tham số đều là chuỗi
    if (typeof inputPassword !== 'string' || typeof hashPassword !== 'string') {
        console.error(`Invalid password types - inputPassword: ${typeof inputPassword}, hashPassword: ${typeof hashPassword}`);
        return false;
    }
    return bcrypt.compareSync(inputPassword, hashPassword); // true or false
}

const checkEmailExist = async (userEmail) => {
    let user = await db.User.findOne({
        where: { email: userEmail }
    })

    if (user) {
        return true;
    }
    return false;
}

const verifyAndClearOTP = async (email, otp) => {
    try {
        const user = await db.User.findOne({
            where: {
                email: email,
                codeResetPassword: otp,
                otpExpiresAt: {
                    [Op.gt]: new Date() // Kiểm tra OTP còn hạn
                }
            }
        });

        if (!user) {
            return {
                EM: 'Invalid or expired OTP code',
                EC: 1,
                DT: null
            };
        }

        // Clear OTP after successful verification
        await user.update({
            codeResetPassword: null,
            otpExpiresAt: null
        });

        return {
            EM: 'OTP verified successfully',
            EC: 0,
            DT: user
        };
    } catch (error) {
        console.error('Verify OTP error:', error);
        return {
            EM: 'Error verifying OTP',
            EC: -1,
            DT: null
        };
    }
};

const registerNewUser = async (rawUserData) => {
    try {
        // Xác thực OTP
        const otpResult = await verifyAndClearOTP(rawUserData.email, rawUserData.otp);
        if (otpResult.EC !== 0) {
            return otpResult;
        }

        const user = otpResult.DT;

        // Kiểm tra xem user đã có password chưa (đã đăng ký chưa)
        if (user.password) {
            return {
                EM: 'This email is already registered',
                EC: 1,
                DT: null
            };
        }

        // Hoàn tất đăng ký với password mới
        let hashPassword = hashUserPassword(rawUserData.password);
        await user.update({
            password: hashPassword,
            roleId: 2 // default role
        });

        return {
            EM: 'User registered successfully!',
            EC: 0,
            DT: null
        };
    } catch (e) {
        console.log(e);
        return {
            EM: 'Something went wrong in service.',
            EC: -1,
            DT: null
        };
    }
}

const handleUserLogin = async (rawData) => {
    try {
        let user = await db.User.findOne({
            where: { email: rawData.email },
            raw: true
        })
        
        if (user) {
            // Kiểm tra xem password có tồn tại và là chuỗi hay không
            if (!user.password || typeof user.password !== 'string') {
                console.error(`Invalid user password type: ${typeof user.password}, value:`, user.password);
                return {
                    EM: 'Invalid user account. Please reset your password or contact support.',
                    EC: 2,
                    DT: ''
                }
            }
            
            // Đảm bảo rawData.password là chuỗi
            const password = String(rawData.password || '');
            
            let isCorrectPassword = checkPassword(password, user.password);
            if (isCorrectPassword === true) {
                return {
                    EM: 'Login successful! Welcome back!',
                    EC: 0,
                    DT: {
                        email: user.email,
                        role: user.roleId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        picture: user.picture,
                        userId: user.id
                    }
                }
            }
        }

        return {
            EM: 'Your email/phone number or password is incorrect!',
            EC: 1,
            DT: ''
        }

    } catch (error) {
        console.log(error)
        return {
            EM: 'Something went wrong in service!',
            EC: -2
        }
    }
}

const upsertUserSocialMedia = async (dataRaw) => {
    try {
        let user = await db.User.findOne({
            where: { email: dataRaw?.email }
        });

        if (!user) {
            // Create new user if not exists
            user = await db.User.create({
                email: dataRaw?.email,
                firstName: dataRaw.given_name,
                lastName: dataRaw.family_name,
                picture: dataRaw.picture,
                roleId: 2
            });
        } else {
            // Update existing user's information
            await user.update({
                firstName: dataRaw.given_name,
                lastName: dataRaw.family_name,
                picture: dataRaw.picture
            });
        }
        return {
            EM: 'Upsert successful!',
            EC: 0,
            DT: {
                email: user.email,
                role: user.roleId,
                firstName: user.firstName,
                lastName: user.lastName,
                picture: user.picture,
                userId: user.id
            }
        };
    } catch (err) {
        console.log('Error in upsertUserSocailMedia >>', err);
        return {
            EM: 'Upsert failed',
            EC: -1,
            DT: {}
        };
    }
}

//Authorization
const createJWT = async (payload, expiresIn) => {
    try {
        // Use provided expiresIn or default from environment
        const tokenExpiresIn = expiresIn || parseInt(process.env.JWT_EXPIRES_IN);
        
        const token = await jwt.sign(
            {
                ...payload,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + tokenExpiresIn,
            },
            process.env.JWT_SECRET
        );
        if (!token) {
            return {
                EM: 'Token creation failed',
                EC: -1,
                DT: null
            };
        }
        return {
            EM: 'Token created successfully',
            EC: 0,
            DT: token
        };
    } catch (error) {
        console.error("Error creating JWT:", error);
        return {
            EM: 'Token creation failed',
            EC: -1,
            DT: null
        };
    }
};

const verifyToken = async (access_token, refresh_token) => {
    try {
        // First verify access token
        let decoded;
        try {
            decoded = jwt.verify(access_token, process.env.JWT_SECRET);
        } catch (error) {
            // If access token is invalid, check if refresh token is valid   
            console.log('Error:', error);
            if (error.name === "TokenExpiredError") {
                // Check refresh token when access token expires
                const user = await db.User.findOne({
                    where: {
                        refreshToken: refresh_token,
                        refreshTokenExpiresAt: {
                            [Op.gt]: new Date()
                        }
                    }
                });

                if (!user) {
                    return {
                        EM: 'Both tokens have expired. Please login again.',
                        EC: 3, // New error code for both tokens expired
                        DT: null
                    };
                }

                return {
                    EM: 'Access token has expired, but refresh token is valid',
                    EC: 1,
                    DT: { email: user.email }
                };
            }
            console.error('Token creation failed');
            return {
                EM: 'Invalid access token',
                EC: -1,
                DT: null
            };
        }
        // Then verify refresh token
        const user = await db.User.findOne({
            where: {
                refreshToken: refresh_token,
                refreshTokenExpiresAt: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!user) {
            return {
                EM: 'Refresh token invalid or expired. Please login again.',
                EC: 3,
                DT: null
            };
        }

        // Both tokens are valid
        return {
            EM: 'Token verification successful',
            EC: 0,
            DT: {
                access_token,
                refresh_token,
                email: user.email
            }
        };

    } catch (error) {
        console.error('Token verification error:', error);
        return {
            EM: 'Error verifying token',
            EC: -1,
            DT: null
        };
    }
};

const updateCookies = async (refresh_token) => {
    try {
        let user = await db.User.findOne({
            where: { refreshToken: refresh_token }
        })
        if (user) {
            const payload = {
                email: user.email,
                id: user.id
            }
            const access_token = await createJWT(payload)
            const refresh_token = uuidv4();
            await user.update({
                refreshToken: refresh_token
            })
            return {
                EM: 'Refresh token updated successfully',
                EC: 0,
                DT: {
                    access_token: access_token,
                    refresh_token: refresh_token,
                    email: user.email,
                    userId: user.id
                }
            }
        } else {
            return {
                EM: 'Refresh token not found',
                EC: 2,
                DT: ''
            }
        }
    } catch (e) {
        console.log(e);
        return {
            EM: 'something wrongs with services',
            EC: -1,
            DT: []
        }
    }
}

const saveResetPasswordCode = async (email, otp) => {
    try {
        const existingUser = await db.User.findOne({
            where: { email: email }
        });

        if (existingUser && existingUser.password) {
            // Nếu user đã tồn tại (đã đăng ký), cập nhật OTP cho reset password
            await existingUser.update({
                codeResetPassword: otp,
                otpExpiresAt: new Date(Date.now() + 60000) // OTP hết hạn sau 1 phút
            });
        } else {
            // Nếu user chưa tồn tại hoặc chưa có password (chưa đăng ký), tạm lưu OTP
            await db.User.upsert({
                email: email,
                codeResetPassword: otp,
                otpExpiresAt: new Date(Date.now() + 60000) // OTP hết hạn sau 1 phút
            });
        }

        return {
            EM: 'OTP code saved successfully',
            EC: 0,
            DT: null
        };
    } catch (error) {
        console.error('Save reset password code error:', error);
        return {
            EM: 'Error saving reset password code',
            EC: -1,
            DT: null
        };
    }
};

const resetPassword = async (rawData) => {
    try {
        // First verify OTP
        const otpResult = await verifyAndClearOTP(rawData.email, rawData.otp);
        if (otpResult.EC !== 0) {
            return otpResult;
        }

        // Find user and update password
        const user = await db.User.findOne({
            where: { email: rawData.email }
        });

        if (!user) {
            return {
                EM: 'User not found',
                EC: 1,
                DT: null
            };
        }

        // Hash and update new password
        const hashPassword = hashUserPassword(rawData.newPassword);
        await user.update({ password: hashPassword });

        return {
            EM: 'Password reset successfully',
            EC: 0,
            DT: null
        };

    } catch (error) {
        console.error('Reset password error:', error);
        return {
            EM: 'Error resetting password',
            EC: -1,
            DT: null
        };
    }
};

const getRoleWithPermission = async (user) => {
    let permission = await db.Role.findOne({
        where: { id: user.roleId },
        attributes: ["id", "name", "description"],
        include: {
            model: db.Permission,
            attributes: ["id", "url", "description"],
            through: { attributes: [] }
        }
    })

    return permission ? permission : {};
}
const upsertRefreshToken = async (email, token, expiresAt) => {
    try {
        let [user, created] = await db.User.findOrCreate({
            where: { email: email },
            defaults: { refreshToken: token, refreshTokenExpiresAt: expiresAt }
        });

        if (!created) {
            await user.update({
                refreshToken: token,
                refreshTokenExpiresAt: expiresAt
            });
        }

        return {
            EM: created ? 'User created successfully' : 'User updated successfully',
            EC: 0,
            DT: token
        };
    } catch (e) {
        console.log(e);
        return {
            EM: 'something wrongs with services',
            EC: -1,
            DT: []
        }
    }
}

/**
 * Verify an MFA code for a user
 * @param {string} email - The user's email
 * @param {string} mfaCode - The MFA code to verify
 * @returns {object} Result object with success status and user data
 */
const verifyMfaCode = async (email, mfaCode) => {
    try {
        // Find the user with the provided email
        const user = await db.User.findOne({
            where: { email }
        });

        if (!user) {
            return {
                EM: 'Người dùng không tồn tại',
                EC: 1,
                DT: null
            };
        }

        // Check if the MFA code is valid
        if (user.mfaCode !== mfaCode) {
            return {
                EM: 'Mã xác thực không hợp lệ',
                EC: 2,
                DT: null
            };
        }

        // Check if the MFA code has expired
        if (user.mfaCodeExpiresAt && new Date() > new Date(user.mfaCodeExpiresAt)) {
            return {
                EM: 'Mã xác thực đã hết hạn',
                EC: 3,
                DT: null
            };
        }

        // Clear the MFA code after successful verification
        await user.update({
            mfaCode: null,
            mfaCodeExpiresAt: null
        });

        return {
            EM: 'Xác thực thành công',
            EC: 0,
            DT: user
        };
    } catch (error) {
        console.error('Verify MFA code error:', error);
        return {
            EM: 'Lỗi khi xác thực mã MFA',
            EC: -1,
            DT: null
        };
    }
};

module.exports = {
    registerNewUser, handleUserLogin, hashUserPassword, checkEmailExist,
    upsertUserSocialMedia, verifyToken, upsertRefreshToken,
    getRoleWithPermission, createJWT, updateCookies, saveResetPasswordCode,
    verifyAndClearOTP, resetPassword, verifyMfaCode
}