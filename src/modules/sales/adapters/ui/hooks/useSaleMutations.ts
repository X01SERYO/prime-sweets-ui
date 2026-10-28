import { useState } from 'react';
import type { AddSaleItemUseCase } from '@/modules/sales/application/use-cases/addSaleItem.useCase';
import type { RemoveSaleItemUseCase } from '@/modules/sales/application/use-cases/removeSaleItem.useCase';
import type { UpdateSaleItemNameUseCase } from '@/modules/sales/application/use-cases/updateSaleItemName.useCase';
import type { UpdateSaleItemQuantityUseCase } from '@/modules/sales/application/use-cases/updateSaleItemQuantity.useCase';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { SaleModel } from '@/modules/sales/domain/models/sale';
import type { MessageKey } from '@/shared/i18n/messages';

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

  async function run(action: () => Promise<SaleModel>) {
    if (!sale || sale.status !== 'DRAFT') {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSale(await action());
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleLineFailed'));
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    add: (productId: string) => run(() => addItem.execute(sale!.id, productId, 1)),
    changeQuantity: (productId: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setError('saleQuantityInvalid');
        return;
      }
      return run(() => updateQuantity.execute(sale!.id, productId, quantity));
    },
    changeName: (productId: string, itemName: string) => {
      if (!itemName.trim()) {
        setError('saleNameRequired');
        return;
      }
      return run(() => updateName.execute(sale!.id, productId, itemName));
    },
    remove: (productId: string) => run(() => removeItem.execute(sale!.id, productId))
  };
}
