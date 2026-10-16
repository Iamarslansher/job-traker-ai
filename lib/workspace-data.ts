"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useWorkspaceData<T>(key: string, initialValue: T) {
  const [userId, setUserId] = useState("demo");
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      setUserId("demo");
      setValue(readValue(`jobtrack:demo:${key}`, initialValue));
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      const nextId = user?.uid ?? "demo";
      setReady(false);
      setUserId(nextId);
      setValue(readValue(`jobtrack:${nextId}:${key}`, initialValue));
      setReady(true);
    });
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(`jobtrack:${userId}:${key}`, JSON.stringify(value));
  }, [key, ready, userId, value]);

  return [value, setValue, ready] as const;
}

export function useWorkspaceUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!auth);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setReady(true);
    });
  }, []);

  return { user, ready };
}

function readValue<T>(key: string, initialValue: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return initialValue;
  try {
    return JSON.parse(saved) as T;
  } catch (error) {
    console.error(`Unable to read saved workspace data for ${key}:`, error);
    return initialValue;
  }
}
