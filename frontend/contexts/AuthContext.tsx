"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'user';
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, referralCode?: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendEmailOTP: (email: string) => Promise<void>; // Deprecated/Stubbed
  verifyEmailOTP: (email: string, otp: string) => Promise<void>; // Deprecated/Stubbed
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch full profile from Firestore to get role
        try {
          const { fetchUserProfile } = await import("@/lib/db");
          let profile = await fetchUserProfile(firebaseUser.uid);
          
          // Auto-Healing: If user exists in Auth but not Firestore, create profile
          if (!profile) {
            console.log("Healing missing profile for UID:", firebaseUser.uid);
            const { adminUpdateUser, generateUniqueReferralCode } = await import("@/lib/db");
            const generatedCode = await generateUniqueReferralCode(firebaseUser.displayName || 'Neighbor');
            const newProfile = {
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Neighbor',
              email: firebaseUser.email,
              verified: false,
              trustScore: 0,
              totalReviews: 0,
              itemsLentCount: 0,
              itemsBorrowedCount: 0,
              memberSince: new Date(),
              role: (firebaseUser.email === 'admin@gmail.com' ? 'admin' : 'user') as 'admin' | 'user',
              referralCode: generatedCode,
              referralPoints: 0,
              referralCount: 0
            };
            await adminUpdateUser(firebaseUser.uid, newProfile);
            profile = { ...newProfile, id: firebaseUser.uid };
          }

          let role = profile?.role || 'user';

          // Bootstrap Admin: Automatically promote admin@gmail.com
          if (firebaseUser.email === 'admin@gmail.com' && role !== 'admin') {
            try {
              const { adminUpdateUser, generateUniqueReferralCode } = await import("@/lib/db");
              const updates: any = { 
                role: 'admin',
                name: firebaseUser.displayName || 'Admin',
                email: firebaseUser.email
              };
              if (!profile?.referralCode) {
                updates.referralCode = await generateUniqueReferralCode('Admin');
              }
              await adminUpdateUser(firebaseUser.uid, updates);
              role = 'admin';
            } catch (promoteErr) {
              console.error("Failed to bootstrap admin:", promoteErr);
            }
          }

          // Case where profile exists but lacks referral code (Legacy Users)
          if (profile && !profile.referralCode) {
            const { adminUpdateUser, generateUniqueReferralCode } = await import("@/lib/db");
            const generatedCode = await generateUniqueReferralCode(profile.name);
            await adminUpdateUser(firebaseUser.uid, { referralCode: generatedCode });
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || profile?.name || null,
            photoURL: firebaseUser.photoURL,
            role: role,
            isBlocked: profile?.isBlocked || false
          });
        } catch (err) {
          console.error("Error fetching user profile in auth:", err);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role: 'user'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.error("Sign in error:", error);
      let message = "Failed to sign in";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password";
      if (error.code === 'auth/user-not-found') message = "User not found";
      if (error.code === 'auth/wrong-password') message = "Incorrect password";
      toast.error(message);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string, referralCode?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Create Firestore profile
      try {
        const { adminUpdateUser, generateUniqueReferralCode, processReferral } = await import("@/lib/db");
        const generatedCode = await generateUniqueReferralCode(displayName);
        
        await adminUpdateUser(userCredential.user.uid, {
          name: displayName,
          email: email,
          verified: false,
          trustScore: 0,
          totalReviews: 0,
          itemsLentCount: 0,
          itemsBorrowedCount: 0,
          memberSince: new Date(),
          role: email === 'admin@gmail.com' ? 'admin' : 'user',
          referralCode: generatedCode,
          referralPoints: 0,
          referralCount: 0
        });

        // Process referral if code provided
        if (referralCode) {
          await processReferral(userCredential.user.uid, referralCode);
        }
      } catch (dbErr) {
        console.error("Error creating Firestore profile on signup:", dbErr);
      }

      // Force update local user state since onAuthStateChanged might fire before updateProfile completes
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName,
        photoURL: userCredential.user.photoURL,
        role: email === 'admin@gmail.com' ? 'admin' : 'user'
      });

      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error("Sign up error:", error);
      let message = "Failed to create account";
      if (error.code === 'auth/email-already-in-use') message = "Email already in use";
      if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters";
      toast.error(message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  // Deprecated methods for compatibility with AuthForm temporarily
  const sendEmailOTP = async (email: string) => {
    console.warn("OTP is not implemented in Firebase version. Skipping...");
    // Simulate success to allow flow to proceed if needed, or throw error.
    // Since we are changing AuthForm, we might not strictly need this logic.
    return Promise.resolve();
  };

  const verifyEmailOTP = async (email: string, otp: string) => {
    console.warn("OTP is not implemented in Firebase version. Skipping...");
    return Promise.resolve();
  };

  const logout = () => {
    signOut();
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendEmailOTP,
    verifyEmailOTP,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
