import React from "react";
import { panel, border, greenGlow } from "../styles/theme.js";

export default function Panel({ children, style = {} }) {
  return (
    <div
      style={{
        background: panel,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 16,
        boxShadow: `0 0 12px ${greenGlow}`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}