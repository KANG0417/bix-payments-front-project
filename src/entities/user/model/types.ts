export interface User {
  id: string;
  email: string;
  password: string; // 실제 서비스에서는 해시만 저장
  displayName: string;
  createdAt: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}
