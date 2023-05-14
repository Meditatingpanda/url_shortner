"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const colors_1 = __importDefault(require("colors"));
const crypto_1 = __importDefault(require("crypto"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// middlewares
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
//routes
app.get("/", (req, res) => {
    res.send("Hello World!");
});
// shorten the url
app.post("/api/shorten", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const longUrl = req.body.url;
    const hash = crypto_1.default.createHash("sha256");
    hash.update(longUrl);
    const shortUrl = hash.digest("hex").slice(0, 6);
    // find if the short url already exists in the database
    const urlExists = yield prisma.url.findUnique({
        where: {
            short: shortUrl,
        },
    });
    if (urlExists) {
        res.json({
            msg: "Url already exists",
        });
        return;
    }
    // save the short url to the database
    try {
        const url = yield prisma.url.create({
            data: {
                url: longUrl,
                short: shortUrl,
            },
        });
        console.log(url);
    }
    catch (error) {
        console.log(error);
    }
    res.json({
        msg: "Url shortened successfully",
        shortUrl: shortUrl,
    });
})));
// redirect to the original url
app.get("/:shortUrl", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const shortUrl = req.params.shortUrl;
    const url = yield prisma.url.findUnique({
        where: {
            short: shortUrl,
        },
    });
    if (!url) {
        res.json({
            msg: "Url not found",
        });
        return;
    }
    console.log(url);
    res.redirect(url.url);
}));
app.listen(port, () => {
    console.log(colors_1.default.bgGreen(`Server is running on port http://localhost:${port}`));
});
