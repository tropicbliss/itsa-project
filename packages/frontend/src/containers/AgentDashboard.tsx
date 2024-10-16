import { Button } from "@/components/ui/button";
import { del, get, post, put } from "@/lib/fetchLib";

export function AgentDashboard() {
  return (
    <Button
      onClick={async () => {
        const res = await get("/agent/transactions?page=1&limit=20");
        console.log(res)
      }}
    >
      Send
    </Button>
  );
}
