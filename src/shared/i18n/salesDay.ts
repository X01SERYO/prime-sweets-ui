import { catalog } from '@/shared/i18n/catalog';

export const salesDayMessages = catalog(
  {
    salesDay: 'Jornada',
    closeDay: 'Cerrar jornada',
    salesDayLoading: 'Consultando la jornada…',
    openDay: 'Abrir jornada',
    openingDay: 'Abriendo…',
    salesDayAlreadyOpen: 'La jornada de hoy ya está abierta.',
    salesDayOpenFailed: 'No se pudo abrir la jornada.',
    salesDayMissing: 'Hoy no hay jornada para este vendedor.',
    salesDayFailed: 'No se pudo consultar la jornada.',
    salesDayInvalid: 'La jornada no tiene el formato esperado.',
    salesDaySellerRequired: 'Falta el vendedor de la sesión.',
    salesDayOpen: 'Abierta',
    salesDayClosed: 'Cerrada',
    closeLater: 'Cerrar y reabrir la jornada llegan en el siguiente paso.',
    loadLater: 'Cargue y Facturas se habilitan al cerrar la jornada.'
  },
  {
    salesDay: 'Sales Day',
    closeDay: 'Close sales day',
    salesDayLoading: 'Loading the sales day…',
    openDay: 'Open sales day',
    openingDay: 'Opening…',
    salesDayAlreadyOpen: 'Today’s sales day is already open.',
    salesDayOpenFailed: 'Could not open the sales day.',
    salesDayMissing: 'There is no sales day for this seller today.',
    salesDayFailed: 'Could not load the sales day.',
    salesDayInvalid: 'The sales day response has an unexpected format.',
    salesDaySellerRequired: 'The signed-in seller is missing.',
    salesDayOpen: 'Open',
    salesDayClosed: 'Closed',
    closeLater: 'Closing and reopening the sales day arrive in the next step.',
    loadLater: 'Load sheet and invoices become available after the sales day is closed.'
  }
);
