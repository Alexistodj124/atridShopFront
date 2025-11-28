import * as React from 'react'
import {
  Box, Paper, Typography, Stack, Divider, TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, MenuItem, InputAdornment, IconButton
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { API_BASE_URL } from '../config/api'
dayjs.extend(isBetween)

// --- Datos de ejemplo (luego los reemplazas por tu API/DB) ---

// Util: calcular total
function calcTotal(items) {
  return items.reduce((s, it) => {
    const price = it.price ?? it.precio_unitario ?? it.producto?.precio ?? 0
    const qty = it.qty ?? it.cantidad ?? 1
    return s + price * qty
  }, 0)
}

// Util: calcular ganancia de una lista de items
function calcGanancia(items) {
  return items.reduce((acc, it) => {
    const price = it.price ?? it.precio_unitario ?? 0
    const qty = it.qty ?? it.cantidad ?? 1
    const costoUnit =
      it.costo_unitario ??
      it.costo ??
      it.producto?.costo ??
      0
    return acc + (price - costoUnit) * qty
  }, 0)
}

export default function Reportes() {
  const [ordenSel, setOrdenSel] = React.useState(null)
  const [ordenes, setOrdenes] = React.useState([])
    const [range, setRange] = React.useState([
    dayjs().startOf('month'),
    dayjs().endOf('day'),
  ])
  const [deletingId, setDeletingId] = React.useState(null)

  const filtered = React.useMemo(() => {
  // usa SOLO backend
    const source = ordenes
  
    // si no hay empleada seleccionada, devuelve todas  
    return source
  }, [ordenes])


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

  const handleDeleteOrden = async (id) => {
    if (!id) return
    const confirmed = window.confirm('¿Eliminar esta orden?')
    if (!confirmed) return

    try {
      setDeletingId(id)
      const res = await fetch(`${API_BASE_URL}/ordenes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar orden')
      setOrdenes((prev) => prev.filter((o) => o.id !== id))
      if (ordenSel?.id === id) setOrdenSel(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }


  const totalPeriodo = filtered.reduce(
    (acc, o) => acc + calcTotal(o.items || []),
    0
  )

  const gananciaPeriodo = filtered.reduce(
    (acc, o) => acc + calcGanancia(o.items || []),
    0
  )

  const [porcentajeComision, setPorcentajeComision] = React.useState(0);

  const totalComision = React.useMemo(
    () => (porcentajeComision ? (totalPeriodo * porcentajeComision) / 100 : 0),
    [totalPeriodo, porcentajeComision]
  )

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
            <Chip
              label={`Ganancia en el periodo: Q ${gananciaPeriodo.toFixed(2)}`}
              color="success"
              sx={{ fontWeight: 600 }}
            />
          </Stack>

          
        </Paper>

        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>No. Orden</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="center">Acciones</TableCell>
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
                  <TableCell align="center">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteOrden(o.id)
                      }}
                      disabled={deletingId === o.id}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
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
            {ordenSel && (
              <Button
                color="error"
                onClick={() => handleDeleteOrden(ordenSel.id)}
                disabled={deletingId === ordenSel.id}
              >
                Eliminar
              </Button>
            )}
            <Button onClick={() => setOrdenSel(null)}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  )
}
