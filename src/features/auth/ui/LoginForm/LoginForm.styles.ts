// 키프레임만 모아놓은 글로벌 스타일
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
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
`;

// 인라인 스타일 객체
export const styles = {
  // 레이아웃
  main: {
    position: "relative" as const,
    zIndex: 20,
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 16px",
  },
  article: {
    width: "100%",
    maxWidth: 440,
    animation: "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 32,
  },
  logo: {
    margin: "0 auto 16px",
    width: 56,
    height: 56,
    borderRadius: 18,
    background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
    boxShadow: "0 8px 24px rgba(244,143,177,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    fontWeight: 900,
    color: "white",
  },
  h1: {
    fontSize: "clamp(26px, 5vw, 34px)",
    fontWeight: 900,
    color: "#7b2d52",
    margin: 0,
    minHeight: "1.2em",
  },
  subtitle: {
    marginTop: 8,
    fontSize: "clamp(14px, 3vw, 16px)",
    color: "#b06080",
  },

  // 카드
  card: {
    background: "rgba(255,255,255,0.85)",
    backdropFilter: "blur(24px)",
    borderRadius: 28,
    padding: "clamp(28px, 5vw, 44px)",
    boxShadow: "0 20px 60px rgba(244,143,177,0.2), 0 4px 20px rgba(0,0,0,0.05)",
    border: "1.5px solid rgba(255,198,218,0.6)",
  },
  form: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 20,
  },

  // 에러
  errorBox: {
    display: "flex" as const,
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    borderRadius: 12,
    background: "#fff0f3",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    fontSize: 14,
    fontWeight: 500,
  },
  errorText: {
    fontSize: 12,
    fontWeight: 500,
    color: "#e53935",
  },

  // 필드
  fieldset: {
    border: "none",
    padding: 0,
    margin: 0,
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: "#7b2d52",
  },
  inputWrap: {
    position: "relative" as const,
  },
  input: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1.5px solid #f9c6d0",
    background: "#fff9fb",
    fontSize: 15,
    color: "#4a2030",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  },
  inputError: {
    width: "100%",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1.5px solid #f44336",
    background: "#fff9fb",
    fontSize: 15,
    color: "#4a2030",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  },
  inputPassword: {
    width: "100%",
    padding: "13px 44px 13px 16px",
    borderRadius: 12,
    border: "1.5px solid #f9c6d0",
    background: "#fff9fb",
    fontSize: 15,
    color: "#4a2030",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  },
  inputPasswordError: {
    width: "100%",
    padding: "13px 44px 13px 16px",
    borderRadius: 12,
    border: "1.5px solid #f44336",
    background: "#fff9fb",
    fontSize: 15,
    color: "#4a2030",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box" as const,
  },
  eyeButton: {
    position: "absolute" as const,
    right: 14,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    color: "#c9a0b0",
    display: "flex",
    alignItems: "center",
  },

  // 버튼
  buttonGroup: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: 12,
    marginTop: 4,
  },
  btnPrimary: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    color: "white",
    cursor: "pointer",
    background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
    boxShadow: "0 6px 20px rgba(244,143,177,0.45)",
    transition: "filter 0.2s, transform 0.15s",
  },
  btnPrimaryDisabled: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 700,
    color: "white",
    cursor: "not-allowed",
    background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
    boxShadow: "0 6px 20px rgba(244,143,177,0.45)",
    opacity: 0.6,
  },
  btnSecondary: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    background: "rgba(244,143,177,0.08)",
    border: "1.5px solid #f9c6d0",
    color: "#b06080",
    transition: "background 0.2s, transform 0.15s",
  },
  spinnerWrap: {
    display: "flex" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  spinner: {
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },

  // 배경
  springBg: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 0,
    background:
      "linear-gradient(135deg, #ffeaf4, #ffd6e8, #f3e5f5, #e8f4fd, #fce4ec, #fff0f5)",
    backgroundSize: "400% 400%",
    animation: "bgShift 14s ease infinite",
  },

  // 꽃잎
  petal: {
    position: "fixed" as const,
    top: -60,
    borderRadius: "150% 0 150% 0",
    pointerEvents: "none" as const,
    zIndex: 10,
  },

  // 커서
  cursor: {
    display: "inline-block",
    width: 2,
    height: "1em",
    background: "#f48fb1",
    marginLeft: 2,
    verticalAlign: "middle",
    animation: "blink 0.6s step-end infinite",
  },

  // 푸터
  footer: {
    textAlign: "center" as const,
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#c084a0",
  },
} as const;
