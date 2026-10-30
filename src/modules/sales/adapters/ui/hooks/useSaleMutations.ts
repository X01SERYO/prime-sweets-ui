import { useState } from 'react';
import type { AddSaleItemUseCase } from '@/modules/sales/application/use-cases/addSaleItem.useCase';
import type { RemoveSaleItemUseCase } from '@/modules/sales/application/use-cases/removeSaleItem.useCase';
import type { UpdateSaleItemNameUseCase } from '@/modules/sales/application/use-cases/updateSaleItemName.useCase';
import type { UpdateSaleItemQuantityUseCase } from '@/modules/sales/application/use-cases/updateSaleItemQuantity.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { MessageKey } from '@/shared/i18n/messages';
import { isSellableQuantity } from '@/modules/sales/domain/quantity';

export function useSaleMutations(
  sale: SaleModel | null,
  onSale: (sale: SaleModel) => void,
  addItem: AddSaleItemUseCase,
  updateQuantity: UpdateSaleItemQuantityUseCase,
  updateName: UpdateSaleItemNameUseCase,
  removeItem: RemoveSaleItemUseCase
) {
  const [error, setError] = useState<MessageKey | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<SaleModel>): Promise<SaleModel | null> {
    if (!sale || (sale.status !== 'DRAFT' && sale.status !== 'CONFIRMED')) {
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await action();
      onSale(next);
      return next;
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleLineFailed'));
      return null;
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    accept: async (productId: string, quantity: number, itemName: string): Promise<SaleModel | null> => {
      if (!sale || (sale.status !== 'DRAFT' && sale.status !== 'CONFIRMED')) {
        return null;
      }
      if (!isSellableQuantity(quantity)) {
        setError('saleQuantityInvalid');
        return null;
      }
      const name = itemName.trim();
      if (!name) {
        setError('saleNameRequired');
        return null;
      }
      setBusy(true);
      setError(null);
      try {
        const next = await addItem.execute(sale.id, productId, quantity, name);
        onSale(next);
        return next;
      } catch (caught) {
        setError(saleErrorKey(caught, 'saleLineFailed'));
        return null;
      } finally {
        setBusy(false);
      }
    },
    changeQuantity: (itemId: string, quantity: number) => {
      if (!isSellableQuantity(quantity)) {
        setError('saleQuantityInvalid');
        return;
      }
      return run(() => updateQuantity.execute(sale!.id, itemId, quantity));
    },
    changeName: (itemId: string, itemName: string) => {
      if (!sale || sale.status !== 'DRAFT') {
        return;
      }
      if (!itemName.trim()) {
        setError('saleNameRequired');
        return;
      }
      return run(() => updateName.execute(sale.id, itemId, itemName));
    },
    remove: (itemId: string) => run(() => removeItem.execute(sale!.id, itemId))
  };
}
