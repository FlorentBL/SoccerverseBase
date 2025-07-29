import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children, content }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const ref = useRef();

  const showTooltip = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    setVisible(true);
  };
  const hideTooltip = () => setVisible(false);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onTouchStart={showTooltip}
        onTouchEnd={hideTooltip}
        style={{ display: "inline-block" }}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          style={{
            position: "fixed",
            left: coords.x,
            top: coords.y - 12,
            transform: "translate(-50%, -100%)",
            zIndex: 10000,
            pointerEvents: "none",
            background: "rgba(18,18,18,0.98)",
            color: "#e0e0e0",
            padding: "7px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "pre-line",
            boxShadow: "0 4px 16px #0008",
            maxWidth: 240,
            textAlign: "center"
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  );
}
