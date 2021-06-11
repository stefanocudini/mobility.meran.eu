import React from "react";

const MarkerStopStation = ({ title, fill = '#fff', stroke = '#095980', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" {...props} viewBox="0 0 19 19">
    {title ? <title>{title}</title> : null}
    <g fill={ fill } stroke={stroke} stroke-width="4">
      <circle cx="9.5" cy="9.5" r="9.5" stroke="none"/>
      <circle cx="9.5" cy="9.5" r="7.5" fill="none"/>
    </g>
  </svg>
);

export default MarkerStopStation;


