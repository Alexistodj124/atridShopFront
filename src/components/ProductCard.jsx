// src/components/ProductCard.jsx
import * as React from 'react'
import { Card, CardActionArea, Box, Typography, Chip } from '@mui/material'

export default function ProductCard({ product, onClick }) {
  const { id, descripcion, precio, cantidad, imagen } = product
  const low = cantidad <= 5
  const esServicio = cantidad === 9999

  const wrapDescription = (text, maxCharsPerLine, maxLines) => {
    if (!text) return ''

    const words = text.split(' ')
    const lines = []
    let current = ''

    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      const tentative = (current + ' ' + word).trim()

      if (tentative.length > maxCharsPerLine) {
        // cerramos la línea actual
        if (current) lines.push(current.trim())
        else lines.push(word) // por si una palabra sola ya se pasa

        current = ''
        if (lines.length === maxLines) break
      } else {
        current = tentative
      }

      // si ya vamos en la última palabra
      if (i === words.length - 1 && current && lines.length < maxLines) {
        lines.push(current.trim())
      }

      if (lines.length === maxLines) break
    }

    // si quedaron palabras sin meter, añadimos "…"
    const totalLength = text.length
    const joined = lines.join(' ')
    if (totalLength > joined.length) {
      lines[lines.length - 1] = lines[lines.length - 1] + '…'
    }

    return lines.join('\n')
  }

  const descFormateada = wrapDescription(descripcion, 15, 5)

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        flex: 1,                         // 🔹 llena el alto del Grid item
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea
        onClick={onClick}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {/* Imagen con altura fija */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            borderBottom: 1,
            borderColor: 'divider',
            height: 140,                 // 🔹 todas las imágenes misma altura
            width: 150,
          }}
        >
          {imagen ? (
            <Box
              component="img"
              alt={descripcion}
              src={imagen}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="overline" color="text.secondary">
                SIN IMAGEN
              </Typography>
            </Box>
          )}

          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <Chip
              size="small"
              label={low ? 'Bajo stock' : 'En stock'}
              color={low ? 'warning' : 'success'}
            />
          </Box>
        </Box>

        {/* Texto */}
        <Box
          sx={{
            p: 1.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ whiteSpace: 'pre-line' }}   // respeta el "\n"
            title={descripcion}
          >
            {descFormateada}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
          >
            {id}
          </Typography>

          <Box
            sx={{
              mt: 0.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="body2">
              Q {precio.toFixed(2)}
            </Typography>
            {!esServicio && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Stock: {cantidad}
              </Typography>
            )}
            {esServicio && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                Stock: N/A
              </Typography>
            )}
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
}
