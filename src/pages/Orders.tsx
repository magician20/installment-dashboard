import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useOrders } from '@/hooks/useOrders';
import { OrderDialog } from '@/components/forms/OrderDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export default function Orders() {
  const { orders, loading, createOrder, updateOrder, deleteOrder } = useOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const { t } = useTranslation();
  const { direction } = useLanguage();

  const handleCreate = () => {
    setEditingOrder(null);
    setDialogOpen(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleDelete = (order) => {
    setOrderToDelete(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (orderToDelete) {
      await deleteOrder(orderToDelete.id);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const handleSubmit = async (data) => {
    if (editingOrder) {
      return await updateOrder(editingOrder.id, data);
    } else {
      return await createOrder(data);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered": return "bg-success/10 text-success hover:bg-success/20";
      case "processing": return "bg-primary/10 text-primary hover:bg-primary/20";
      case "shipped": return "bg-primary/10 text-primary hover:bg-primary/20";
      case "pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cancelled": return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default: return "bg-muted/10 text-muted-foreground hover:bg-muted/20";
    }
  };

  const isOrderLocked = (status: string) => {
    const lockableStatuses = ['shipped', 'delivered'];
    return lockableStatuses.includes(status.toLowerCase());
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8" dir={direction}>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t('orders.title')}</h1>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('orders.addNew')}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">{t('orders.header')}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('orders.customer')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('orders.orderDate')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('orders.total')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('orders.status')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('orders.paymentMethod')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm text-card-foreground">
                      {order.customer ? 
                        `${order.customer.first_name} ${order.customer.last_name}` 
                        : t('orders.na')}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">{order.total_amount.toLocaleString()} EGP</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="secondary"
                        className={getStatusVariant(order.status)}
                      >
                        {t(`orders.status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {t(`orders.paymentMethod_${order.payment_method}`)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8 px-3"
                          onClick={() => handleEdit(order)}
                          disabled={isOrderLocked(order.status)}
                          title={isOrderLocked(order.status) ? t('orders.cannotEditLocked') : t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => handleDelete(order)}
                          disabled={isOrderLocked(order.status)}
                          title={isOrderLocked(order.status) ? t('orders.cannotDeleteLocked') : t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('orders.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <OrderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          order={editingOrder}
          onSubmit={handleSubmit}
          title={editingOrder ? t('orders.editTitle') : t('orders.createTitle')}
          description={editingOrder ? t('orders.editDescription') : t('orders.createDescription')}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('orders.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('orders.deleteConfirmDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}