import { Button } from "@/components/ui/button";
import { post } from "@/lib/fetchLib";

export function AgentDashboard() {
  return (
    <Button
      onClick={async () => {
        const res = await post("/agent/account", {
          clientId: "e9d1b576-0879-4299-ac40-a63397ee18c4",
          type: "savings",
          openingDate: "2024-06-15",
          initialDeposit: 23.12345,
          currency: "SGD",
          branchId: "abc"
        });
        console.log(res)
      }}
    >
      Send
    </Button>
  );
}
