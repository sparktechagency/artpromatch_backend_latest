"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const utils_1 = require("../../utils");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const request_service_1 = require("./request.service");
const createRequest = (0, utils_1.asyncHandler)(async (req, res) => {
    const { artistId } = req.body;
    const result = await request_service_1.RequestService.createRequestIntoDB(req.user, artistId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        message: 'Request send successfully!',
        data: result,
    });
});
const fetchMyRequests = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await request_service_1.RequestService.fetchMyRequest(req.user, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Requests retrieved successfully!',
        data: result.data,
        meta: result.meta,
    });
});
const statusChangedByArtist = (0, utils_1.asyncHandler)(async (req, res) => {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status))
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, 'status is required accepted or rejected');
    const result = await request_service_1.RequestService.statusChangedByArtistIntoDb(req.user, req.params.id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Requests accepted successfully!',
        data: result,
    });
});
const addToJoinStudio = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id)
        throw new utils_1.AppError(http_status_1.default.BAD_REQUEST, "request id not found in params");
    const result = await request_service_1.RequestService.addToJoinStudioIntoDb(req.user, id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Join Artist successfully!',
        data: result,
    });
});
const removeRequest = (0, utils_1.asyncHandler)(async (req, res) => {
    const result = await request_service_1.RequestService.removeRequest(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        message: 'Requests removed successfully!',
        data: result,
    });
});
exports.RequestController = {
    createRequest,
    fetchMyRequests,
    statusChangedByArtist,
    addToJoinStudio,
    removeRequest,
};
