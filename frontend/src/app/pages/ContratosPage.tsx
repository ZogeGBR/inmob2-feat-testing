import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search, Add, Edit, Delete, Description, CalendarToday, AttachMoney, Business } from '@mui/icons-material';
import { getContratos, deleteContrato, type ContratoDTO, type EstadoContrato } from '../services/contratosService';
import { getAllPropiedades, type PropiedadUnificada } from '../services/propiedadesService';

export default function ContratosPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [contratos, setContratos] = useState<ContratoDTO[]>([]);
  const [propiedades, setPropiedades] = useState<PropiedadUnificada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [contratosData, propiedadesData] = await Promise.all([
        getContratos(),
        getAllPropiedades(),
      ]);
      setContratos(contratosData);
      setPropiedades(propiedadesData);
    } catch (err: any) {
      console.error('Error al cargar datos de contratos:', err);
      setError('Ocurrió un error al obtener la lista de contratos. Por favor, reintente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getEstadoColor = (estado: EstadoContrato): 'default' | 'success' | 'info' | 'error' => {
    switch (estado) {
      case 'BORRADOR':
        return 'default';
      case 'VIGENTE':
        return 'success';
      case 'FINALIZADO':
        return 'info';
      case 'EN_MORA':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPropiedadText = (propId: number): string => {
    const prop = propiedades.find((p) => p.id === propId);
    if (!prop) return `Propiedad ID: ${propId}`;
    const calle = prop.direccion ? prop.direccion.calleRuta : 'Sin calle';
    const altura = prop.direccion && prop.direccion.alturaKm ? ` ${prop.direccion.alturaKm}` : '';
    return `${prop.codigoRef} - ${calle}${altura}, ${prop.direccion?.localidad}`;
  };

  const handleDeleteClick = (id?: number) => {
    if (!id) return;
    setSelectedId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedId) return;
    try {
      setDeleting(true);
      await deleteContrato(selectedId);
      setSnackbar({ open: true, message: 'Contrato eliminado exitosamente', severity: 'success' });
      await loadData();
    } catch (err) {
      console.error('Error al eliminar contrato:', err);
      setSnackbar({ open: true, message: 'Error al eliminar el contrato', severity: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedId(null);
    }
  };

  const filteredContratos = contratos.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    const propText = getPropiedadText(c.propiedadAlquiladaId).toLowerCase();
    return (
      c.contratoNumero.toLowerCase().includes(searchLower) ||
      c.contratoEstado.toLowerCase().includes(searchLower) ||
      propText.includes(searchLower)
    );
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
        Contratos
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar contratos por número, propiedad..."
          variant="outlined"
          size="medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 400, bgcolor: 'background.paper' }}
          inputProps={{
            'aria-label': 'Buscar contratos',
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/contratos/nuevo')}
          sx={{ height: 56 }}
        >
          Nuevo Contrato
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText', mb: 3 }}>
          <CardContent>
            <Typography variant="body1" align="center">
              {error}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="outlined" color="inherit" onClick={loadData}>
                Reintentar
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : filteredContratos.length === 0 ? (
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {searchTerm ? 'No se encontraron contratos' : 'No hay contratos registrados'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredContratos.map((c) => (
            <Card
              key={c.id}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Description sx={{ fontSize: 32, color: 'text.secondary' }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    Contrato Nro: {c.contratoNumero}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={c.contratoEstado}
                      size="small"
                      color={getEstadoColor(c.contratoEstado)}
                    />
                    <Chip
                      label={c.tipoMoneda}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  flex: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  my: { xs: 2, sm: 0 },
                  px: { xs: 1, sm: 2 },
                  borderLeft: { sm: '1px solid' },
                  borderRight: { sm: '1px solid' },
                  borderColor: { sm: 'divider' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
                    {getPropiedadText(c.propiedadAlquiladaId)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarToday sx={{ fontSize: 20, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Vigencia: {c.fechaInicio} al {c.fechaFinal}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney sx={{ fontSize: 20, color: 'success.main' }} />
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                    Monto Base: $ {c.montoBase.toLocaleString('es-AR')} {c.tipoMoneda}
                  </Typography>
                </Box>
              </Box>

              <CardActions sx={{ gap: 1, pl: { xs: 1, sm: 2 }, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/contratos/${c.id}/editar`)}
                  startIcon={<Edit />}
                  aria-label={`Editar contrato ${c.contratoNumero}`}
                >
                  Ver/Editar
                </Button>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteClick(c.id)}
                  aria-label={`Eliminar contrato ${c.contratoNumero}`}
                >
                  <Delete />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Delete confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            ¿Está seguro que desea eliminar este contrato? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting} autoFocus>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
