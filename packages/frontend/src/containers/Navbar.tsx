import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";

export function Navbar() {
  const { userHasAuthenticated } = useAppContext();
  const navigate = useNavigate();

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    navigate("/");
  }

  return (
    <div className="flex justify-end">
      <Button variant="ghost" onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
