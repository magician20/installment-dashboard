import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Order, CreateOrderData } from '@/hooks/useOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { useInstallmentPlans } from '@/hooks/useInstallmentPlans';
import { OrderItemsForm, OrderItemFormData } from './OrderItemsForm';
import { PaymentDialog } from './PaymentDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: Order | null;
  onSubmit: (data: CreateOrderData) => Promise<any>;
  title: string;
  description: string;
}

const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'installment',
];

const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function OrderDialog({ open, onOpenChange, order, onSubmit, title, description }: OrderDialogProps) {
  const { customers } = useCustomers();
  const { installmentPlans } = useInstallmentPlans();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { direction } = useLanguage();
  const [formData, setFormData] = useState<CreateOrderData>({
    customer_id: '',
    total_amount: 0,
    payment_method: '',
    status: 'pending',
    order_date: new Date().toISOString().split('T')[0],
  });

  // Debug formData changes
  useEffect(() => {
    console.log('formData.total_amount changed to:', formData.total_amount);
  }, [formData.total_amount]);
  const [selectedInstallmentPlanId, setSelectedInstallmentPlanId] = useState<string | undefined>(undefined);
  const [orderItems, setOrderItems] = useState<OrderItemFormData[]>([]);
  const [baseTotal, setBaseTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        status: order.status,
        order_date: order.order_date,
      });
      setBaseTotal(order.total_amount);
      setSelectedInstallmentPlanId(undefined);
    } else {
      setFormData({
        customer_id: '',
        total_amount: 0,
        payment_method: '',
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
      });
      setOrderItems([]);
      setBaseTotal(0);
      setSelectedInstallmentPlanId(undefined);
    }
  }, [order, open]);

  // Calculate total with interest when installment plan changes
  useEffect(() => {
    console.log('Total calculation effect triggered:', {
      payment_method: formData.payment_method,
      selectedInstallmentPlanId,
      baseTotal,
      installmentPlans: installmentPlans.length
    });

    if (formData.payment_method === 'installment' && selectedInstallmentPlanId) {
      const plan = installmentPlans.find(p => p.id === selectedInstallmentPlanId);
      console.log('Found plan:', plan);
      
      if (plan) {
        let totalWithInterest;
        
        if (plan.plan_type === 'flexible' && plan.advance_payment_amount) {
          // For flexible plans: (remaining amount * interest rate) + advance payment
          const remainingAmount = baseTotal - plan.advance_payment_amount;
          const interestAmount = remainingAmount * plan.interest_rate;
          totalWithInterest = remainingAmount + interestAmount + plan.advance_payment_amount;
          console.log('Flexible plan calculation:', { remainingAmount, interestAmount, totalWithInterest });
        } else {
          // For fixed plans: total amount * (1 + interest rate)
          totalWithInterest = baseTotal * (1 + plan.interest_rate);
          console.log('Fixed plan calculation:', { baseTotal, interestRate: plan.interest_rate, totalWithInterest });
        }
        
        console.log('Setting total amount to:', totalWithInterest);
        setFormData(prev => ({ ...prev, total_amount: totalWithInterest }));
      }
    } else {
      console.log('Setting total amount to base total:', baseTotal);
      setFormData(prev => ({ ...prev, total_amount: baseTotal }));
    }
  }, [formData.payment_method, selectedInstallmentPlanId, baseTotal, installmentPlans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editing an existing order, only update the status
    if (order) {
      setLoading(true);
      try {
        const result = await onSubmit({ status: formData.status } as CreateOrderData);
        if (!result.error) {
          onOpenChange(false);
        }
      } catch (error) {
        console.error('Error updating order:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // For new orders, apply full validation
    if (!formData.customer_id || !formData.payment_method || formData.total_amount <= 0) return;
    if (formData.payment_method === 'installment' && !selectedInstallmentPlanId) return;
    if (orderItems.length === 0) return;

    // For installment payments, navigate to payment section first
    if (formData.payment_method === 'installment' && selectedInstallmentPlanId) {
      const plan = installmentPlans.find(p => p.id === selectedInstallmentPlanId);
      if (plan) {
        // Store order data for later processing
        setPendingOrderData({
          formData,
          orderItems,
          baseTotal,
          plan
        });
        setShowPaymentDialog(true);
        return;
      }
    }

    // For non-installment payments, proceed with normal order creation
    await createOrder();
  };

  const createOrder = async () => {
    setLoading(true);
    
    try {
      // Create the order first
      const result = await onSubmit(formData);
      
      if (!result.error && result.data && !order) {
        // If it's a new order, create order items
        const orderItemsData = orderItems.map(item => ({
          order_id: result.data.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;

        // If installment payment, create installments
        if (formData.payment_method === 'installment' && selectedInstallmentPlanId) {
          const { error: installmentError } = await supabase.rpc('create_installments_for_order', {
            p_order_id: result.data.id,
            p_plan_id: selectedInstallmentPlanId,
            p_start_date: formData.order_date,
          });

          if (installmentError) throw installmentError;
        }
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    console.log('handlePaymentSuccess called with:', paymentData);
    console.log('pendingOrderData:', pendingOrderData);
    
    try {
      // Create the order first
      console.log('Creating order with formData:', pendingOrderData.formData);
      const result = await onSubmit(pendingOrderData.formData);
      console.log('Order creation result:', result);
      
      if (!result.error && result.data) {
        // Create order items
        const orderItemsData = pendingOrderData.orderItems.map(item => ({
          order_id: result.data.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;

        // Create installments
        const { data: installmentResult, error: installmentError } = await supabase.rpc('create_installments_for_order', {
          p_order_id: result.data.id,
          p_plan_id: pendingOrderData.plan.id,
          p_start_date: pendingOrderData.formData.order_date,
        });

        if (installmentError) {
          console.error('Error creating installments:', installmentError);
          throw installmentError;
        }

        console.log('Installment creation result:', installmentResult);

        // Record the payment and link it to the installment
        if (pendingOrderData.plan.plan_type === 'fixed') {
          // For fixed plans, get the first installment and create payment with installment_id
          const { data: installments, error: installmentError } = await supabase
            .from('installments')
            .select('id')
            .eq('order_id', result.data.id)
            .eq('installment_number', '1')
            .limit(1);

          if (installmentError) {
            console.error('Error fetching first installment:', installmentError);
            throw installmentError;
          }

          if (installments && installments.length > 0) {
            // Use the process_payment function to properly link payment to installment
            const { data: paymentResult, error: paymentError } = await supabase.rpc('process_payment', {
              p_order_id: result.data.id,
              p_amount: paymentData.amount,
              p_payment_method: paymentData.payment_method,
              p_installment_id: installments[0].id,
              p_reference_number: paymentData.reference_number,
              p_notes: paymentData.notes
            });

            if (paymentError) {
              console.error('Error processing payment:', paymentError);
              throw paymentError;
            }

            console.log('Payment processed and linked to installment:', paymentResult);
          } else {
            console.warn('No first installment found for order:', result.data.id);
            // Fallback: create payment without installment_id
            const paymentRecord = {
              order_id: result.data.id,
              amount: paymentData.amount,
              payment_method: paymentData.payment_method,
              payment_date: paymentData.payment_date,
              reference_number: paymentData.reference_number,
              notes: paymentData.notes,
            };

            const { error: paymentError } = await supabase
              .from('payments')
              .insert([paymentRecord]);

            if (paymentError) throw paymentError;
          }
        } else if (pendingOrderData.plan.plan_type === 'flexible') {
          // For flexible plans, create advance payment installment first
          const advancePaymentInstallment = {
            order_id: result.data.id,
            installment_plan_id: pendingOrderData.plan.id,
            installment_number: 'Advance Payment',
            due_date: new Date().toISOString().split('T')[0], // Due immediately
            amount: paymentData.amount,
            status: 'paid',
            payment_date: paymentData.payment_date,
          };

          const { data: advanceInstallment, error: advanceError } = await supabase
            .from('installments')
            .insert([advancePaymentInstallment])
            .select()
            .single();

          if (advanceError) throw advanceError;

          // Create payment record linked to the advance payment installment
          const paymentRecord = {
            order_id: result.data.id,
            installment_id: advanceInstallment.id,
            amount: paymentData.amount,
            payment_method: paymentData.payment_method,
            payment_date: paymentData.payment_date,
            reference_number: paymentData.reference_number,
            notes: paymentData.notes,
          };

          const { error: paymentError } = await supabase
            .from('payments')
            .insert([paymentRecord]);

          if (paymentError) throw paymentError;

          // Check if installments were created
          const installmentResultData = installmentResult as any;
          if (installmentResultData && installmentResultData.installments_created === 0) {
            console.log('No installments created - advance payment covers entire amount');
          } else {
            console.log('Installments created for flexible plan:', installmentResultData?.installments_created);
          }
        }
        // For flexible plans, the advance payment is already recorded above
        
        // Show success message
        toast({
          title: "Order and Payment Processed Successfully",
          description: `Order created and ${pendingOrderData.plan.plan_type === 'flexible' ? 'advance payment' : 'first payment'} recorded.`,
        });
      }
      
      // Reset payment dialog state
      setShowPaymentDialog(false);
      setPendingOrderData(null);
      
      // Reset form data after successful payment
      setFormData({
        customer_id: '',
        total_amount: 0,
        payment_method: '',
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
      });
      setOrderItems([]);
      setBaseTotal(0);
      setSelectedInstallmentPlanId(undefined);
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error processing payment and creating order:', error);
      toast({
        title: "Error Processing Payment",
        description: error.message || "Failed to process payment and create order.",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    // Only reset form data if we're actually closing the dialog and not opening payment dialog
    if (!newOpen && !order && !showPaymentDialog) {
      setFormData({
        customer_id: '',
        total_amount: 0,
        payment_method: '',
        status: 'pending',
        order_date: new Date().toISOString().split('T')[0],
      });
      setOrderItems([]);
      setBaseTotal(0);
      setSelectedInstallmentPlanId(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" dir={direction}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {!order && (
              <OrderItemsForm
                items={orderItems}
                onChange={setOrderItems}
                onTotalChange={setBaseTotal}
              />
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customer" className="ltr:text-right rtl:text-left">
                {t('orders.customer')}
              </Label>
              {order ? (
                <div className="col-span-3 h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                  {order.customer ? 
                    `${order.customer.first_name} ${order.customer.last_name} - ${order.customer.email}` 
                    : 'No customer selected'
                  }
                </div>
              ) : (
                <Select
                  value={formData.customer_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('orders.customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total_amount" className="ltr:text-right rtl:text-left">
                {t('orders.total')}
                {formData.payment_method === 'installment' && selectedInstallmentPlanId && (() => {
                  const plan = installmentPlans.find(p => p.id === selectedInstallmentPlanId);
                  if (plan?.plan_type === 'flexible' && plan.advance_payment_amount) {
                    const remainingAmount = baseTotal - plan.advance_payment_amount;
                    const interestAmount = remainingAmount * plan.interest_rate;
                    return (
                      <span className="text-sm text-muted-foreground block">
                        (Base: {baseTotal.toLocaleString()} EGP - Advance: {plan.advance_payment_amount.toLocaleString()} EGP + Interest: {interestAmount.toLocaleString()} EGP)
                      </span>
                    );
                  } else if (plan?.plan_type === 'fixed') {
                    return (
                      <span className="text-sm text-muted-foreground block">
                        (Base: {baseTotal.toLocaleString()} EGP + Interest: {((baseTotal * plan.interest_rate)).toLocaleString()} EGP = {formData.total_amount.toLocaleString()} EGP)
                      </span>
                    );
                  } else {
                    return (
                      <span className="text-sm text-muted-foreground block">
                        (Base: {baseTotal.toLocaleString()} EGP + Interest)
                      </span>
                    );
                  }
                })()}
              </Label>
              <div className="col-span-3">
                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                  {formData.total_amount.toLocaleString()} EGP
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="payment_method" className="ltr:text-right rtl:text-left">
                {t('orders.paymentMethod')}
              </Label>
              {order ? (
                <div className="col-span-3 h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                  {formData.payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              ) : (
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      payment_method: value
                    }));
                    if (value !== 'installment') {
                      setSelectedInstallmentPlanId(undefined);
                    }
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={t('orders.paymentMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {t(`orders.paymentMethod_${method}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {formData.payment_method === 'installment' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="installment_plan" className="ltr:text-right rtl:text-left">
                  {t('installmentPlans.name')}
                </Label>
                {order ? (
                  <div className="col-span-3 h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                    {selectedInstallmentPlanId ? (() => {
                      const plan = installmentPlans.find(p => p.id === selectedInstallmentPlanId);
                      return plan ? `${plan.name} (${plan.plan_type === 'flexible' ? 'Flexible' : 'Fixed'}, ${plan.duration} months, ${plan.interest_rate}%${plan.plan_type === 'flexible' && plan.advance_payment_amount ? `, ${plan.advance_payment_amount.toLocaleString()} EGP advance` : ''})` : 'No plan selected';
                    })() : 'No plan selected'}
                  </div>
                ) : (
                  <Select
                    value={selectedInstallmentPlanId || 'none'}
                    onValueChange={(value) => setSelectedInstallmentPlanId(value === 'none' ? undefined : value)}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t('installmentPlans.selectPlan')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select a plan</SelectItem>
                      {installmentPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} ({plan.plan_type === 'flexible' ? 'Flexible' : 'Fixed'}, {plan.duration} months, {plan.interest_rate}%
                          {plan.plan_type === 'flexible' && plan.advance_payment_amount ? `, ${plan.advance_payment_amount.toLocaleString()} EGP advance` : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="ltr:text-right rtl:text-left">
                {t('orders.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`orders.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_date" className="ltr:text-right rtl:text-left">
                {t('orders.orderDate')}
              </Label>
              {order ? (
                <div className="col-span-3 h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                  {new Date(formData.order_date).toLocaleDateString()}
                </div>
              ) : (
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                  className="col-span-3"
                  required
                />
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || (!order && (!formData.customer_id || !formData.payment_method || formData.total_amount <= 0 || (formData.payment_method === 'installment' && !selectedInstallmentPlanId) || orderItems.length === 0))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {order ? t('common.edit') : t('orders.addNew')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* Payment Dialog for installment plans */}
      {showPaymentDialog && pendingOrderData && (
        <PaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          payment={null}
          onSubmit={handlePaymentSuccess}
          title={pendingOrderData.plan.plan_type === 'flexible' ? t('payments.processAdvancePayment') : t('payments.confirmFirstPayment')}
          description={pendingOrderData.plan.plan_type === 'flexible' 
            ? t('payments.processAdvancePaymentDescription', { 
                amount: pendingOrderData.plan.advance_payment_amount?.toLocaleString(), 
                planName: pendingOrderData.plan.name 
              })
            : t('payments.confirmFirstPaymentDescription', { planName: pendingOrderData.plan.name })
          }
          prePaymentData={{
            plan: pendingOrderData.plan,
            baseTotal: pendingOrderData.baseTotal,
            totalAmount: pendingOrderData.formData.total_amount
          }}
        />
      )}
    </Dialog>
  );
}