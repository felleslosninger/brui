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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
// Register events and functions here
var functions_1 = require("./functions");
var setup_1 = require("../../../core/setup");
var inference_1 = require("../../../core/inference");
var functions = {
    addAPIClient: functions_1.addAPIClient,
    generatePrivateKey: functions_1.generatePrivateKey
};
var context = (0, setup_1.Setup)('config.json', functions);
// wire DOM input/button
var input = document.getElementById('argvInput');
var button = document.getElementById('argvSubmit');
var emitUserInput = function (message) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        context.eventTarget.dispatchEvent(new CustomEvent('core:userInput', { detail: { message: message } }));
        return [2 /*return*/];
    });
}); };
if (button && input) {
    button.addEventListener('click', function () {
        var v = input.value || '';
        emitUserInput(v);
    });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            var v = input.value || '';
            emitUserInput(v);
        }
    });
}
context.eventTarget.addEventListener('core:userInput', function (e) { return __awaiter(void 0, void 0, void 0, function () {
    var inferenceData;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, inference_1.Request)(e.detail.message, context)];
            case 1:
                inferenceData = _a.sent();
                inferenceData === null || inferenceData === void 0 ? void 0 : inferenceData.forEach(function (toolCall) {
                    var toolName = toolCall["function"].name;
                    var args = toolCall["function"].arguments;
                    var action = context.config.actions[toolName];
                    if (action) {
                        action.triggers.forEach(function (trigger) {
                            var _a;
                            (_a = context.container.triggerMap.get(trigger.name)) === null || _a === void 0 ? void 0 : _a(args);
                        });
                    }
                    else {
                        console.warn("No action found for tool: ".concat(toolName));
                    }
                });
                return [2 /*return*/];
        }
    });
}); });
context.eventTarget.addEventListener('site0:genPrivKey', function (data) {
    (0, functions_1.generatePrivateKey)(data);
});
