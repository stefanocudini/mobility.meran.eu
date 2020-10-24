"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

const SvgBuscircle = ({
  title,
  ...props
}) => /*#__PURE__*/_react.default.createElement("svg", _extends({
  viewBox: "0 0 390 390"
}, props), title ? /*#__PURE__*/_react.default.createElement("title", null, title) : null, /*#__PURE__*/_react.default.createElement("path", {
  d: "M158.5 96h73c3.9 0 7-3.1 7-7s-3.1-7-7-7h-73c-3.9 0-7 3.1-7 7s3.1 7 7 7z"
}), /*#__PURE__*/_react.default.createElement("circle", {
  cx: 274,
  cy: 251,
  r: 15
}), /*#__PURE__*/_react.default.createElement("circle", {
  cx: 116,
  cy: 251,
  r: 15
}), /*#__PURE__*/_react.default.createElement("path", {
  d: "M275.7 110H113.4c-4.3 0-7.8 3.3-8 7.6l-4.9 92.9c-.3 5.1 3.8 9.5 9 9.5h171c5.2 0 9.3-4.3 9-9.5l-4.8-92c-.3-4.8-4.2-8.5-9-8.5z"
}), /*#__PURE__*/_react.default.createElement("path", {
  d: "M195 0C87.3 0 0 87.3 0 195s87.3 195 195 195 195-87.3 195-195S302.7 0 195 0zm110 292c0 4.4-3.6 8-8 8h-7v20c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-20H132v20c0 6.6-5.4 12-12 12h-8c-6.6 0-12-5.4-12-12v-20h-7c-4.4 0-8-3.6-8-8v-72l6-115c.1-25.4 46.6-39 104-39s104 13.6 104 39l6 115v72z"
}));

var _default = SvgBuscircle;
exports.default = _default;