"use client";

import { useEffect, useMemo, useState } from "react";
import { disassemble, assemble } from "es-hangul";

export function useTypingText(text: string) {
  const jamos = useMemo(() => disassemble(text).split(""), [text]);
  const [jamoIndex, setJamoIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (jamoIndex < jamos.length) {
            setJamoIndex((i) => i + 1);
          } else {
            setIsPaused(true);
            setTimeout(() => {
              setIsPaused(false);
              setIsDeleting(true);
            }, 1800);
          }
        } else if (jamoIndex > 0) {
          setJamoIndex((i) => i - 1);
        } else {
          setIsPaused(true);
          setTimeout(() => {
            setIsPaused(false);
            setIsDeleting(false);
          }, 500);
        }
      },
      isDeleting ? 60 : 120,
    );
    return () => clearTimeout(timeout);
  }, [jamoIndex, isDeleting, isPaused, jamos.length]);

  return jamoIndex === 0 ? "" : assemble(jamos.slice(0, jamoIndex));
}

