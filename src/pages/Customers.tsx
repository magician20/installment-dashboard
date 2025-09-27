import { useState } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useCustomers } from '@/hooks/useCustomers';
import { CustomerDialog } from '@/components/forms/CustomerDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

export default function Customers() {
  const { customers, loading, createCustomer, updateCustomer, deleteCustomer, customersWithOrders } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const { t } = useTranslation();

  const handleCreate = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      await deleteCustomer(customerToDelete.id);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleSubmit = async (data) => {
    if (editingCustomer) {
      return await updateCustomer(editingCustomer.id, data);
    } else {
      return await createCustomer(data);
    }
  };

  const isCustomerLocked = (customerId: string) => {
    return customersWithOrders.has(customerId);
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
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('customers.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('customers.subtitle')}</p>
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary-hover">
            <Plus className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('customers.createNew')}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-card-foreground">{t('navigation.customers')}</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.name')}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.email')}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.phone')}</th>
                  <th className="px-6 py-4 ltr:text-left rtl:text-right text-sm font-medium text-muted-foreground">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border">
                    <td className="px-6 py-4 text-sm text-card-foreground font-medium">
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-card-foreground">{customer.email}</td>
                    <td className="px-6 py-4 text-sm text-card-foreground">{customer.phone_number || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="h-8 px-3"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="w-4 h-4" />
                          {t('common.edit')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          className="h-8 px-3"
                          onClick={() => handleDelete(customer)}
                          disabled={isCustomerLocked(customer.id)}
                          title={isCustomerLocked(customer.id) ? t('customers.cannotDelete') : t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                      {t('customers.noCustomers')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editingCustomer}
          onSubmit={handleSubmit}
          title={editingCustomer ? t('customers.editTitle') : t('customers.createTitle')}
          description={editingCustomer ? t('customers.editDescription') : t('customers.createDescription')}
          hasOrders={editingCustomer ? isCustomerLocked(editingCustomer.id) : false}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('customers.deleteTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('customers.deleteDescription')}
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