"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../config"));
const auth_constant_1 = require("./auth.constant");
const authSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: [true, 'This email is already used!'],
    },
    fullName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        unique: [true, 'This phone number is already used!'],
    },
    password: {
        type: String,
        select: 0,
    },
    passwordChangedAt: {
        type: Date,
    },
    fcmToken: {
        type: String,
        default: null,
    },
    image: {
        type: String,
        default: auth_constant_1.defaultUserImage,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpiry: {
        type: Date,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(auth_constant_1.ROLE),
        default: auth_constant_1.ROLE.CLIENT,
    },
    isSocialLogin: {
        type: Boolean,
        default: false,
    },
    refreshToken: {
        type: String,
        default: null,
    },
    isProfile: {
        type: Boolean,
        default: false,
    },
    isVerifiedByOTP: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDeactivated: {
        type: Boolean,
        default: false,
    },
    deactivationReason: {
        type: String,
    },
    deactivatedAt: {
        type: Date,
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true, versionKey: false });
// Custom hooks/methods
authSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    this.password = await bcryptjs_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
    next();
});
authSchema.pre('find', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
authSchema.pre('findOne', function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});
authSchema.pre('aggregate', function (next) {
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});
authSchema.post('save', function (doc, next) {
    doc.password = '';
    next();
});
// isUserExistsByEmail
authSchema.statics.isUserExistsByEmail = async function (email) {
    return await exports.Auth.findOne({ email }).select('+password');
};
// isPasswordMatched
authSchema.methods.isPasswordMatched = async function (plainTextPassword) {
    return await bcryptjs_1.default.compare(plainTextPassword, this.password);
};
// isJWTIssuedBeforePasswordChanged
authSchema.methods.isJWTIssuedBeforePasswordChanged = function (jwtIssuedTimestamp) {
    const passwordChangedTime = new Date(this.passwordChangedAt).getTime() / 1000;
    return passwordChangedTime > jwtIssuedTimestamp;
};
// For checking if password is correct
authSchema.methods.isPasswordCorrect = async function (password) {
    return await bcryptjs_1.default.compare(password, this.password);
};
exports.Auth = (0, mongoose_1.model)('Auth', authSchema);
