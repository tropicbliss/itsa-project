import { Button } from "@/components/ui/button";
import { del, get, post, put } from "@/lib/fetchLib";

export function AgentDashboard() {
  return (
    <Button
      onMouseDown={async () => {
        const res = await post("/agent/email", {
          subject: "Test",
          body: "Test"
        });
        console.log(res)
      }}
    >
      Send
    </Button>
  );
}
