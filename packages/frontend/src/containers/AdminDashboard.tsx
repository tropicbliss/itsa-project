import { Button } from "@/components/ui/button";
import { get } from "@/lib/fetchLib";
import { useState } from "react";

export function AdminDashboard() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await get("/");
        console.log(res);
        setLoading(false);
      }}
    >
      Send
    </Button>
  );
}
