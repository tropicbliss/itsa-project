import { AdminDashboard } from "@/containers/AdminDashboard";
import { AgentDashboard } from "@/containers/AgentDashboard";
import { useToast } from "@/hooks/use-toast";
import { getUserGroups } from "@/lib/auth";
import { extractErrorMessage } from "@/lib/error";
import { useEffect, useState } from "react";

export function Dashboard() {
  const [userGroups, setUserGroups] = useState<string[] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getUserGroups()
      .then((userGroups) => setUserGroups(userGroups))
      .catch((error) => {
        const errorDescription = extractErrorMessage(error);
        toast({
          variant: "destructive",
          description: `Error fetching user groups: ${errorDescription}`,
        });
      });
  }, []);

  if (
    userGroups?.includes(import.meta.env.VITE_ADMIN_GROUP) ||
    userGroups?.includes(import.meta.env.VITE_ROOT_ADMIN_GROUP)
  ) {
    return <AdminDashboard />;
  }

  if (userGroups?.includes(import.meta.env.VITE_AGENT_GROUP)) {
    return <AgentDashboard />;
  }

  return <></>;
}
