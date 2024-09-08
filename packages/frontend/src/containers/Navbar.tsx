import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/contextLib";
import { Auth } from "aws-amplify";

export function Navbar() {
  const { userHasAuthenticated } = useAppContext();

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
  }

  return (
    <div className="flex justify-end">
      <Button variant="ghost" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
