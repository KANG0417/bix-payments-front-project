export const globalStyles = `
  @keyframes petalFall {
    0%   { transform: translateY(-60px) translateX(0px) rotate(0deg); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(110vh) translateX(var(--drift)) rotate(var(--rotate)); opacity: 0; }
  }
  @keyframes sway {
    0%, 100% { margin-left: 0px; }
    50%       { margin-left: 25px; }
  }
  @keyframes bgShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
`;

export const animatedStyles = {
  springBg: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
    background:
      "linear-gradient(135deg, #ffeaf4, #ffd6e8, #f3e5f5, #e8f4fd, #fce4ec, #fff0f5)",
    backgroundSize: "400% 400%",
    animation: "bgShift 14s ease infinite",
  },
  petal: {
    position: "fixed" as const,
    top: -60,
    borderRadius: "150% 0 150% 0",
    pointerEvents: "none" as const,
    zIndex: 10,
  },
  cursor: {
    display: "inline-block",
    width: 2,
    height: "1em",
    background: "#f48fb1",
    marginLeft: 2,
    verticalAlign: "middle",
    animation: "blink 0.6s step-end infinite",
  },
} as const;
