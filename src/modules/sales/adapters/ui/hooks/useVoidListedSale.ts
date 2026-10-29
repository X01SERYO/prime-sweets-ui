import { useState } from 'react';
import { saleErrorKey } from '@/modules/sales/adapters/ui/hooks/saleErrorKey';
import type { VoidSaleUseCase } from '@/modules/sales/application/use-cases/voidSale.useCase';
import type { MessageKey } from '@/shared/i18n/messages';

export function useVoidListedSale(voidSale: VoidSaleUseCase, onDone: () => void) {
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [error, setError] = useState<MessageKey | null>(null);

  async function voidConfirmed(saleId: string): Promise<boolean> {
    setVoidingId(saleId);
    setError(null);
    try {
      await voidSale.execute(saleId);
      onDone();
      return true;
    } catch (caught) {
      setError(saleErrorKey(caught, 'saleVoidFailed'));
      return false;
    } finally {
      setVoidingId(null);
    }
  }

  return { voidingId, error, voidConfirmed };
}
