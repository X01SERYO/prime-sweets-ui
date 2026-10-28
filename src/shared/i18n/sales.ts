import { catalog } from '@/shared/i18n/catalog';

export const salesMessages = catalog(
  {
    addItem: 'Agregar',
    saleLoading: 'Preparando la venta…',
    saleDayMissing: 'Abre la jornada de hoy antes de vender.',
    saleDayClosed: 'La jornada está cerrada. No se puede editar la venta.',
    saleLoadFailed: 'No se pudo preparar la venta.',
    saleLineFailed: 'No se pudo actualizar la línea.',
    saleInvalid: 'La venta no tiene el formato esperado.',
    saleQuantityInvalid: 'La cantidad debe ser un entero mayor que cero.',
    saleNameRequired: 'El nombre de la línea no puede quedar vacío.',
    saleEmpty: 'Todavía no hay líneas.',
    saleTotal: 'Total',
    itemName: 'Nombre en la factura',
    removeItem: 'Quitar'
  },
  {
    addItem: 'Add',
    saleLoading: 'Preparing the sale…',
    saleDayMissing: 'Open today’s sales day before selling.',
    saleDayClosed: 'The sales day is closed. The sale cannot be edited.',
    saleLoadFailed: 'The sale could not be prepared.',
    saleLineFailed: 'The line could not be updated.',
    saleInvalid: 'The sale response has an unexpected format.',
    saleQuantityInvalid: 'Quantity must be an integer greater than zero.',
    saleNameRequired: 'The line name cannot be empty.',
    saleEmpty: 'There are no lines yet.',
    saleTotal: 'Total',
    itemName: 'Name on the invoice',
    removeItem: 'Remove'
  }
);
