import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/contextLib";

export function Navbar() {
  const { userHasAuthenticated } = useAppContext();

  return (
    <div className="flex justify-end">
      <Button variant="ghost" onClick={() => userHasAuthenticated(false)}>
        Logout
      </Button>
    </div>
  );
}
