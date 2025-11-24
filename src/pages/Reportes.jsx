import * as React from 'react'
import {
  Box, Paper, Typography, Stack, Divider, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, MenuItem, InputAdornment
} from '@mui/material'
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { API_BASE_URL } from '../config/api'
dayjs.extend(isBetween)

// --- Datos de ejemplo (luego los reemplazas por tu API/DB) ---
const ORDENES = [
  {
    id: 'ORD-001',
    fecha: '2025-11-10T10:10:00Z',
    cliente: { nombre: 'Ana López', telefono: '+502 5555 1111' },
    items: [
      { id: 1, name: 'Shampoo pH Neutro 1L', sku: 'SH-001', price: 89.9, qty: 1 },
      { id: 2, name: 'Toalla Secado 1200gsm', sku: 'TS-1200', price: 99.0, qty: 2 },
    ],
    empleada: 'Ana',
  },
  {
    id: 'ORD-002',
    fecha: '2025-11-11T16:40:00Z',
    cliente: { nombre: 'Carlos Méndez', telefono: '+502 5555 2222' },
    items: [
      { id: 3, name: 'Cera Sintética 500ml', sku: 'CE-500', price: 129.0, qty: 1 },
    ],
    empleada: 'María',
  },
  {
    id: 'ORD-003',
    fecha: '2025-11-12T03:20:00Z',
    cliente: { nombre: 'María Díaz', telefono: '+502 5555 3333' },
    items: [
      { id: 4, name: 'Guante Microfibra Premium', sku: 'GM-010', price: 59.5, qty: 3 },
      { id: 5, name: 'Ambientador New Car', sku: 'AN-001', price: 25.0, qty: 2 },
    ],
    empleada: 'Lucía',
  },
]

// Util: calcular total
function calcTotal(items) {
  return items.reduce((s, it) => s + it.price * it.qty, 0)
}

export default function Reportes() {
  const [ordenSel, setOrdenSel] = React.useState(null)
  const [empleadas, setEmpleadas] = React.useState([])
  const [ordenes, setOrdenes] = React.useState([])
  const [empleadaSel, setEmpleadaSel] = React.useState('')
    const [range, setRange] = React.useState([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ])

  const filtered = React.useMemo(() => {
    // si aún no hay órdenes del backend, usa los mocks
    const source = ordenes.length ? ordenes : ORDENES

    // Filtro por empleada seleccionada
    if (!empleadaSel) return source

    return source.filter(o => {
      // en mocks: o.empleada es string
      // en backend: o.empleada es { id, nombre, telefono }
      const nombreEmp = typeof o.empleada === 'string'
        ? o.empleada
        : o.empleada?.nombre

      return nombreEmp === empleadaSel
    })
  }, [ordenes, empleadaSel])

  // 🔹 GET /ordenes?inicio=...&fin=...
  const cargarOrdenes = async (inicioIso, finIso) => {
    try {
      const params = new URLSearchParams()
      if (inicioIso) params.append('inicio', inicioIso)
      if (finIso)    params.append('fin',    finIso)

      const res = await fetch(`${API_BASE_URL}/ordenes?${params.toString()}`)
      if (!res.ok) throw new Error('Error al obtener órdenes')

      const data = await res.json()
      setOrdenes(data)   // array de ordenes desde el back
    } catch (err) {
      console.error(err)
    }
  }

  const cargarEmpleadas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/empleadas`)
      if (!res.ok) throw new Error('Error al obtener empleadas')
      const data = await res.json()
      setEmpleadas(data)
    } catch (err) {
      console.error(err)
    }
  }
  function calcTotal(items) {
    return items.reduce((s, it) => {
      const price = it.price ?? it.precio_unitario ?? 0   // mock vs backend
      const qty   = it.qty   ?? it.cantidad       ?? 1
      return s + price * qty
    }, 0)
  }


  const totalPeriodo = filtered.reduce(
    (acc, o) => acc + calcTotal(o.items || []),
    0
  )

  const [porcentajeComision, setPorcentajeComision] = React.useState(0);

  const totalComision = React.useMemo(
    () => (porcentajeComision ? (totalPeriodo * porcentajeComision) / 100 : 0),
    [totalPeriodo, porcentajeComision]
  )

    // 🔹 Cargar empleadas una vez
  React.useEffect(() => {
    cargarEmpleadas()
  }, [])

  // 🔹 Cada vez que cambia el rango, pedir órdenes al backend
  React.useEffect(() => {
    const [from, to] = range
    if (!from || !to) return

    const inicioIso = from.startOf('day').toDate().toISOString()
    const finIso    = to.endOf('day').toDate().toISOString()

    cargarOrdenes(inicioIso, finIso)
  }, [range])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Reportes de ventas
        </Typography>

        
        <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
          {/* Fila original: rango de fechas + total período */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
          >
            <DateRangePicker
              calendars={2}
              value={range}
              onChange={(newVal) => setRange(newVal)}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                },
              }}
              localeText={{ start: 'Desde', end: 'Hasta' }}
            />

            <Chip
              label={`Total en el período: Q ${totalPeriodo.toFixed(2)}`}
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          {/* Nueva fila: empleada + porcentaje + total comisión */}
          
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>No. Orden</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => (
                <TableRow
                  key={o.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setOrdenSel(o)}
                >
                  <TableCell>{dayjs(o.fecha).format('YYYY-MM-DD HH:mm')}</TableCell>
                  <TableCell>{o.codigo ?? o.id}</TableCell>
                  <TableCell>{o.cliente?.nombre}</TableCell>
                  <TableCell align="right">
                    Q {calcTotal(o.items || []).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary" align="center">
                      No hay ventas en el rango seleccionado
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

          </Table>
        </TableContainer>

        {/* -------- Dialog Detalle de Orden -------- */}
        <Dialog open={!!ordenSel} onClose={() => setOrdenSel(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Orden {ordenSel?.id}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={1} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Fecha: {ordenSel ? dayjs(ordenSel.fecha).format('YYYY-MM-DD HH:mm') : '--'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cliente: {ordenSel?.cliente?.nombre} — {ordenSel?.cliente?.telefono}
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="right">Cant.</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenSel?.items?.map((it) => {
                  let nombre = ''
                  if (it.tipo === 'servicio') {
                    nombre =
                      it.servicio?.descripcion ||
                      it.nombre ||
                      `Servicio #${it.servicio_id ?? it.id}`
                  } else { // asumimos 'producto'
                    nombre =
                      it.producto?.descripcion ||
                      it.nombre ||
                      `Producto #${it.producto_id ?? it.id}`
                  }

                  // 🔹 SKU según tipo
                  let sku = it.producto.sku || ''

                  const price =
                    it.price ??                        // mock
                    it.precio_unitario ??              // backend snapshot
                    it.producto?.precio ??             // por si usas precio del producto
                    it.servicio?.precio ?? 0

                  const qty = it.qty ?? it.cantidad ?? 1

                  return (
                    <TableRow key={it.id}>
                      <TableCell>{nombre}</TableCell>
                      <TableCell>{sku}</TableCell>
                      <TableCell align="right">Q {price.toFixed(2)}</TableCell>
                      <TableCell align="right">{qty}</TableCell>
                      <TableCell align="right">Q {(price * qty).toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}


                <TableRow>
                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 600 }}>
                    Total
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Q {ordenSel ? calcTotal(ordenSel.items).toFixed(2) : '0.00'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrdenSel(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
