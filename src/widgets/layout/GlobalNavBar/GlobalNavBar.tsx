"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@entities/user/model/auth-store";
import { ROUTES } from "@shared/config/routes";

export function GlobalNavBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.replace(ROUTES.LOGIN);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = user?.displayName ? user.displayName.slice(0, 2) : "?";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,245,250,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1.5px solid rgba(255,198,218,0.5)",
        boxShadow: "0 2px 16px rgba(244,143,177,0.08)",
      }}
    >
      <nav
        style={{
          maxWidth: "60%",
          margin: "0 auto",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        {/* 로고 */}
        <Link
          href={ROUTES.DASHBOARD}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: 80,
              height: 36,
              borderRadius: 12,
              background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 900,
              color: "white",
              boxShadow: "0 4px 12px rgba(244,143,177,0.4)",
              transition: "transform 0.2s",
            }}
          >
            CO.KR
          </span>
        </Link>

        {/* 우측 액션 */}
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* 글쓰기 버튼 */}
            <Link
              href={ROUTES.POST_WRITE}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(244,143,177,0.4)",
                transition: "filter 0.2s, transform 0.15s",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              글쓰기
            </Link>

            {/* 구분선 */}
            <div
              style={{
                width: 1,
                height: 20,
                background: "rgba(244,143,177,0.3)",
              }}
            />

            {/* 프로필 드롭다운 */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 999,
                  border: "1.5px solid rgba(244,143,177,0.3)",
                  background: dropdownOpen
                    ? "rgba(244,143,177,0.1)"
                    : "transparent",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {/* 아바타 */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #f48fb1, #ce93d8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "white",
                    boxShadow: "0 2px 8px rgba(244,143,177,0.4)",
                  }}
                >
                  {initials}
                </div>
                {/* 이름 */}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#7b2d52",
                    display: "none",
                  }}
                  className="sm-show"
                >
                  {user.displayName}
                </span>
                {/* 화살표 */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c9a0b0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    marginTop: 8,
                    width: 200,
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1.5px solid rgba(255,198,218,0.6)",
                    boxShadow:
                      "0 12px 40px rgba(244,143,177,0.2), 0 4px 16px rgba(0,0,0,0.06)",
                    overflow: "hidden",
                  }}
                >
                  {/* 유저 정보 */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid rgba(255,198,218,0.4)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#7b2d52",
                        margin: 0,
                      }}
                    >
                      {user.displayName}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#c084a0",
                        margin: "3px 0 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                  {/* 로그아웃 */}
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 16px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#e57373",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(244,67,54,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "none")
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
