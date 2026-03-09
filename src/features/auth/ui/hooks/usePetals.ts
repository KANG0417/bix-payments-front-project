"use client";

import { useState } from "react";

const PETAL_COLORS = [
  "#ffc8dd",
  "#ffafcc",
  "#f9c6d0",
  "#fadadd",
  "#fbb8c8",
  "#f8d7da",
  "#fce4ec",
  "#f48fb1",
];

export interface PetalItem {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  drift: number;
  opacity: number;
  color: string;
}

export function usePetals(count = 28) {
  const [petals] = useState<PetalItem[]>(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 14 + 8,
      duration: Math.random() * 6 + 7,
      delay: Math.random() * 12,
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 180,
      opacity: Math.random() * 0.45 + 0.4,
      color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    })),
  );

  return petals;
}

