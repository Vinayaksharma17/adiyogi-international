import { useUser } from "@clerk/react";

export function useCurrentUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  return {
    user,
    isLoaded,
    isSignedIn,
    userId: user?.id,
    email: user?.primaryEmailAddress?.emailAddress,
    fullName: user?.fullName,
    firstName: user?.firstName,
    lastName: user?.lastName,
    imageUrl: user?.imageUrl,
  };
}