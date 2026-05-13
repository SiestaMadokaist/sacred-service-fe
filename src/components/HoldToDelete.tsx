import React, { useRef, useState } from "react";

interface IHoldToDelete {
  onDelete: () => void;
  duration?: number;
}

export const HoldToDelete = ({ onDelete, duration = 1000 }: IHoldToDelete): JSX.Element => {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = () => {
    setIsHolding(true);
    timerRef.current = setTimeout(() => {
      onDelete();
      setIsHolding(false);
    }, duration);
  };

  const cancel = () => {
    setIsHolding(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      style={{
        position: "relative",
        width: "100%",
        height: "1.8rem",
        cursor: "pointer",
        borderRadius: "4px",
        overflow: "hidden",
        backgroundColor: "#3d1f1f",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: "#c0392b",
          width: isHolding ? "100%" : "0%",
          transition: isHolding ? `width ${duration}ms linear` : "none",
        }}
      />
      <span style={{ position: "relative", fontSize: "0.75em", color: "#f5b7b1", zIndex: 1 }}>
        Hold to Delete
      </span>
    </div>
  );
};
