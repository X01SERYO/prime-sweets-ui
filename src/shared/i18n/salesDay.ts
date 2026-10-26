import { catalog } from '@/shared/i18n/catalog';

export const salesDayMessages = catalog(
  {
    salesDay: 'Jornada',
    closeDay: 'Cerrar jornada',
    salesDayLoading: 'Consultando la jornada…',
    salesDayMissing: 'Hoy no hay jornada para este vendedor.',
    salesDayFailed: 'No se pudo consultar la jornada.',
    salesDayInvalid: 'La jornada no tiene el formato esperado.',
    salesDaySellerRequired: 'Falta el vendedor de la sesión.',
    salesDayOpen: 'Abierta',
    salesDayClosed: 'Cerrada',
    closeLater: 'Cargar, cerrar y reabrir la jornada llega con el módulo de jornada.',
    loadLater: 'Cargue y Facturas se habilitan al cerrar la jornada.'
  },
  {
    salesDay: 'Sales Day',
    closeDay: 'Close sales day',
    salesDayLoading: 'Loading the sales day…',
    salesDayMissing: 'There is no sales day for this seller today.',
    salesDayFailed: 'Could not load the sales day.',
    salesDayInvalid: 'The sales day response has an unexpected format.',
    salesDaySellerRequired: 'The signed-in seller is missing.',
    salesDayOpen: 'Open',
    salesDayClosed: 'Closed',
    closeLater: 'Opening, closing, and reopening the sales day arrives with that module.',
    loadLater: 'Load sheet and invoices become available after the sales day is closed.'
  }
);
