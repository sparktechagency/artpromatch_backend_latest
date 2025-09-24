"use strict";
/*
 * Title: Steady Hands
 * Description: A tatto sales backend system using express
 * Author: Md Naim Uddin
 * Github: naimuddin94
 * Date: 25/03/2025
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const http_status_1 = __importDefault(require("http-status"));
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./app/routes"));
const utils_1 = require("./app/utils");
const stripe_webhookt_1 = require("./app/lib/stripe.webhookt");
const artist_service_1 = require("./app/modules/Artist/artist.service");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
app.set('httpServer', httpServer);
app.use((0, cors_1.default)({
    credentials: true,
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
    ],
}));
app.post('/webhook', express_1.default.raw({ type: 'application/json' }), stripe_webhookt_1.stripeWebhookHandler);
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('dev'));
// static files
app.use('/public', express_1.default.static('public'));
//parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/v1', routes_1.default);
//Testing
app.get('/', (req, res, next) => {
    res.send({ message: 'Server is running like a Rabit!' });
});
node_cron_1.default.schedule('0 */2 * * *', async () => {
    try {
        await (0, artist_service_1.expireBoosts)();
    }
    catch (error) {
        new utils_1.AppError(http_status_1.default.BAD_REQUEST, error instanceof Error ? error.message : String(error));
    }
});
//global error handler
app.use(utils_1.globalErrorHandler);
//handle not found
app.use(utils_1.notFound);
exports.default = app;
