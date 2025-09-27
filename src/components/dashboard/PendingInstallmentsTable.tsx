import { Badge } from "@/components/ui/badge";

interface Installment {
  orderId: string;
  plan: string;
  amount: string;
  dueDate: string;
  status: "PENDING";
}

const installments: Installment[] = [
  { orderId: "#2", plan: "6 Month Plan", amount: "1,300 EGP", dueDate: "2/16/2024", status: "PENDING" },
  { orderId: "#2", plan: "6 Month Plan", amount: "1,300 EGP", dueDate: "3/16/2024", status: "PENDING" },
  { orderId: "#2", plan: "6 Month Plan", amount: "1,300 EGP", dueDate: "4/16/2024", status: "PENDING" }
];

export default function PendingInstallmentsTable() {
  return (
    <div className="bg-card rounded-xl border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-card-foreground">Pending Installments</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Order ID</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Plan</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Due Date</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((installment, index) => (
              <tr key={index} className="border-b border-border">
                <td className="px-6 py-4 text-sm font-medium text-primary">{installment.orderId}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{installment.plan}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{installment.amount}</td>
                <td className="px-6 py-4 text-sm text-card-foreground">{installment.dueDate}</td>
                <td className="px-6 py-4">
                  <Badge 
                    variant="secondary"
                    className="bg-warning/10 text-warning hover:bg-warning/20"
                  >
                    {installment.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}