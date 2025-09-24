"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequestFromFormData = exports.validateRequest = void 0;
const utils_1 = require("../utils");
const validateRequest = (schema) => {
    return (0, utils_1.asyncHandler)(async (req, _res, next) => {
        const parsedData = await schema.parseAsync({
            body: req.body,
            cookies: req.cookies,
        });
        req.body = parsedData.body;
        req.cookies = parsedData.cookies;
        next();
    });
};
exports.validateRequest = validateRequest;
const validateRequestFromFormData = (schema) => {
    return (0, utils_1.asyncHandler)(async (req, _res, next) => {
        if (req?.body?.data) {
            const parsedData = await schema.parseAsync({
                body: JSON.parse(req.body.data),
                cookies: req.cookies,
            });
            req.body = parsedData.body;
            req.cookies = parsedData.cookies;
            next();
        }
    });
};
exports.validateRequestFromFormData = validateRequestFromFormData;
