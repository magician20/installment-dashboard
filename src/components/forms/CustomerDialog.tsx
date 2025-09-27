import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Customer, CreateCustomerData } from '@/hooks/useCustomers';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { validateEgyptianPhoneNumber, validateEgyptianNationalId, formatEgyptianPhoneNumber } from '@/lib/validation';

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: CreateCustomerData) => Promise<any>;
  title: string;
  description: string;
  hasOrders?: boolean;
}

export function CustomerDialog({ open, onOpenChange, customer, onSubmit, title, description, hasOrders = false }: CustomerDialogProps) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    identity_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { t } = useTranslation();
  const { direction } = useLanguage();

  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone_number: customer.phone_number || '',
        address: customer.address || '',
        identity_number: customer.identity_number || '',
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        identity_number: '',
      });
    }
    setErrors({});
  }, [customer, open]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate phone number if provided
    if (formData.phone_number && !validateEgyptianPhoneNumber(formData.phone_number)) {
      newErrors.phone_number = t('customers.invalidPhoneNumber');
    }

    // Validate identity number if provided
    if (formData.identity_number && !validateEgyptianNationalId(formData.identity_number)) {
      newErrors.identity_number = t('customers.invalidIdentityNumber');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()) return;

    if (!validateForm()) return;

    setLoading(true);
    
    // Format phone number before submission
    const formattedData = {
      ...formData,
      phone_number: formData.phone_number ? formatEgyptianPhoneNumber(formData.phone_number) : formData.phone_number,
    };

    const result = await onSubmit(formattedData);
    setLoading(false);

    if (!result.error) {
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen && !customer) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        address: '',
        identity_number: '',
      });
    }
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px]" dir={direction}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="ltr:text-right rtl:text-left">
                {t('common.firstName')}
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="col-span-3"
                placeholder={t('common.firstName')}
                required
                disabled={hasOrders && !!customer}
                title={hasOrders && customer ? t('customers.cannotEditName') : ""}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="ltr:text-right rtl:text-left">
                {t('common.lastName')}
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                className="col-span-3"
                placeholder={t('common.lastName')}
                required
                disabled={hasOrders && !!customer}
                title={hasOrders && customer ? t('customers.cannotEditName') : ""}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="ltr:text-right rtl:text-left">
                {t('common.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="col-span-3"
                placeholder={t('common.email')}
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone_number" className="ltr:text-right rtl:text-left">
                {t('common.phone')}
              </Label>
              <div className="col-span-3">
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder={t('customers.phoneNumberPlaceholder')}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.phone_number}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="identity_number" className="ltr:text-right rtl:text-left">
                {t('common.identityNumber')}
              </Label>
              <div className="col-span-3">
                <Input
                  id="identity_number"
                  value={formData.identity_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, identity_number: e.target.value }))}
                  placeholder={t('customers.identityNumberPlaceholder')}
                  maxLength={14}
                />
                {errors.identity_number && (
                  <p className="text-sm text-red-500 mt-1">{errors.identity_number}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="ltr:text-right rtl:text-left">
                {t('common.address')}
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="col-span-3"
                placeholder={t('common.address')}
                rows={3}
              />
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
              disabled={loading || !formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim()}
            >
              {loading && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
              {customer ? t('common.edit') : t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}