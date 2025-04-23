"use client";

import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";

const useLogout = () => {
  const router = useRouter();
  const { clear: clearToken } = useLocalStorage<string>("token", "");
  const { clear: clearUserId } = useLocalStorage<number>("userId", 0);
  const { clear: clearNotificationsEnabled} = useLocalStorage<boolean>("notificationsEnabled", false);
  

  const handleLogout = () => {
    clearToken();
    clearUserId();
    clearNotificationsEnabled();
    router.push("/login");
  };

  return handleLogout;
};

export default useLogout;
