import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export interface OrderItemFormData {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderItemsFormProps {
  items: OrderItemFormData[];
  onChange: (items: OrderItemFormData[]) => void;
  onTotalChange: (total: number) => void;
}

export function OrderItemsForm({ items, onChange, onTotalChange }: OrderItemsFormProps) {
  const { products } = useProducts();
  const { t } = useTranslation();
  const { direction } = useLanguage();

  const addItem = () => {
    const newItem: OrderItemFormData = {
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    updateTotal(newItems);
  };

  const updateItem = (index: number, field: keyof OrderItemFormData, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // If product changed, update unit price
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].unit_price = product.price;
        newItems[index].total_price = product.price * newItems[index].quantity;
      }
    }
    
    // If quantity or unit_price changed, update total_price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].unit_price * newItems[index].quantity;
    }
    
    onChange(newItems);
    updateTotal(newItems);
  };

  const updateTotal = (currentItems: OrderItemFormData[]) => {
    const total = currentItems.reduce((sum, item) => sum + item.total_price, 0);
    onTotalChange(total);
  };

  return (
    <Card dir={direction}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('orders.orderItems')}
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('orders.addProduct')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            {t('orders.noProductsAdded')}
          </p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
              <div className="col-span-4">
                <Label htmlFor={`product-${index}`}>{t('products.name')}</Label>
                <Select
                  value={item.product_id}
                  onValueChange={(value) => updateItem(index, 'product_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('orders.selectProduct')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.price.toLocaleString()} EGP
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`quantity-${index}`}>{t('orders.quantity')}</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor={`unit-price-${index}`}>{t('orders.unitPrice')}</Label>
                <Input
                  id={`unit-price-${index}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="col-span-3">
                <Label>{t('orders.total')}</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center">
                  {item.total_price.toLocaleString()} EGP
                </div>
              </div>
              
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
        
        {items.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <div className="text-lg font-semibold">
              {t('orders.total')}: {items.reduce((sum, item) => sum + item.total_price, 0).toLocaleString()} EGP
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}