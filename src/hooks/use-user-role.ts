"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "brand" | "consumer" | null;

interface UserWithRole {
  user: User | null;
  role: UserRole;
  loading: boolean;
}

export function useUserRole(): UserWithRole {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch the user's role from Firestore
        try {
          const profileDoc = await getDoc(doc(db, "userProfiles", firebaseUser.uid));
          if (profileDoc.exists()) {
            const data = profileDoc.data();
            setRole(data.userType as UserRole);
          } else {
            setRole(null);
          }
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          setRole(null);
        }
        setLoading(false);
      } else {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, role, loading };
}
