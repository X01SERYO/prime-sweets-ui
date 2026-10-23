export const routes = [
  { path: '/sales-day', label: 'Jornada', note: 'Abrir, ver, cerrar y reabrir la jornada queda para el módulo sales-day.' },
  { path: '/customers', label: 'Clientes', note: 'Buscar y crear clientes queda para el módulo customers.' },
  { path: '/sales', label: 'Venta', note: 'Capturar y confirmar la venta queda para el módulo sales.' },
  {
    path: '/load-sheets',
    label: 'Hoja de cargue',
    note: 'La hoja se consulta cuando la jornada está cerrada. Esta pantalla todavía no llama al API.'
  },
  { path: '/invoices', label: 'Facturas', note: 'Listar e imprimir facturas queda para el módulo fulfillment-output.' }
] as const;
