import { Badge } from "@/components/ui/badge";

interface Order {
  id: string;
  customer: string;
  amount: string;
  status: "COMPLETED" | "PENDING";
  date: string;
}

const orders: Order[] = [
  { id: "#1", customer: "John Doe", amount: "4,320 EGP", status: "COMPLETED", date: "1/15/2024" },
  { id: "#2", customer: "Jane Smith", amount: "7,800 EGP", status: "PENDING", date: "1/16/2024" },
  { id: "#3", customer: "Bob Johnson", amount: "240 EGP", status: "PENDING", date: "1/17/2024" }
];

export default function RecentOrdersTable() {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Orders</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Order ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Customer</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border">
                <td className="px-6 py-4 text-sm font-medium text-primary">{order.id}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{order.customer}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{order.amount}</td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={order.status === "COMPLETED" ? "secondary" : "secondary"}
                    className={
                      order.status === "COMPLETED" 
                        ? "bg-success/10 text-success hover:bg-success/20" 
                        : "bg-warning/10 text-warning hover:bg-warning/20"
                    }
                  >
                    {order.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}