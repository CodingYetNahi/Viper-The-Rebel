import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleAuthProvider, testConnection } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firebaseErrors.ts';

export interface PilotProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  highScore: number;
  highestWave: number;
  totalKills: number;
  gamesPlayed: number;
  credits: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LeaderboardEntry {
  id?: string;
  userId: string;
  pilotName: string;
  shipId: string;
  score: number;
  wave: number;
  kills: number;
  gameMode: string;
  timeSurvived: number;
  createdAt?: unknown;
}

interface AuthContextType {
  user: User | null;
  pilotProfile: PilotProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  recordRunStats: (runData: {
    score: number;
    wave: number;
    kills: number;
    timeSurvived: number;
    shipId: string;
    gameMode: string;
  }) => Promise<void>;
  getTopLeaderboard: () => Promise<LeaderboardEntry[]>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pilotProfile, setPilotProfile] = useState<PilotProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setPilotProfile(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userPath = `users/${currentUser.uid}`;

      // Check / initialize profile
      try {
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          const initialProfile: PilotProfile = {
            uid: currentUser.uid,
            displayName: (currentUser.displayName || 'Vanguard Pilot').slice(0, 64),
            email: (currentUser.email || '').slice(0, 128),
            photoURL: currentUser.photoURL || undefined,
            highScore: 0,
            highestWave: 0,
            totalKills: 0,
            gamesPlayed: 0,
            credits: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userDocRef, initialProfile);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }

      // Realtime listener for pilot profile
      const unsubscribeDoc = onSnapshot(
        userDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setPilotProfile(snapshot.data() as PilotProfile);
          }
          setLoading(false);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, userPath);
        }
      );

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Google Sign In failed:', error);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const recordRunStats = async (runData: {
    score: number;
    wave: number;
    kills: number;
    timeSurvived: number;
    shipId: string;
    gameMode: string;
  }) => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const userPath = `users/${user.uid}`;
    const leaderboardPath = 'leaderboard';

    const currentHighScore = pilotProfile?.highScore || 0;
    const currentHighestWave = pilotProfile?.highestWave || 0;
    const currentTotalKills = pilotProfile?.totalKills || 0;
    const currentGamesPlayed = pilotProfile?.gamesPlayed || 0;
    const currentCredits = pilotProfile?.credits || 0;

    const earnedCredits = Math.floor(runData.score / 100) + runData.kills * 2;

    const updatedProfile = {
      highScore: Math.max(currentHighScore, runData.score),
      highestWave: Math.max(currentHighestWave, runData.wave),
      totalKills: currentTotalKills + runData.kills,
      gamesPlayed: currentGamesPlayed + 1,
      credits: currentCredits + earnedCredits,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(userDocRef, updatedProfile, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, userPath);
    }

    // Submit to global leaderboard
    try {
      const entry: LeaderboardEntry = {
        userId: user.uid,
        pilotName: (pilotProfile?.displayName || user.displayName || 'Vanguard Pilot').slice(0, 64),
        shipId: runData.shipId.slice(0, 32),
        score: runData.score,
        wave: runData.wave,
        kills: runData.kills,
        gameMode: runData.gameMode.slice(0, 32),
        timeSurvived: Math.floor(runData.timeSurvived),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, leaderboardPath), entry);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, leaderboardPath);
    }
  };

  const getTopLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const leaderboardPath = 'leaderboard';
    try {
      const q = query(
        collection(db, leaderboardPath),
        orderBy('score', 'desc'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const results: LeaderboardEntry[] = [];
      querySnapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...docSnap.data() } as LeaderboardEntry);
      });
      return results;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, leaderboardPath);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pilotProfile,
        loading,
        signInWithGoogle,
        signOut,
        recordRunStats,
        getTopLeaderboard,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
