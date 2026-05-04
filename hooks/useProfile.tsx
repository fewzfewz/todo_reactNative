import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { UserProfile, UserProfileDraft } from "@/types/profile";

const STORAGE_KEY = "profile:v1";

const starterProfile: UserProfile = {
  name: "Alex",
  role: "Builder",
  bio: "Keeping the day moving with a calm, local-first planner.",
  focusArea: "Academics",
  avatarColor: "#3b82f6",
  dailyGoal: 3,
  updatedAt: new Date().toISOString(),
};

const normalizeProfile = (profile: Partial<UserProfile> & Pick<UserProfile, "updatedAt">): UserProfile => ({
  name: profile.name ?? starterProfile.name,
  role: profile.role ?? starterProfile.role,
  bio: profile.bio ?? starterProfile.bio,
  focusArea: profile.focusArea ?? starterProfile.focusArea,
  avatarColor: profile.avatarColor ?? starterProfile.avatarColor,
  dailyGoal: profile.dailyGoal ?? starterProfile.dailyGoal,
  updatedAt: profile.updatedAt,
});

type ProfileContextType = ReturnType<typeof useProfileState>;

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

function useProfileState() {
  const [profile, setProfile] = useState<UserProfile>(starterProfile);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) {
          return;
        }

        setProfile(stored ? normalizeProfile(JSON.parse(stored)) : starterProfile);
      })
      .catch(() => {
        if (mounted) {
          setProfile(starterProfile);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  }, [isLoading, profile]);

  const updateProfile = useCallback((draft: UserProfileDraft) => {
    setProfile({
      ...draft,
      dailyGoal: Math.max(1, draft.dailyGoal || 1),
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const resetProfile = useCallback(() => {
    setProfile(starterProfile);
  }, []);

  return useMemo(
    () => ({
      profile,
      isLoading,
      updateProfile,
      resetProfile,
    }),
    [isLoading, profile, resetProfile, updateProfile],
  );
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const value = useProfileState();

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }

  return context;
}
