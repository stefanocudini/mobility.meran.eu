"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _src = _interopRequireDefault(require("../../otp-ui/trip-viewer-overlay/src"));

var _reactRedux = require("react-redux");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// connect to the redux store
const mapStateToProps = (state, ownProps) => {
  const viewedTrip = state.otp.ui.viewedTrip;
  return {
    tripData: viewedTrip ? state.otp.transitIndex.trips[viewedTrip.tripId] : null
  };
};

const mapDispatchToProps = {};

var _default = (0, _reactRedux.connect)(mapStateToProps, mapDispatchToProps)(_src.default);

exports.default = _default;
module.exports = exports.default;

//# sourceMappingURL=connected-trip-viewer-overlay.js