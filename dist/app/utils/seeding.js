"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../config"));
const auth_constant_1 = require("../modules/Auth/auth.constant");
const auth_model_1 = require("../modules/Auth/auth.model");
const seedingAdmin = async () => {
    try {
        const admin = await auth_model_1.Auth.findOne({
            role: auth_constant_1.ROLE.SUPER_ADMIN,
            email: config_1.default.super_admin.email,
        });
        console.log("admin");
        if (!admin) {
            await auth_model_1.Auth.create({
                fullName: 'Super Admin',
                role: auth_constant_1.ROLE.SUPER_ADMIN,
                email: config_1.default.super_admin.email,
                password: config_1.default.super_admin.password,
                image: config_1.default.super_admin.profile_photo || auth_constant_1.defaultUserImage,
                otp: '654321',
                otpExpiry: new Date(),
                isVerifiedByOTP: true,
            });
        }
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.log('Error seeding super admin', error);
    }
};
exports.default = seedingAdmin;
