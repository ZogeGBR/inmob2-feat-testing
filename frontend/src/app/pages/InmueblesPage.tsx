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
  Chip,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import { Search, Add, Home, Delete, Edit } from '@mui/icons-material';
import {
  getAllPropiedades,
  deleteCasa,
  deleteDepartamento,
  deleteTerreno,
  type PropiedadUnificada,
  type EstadoPropiedad,
  type DireccionPropiedadDTO,
} from '../services/propiedadesService';

export default function InmueblesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [propiedades, setPropiedades] = useState<PropiedadUnificada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<'todos' | 'casa' | 'departamento' | 'terreno'>('todos');

  // Deletion dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<PropiedadUnificada | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Feedback Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadPropiedades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPropiedades();
      setPropiedades(data);
    } catch (err: any) {
      console.error('Error al obtener propiedades:', err);
      setError('Ocurrió un error al cargar los inmuebles. Por favor, reintente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPropiedades();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: any) => {
    setTabValue(newValue);
  };

  const getEstadoColor = (estado: EstadoPropiedad): 'success' | 'warning' | 'info' | 'default' => {
    switch (estado) {
      case 'disponible':
        return 'success';
      case 'alquilado':
        return 'warning';
      case 'reservado':
        return 'info';
      case 'fuera_de_servicio':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEstadoLabel = (estado: EstadoPropiedad): string => {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'alquilado':
        return 'Alquilado';
      case 'reservado':
        return 'Reservado';
      case 'fuera_de_servicio':
        return 'Fuera de Servicio';
      default:
        return estado;
    }
  };

  const formatDireccion = (dir?: DireccionPropiedadDTO) => {
    if (!dir) return 'Sin dirección registrada';
    const parts = [dir.calleRuta];
    if (dir.alturaKm) parts.push(dir.alturaKm);
    return `${parts.join(' ')}, ${dir.localidad}, ${dir.provincia}`;
  };

  const getTipoLabel = (tipoProp: 'casa' | 'departamento' | 'terreno'): string => {
    switch (tipoProp) {
      case 'casa':
        return 'Casa';
      case 'departamento':
        return 'Departamento';
      case 'terreno':
        return 'Terreno';
      default:
        return tipoProp;
    }
  };

  // Filtration
  const filteredPropiedades = propiedades.filter((inm) => {
    // 1. Filter by Tab
    if (tabValue !== 'todos' && inm.tipoProp !== tabValue) {
      return false;
    }

    // 2. Filter by Search Term
    const searchLower = searchTerm.toLowerCase();
    const refMatch = inm.codigoRef.toLowerCase().includes(searchLower);
    const addressMatch = inm.direccion
      ? (inm.direccion.calleRuta.toLowerCase().includes(searchLower) ||
         inm.direccion.localidad.toLowerCase().includes(searchLower) ||
         inm.direccion.provincia.toLowerCase().includes(searchLower))
      : false;
    const catMatch = inm.codigoCatastral ? inm.codigoCatastral.toLowerCase().includes(searchLower) : false;

    return refMatch || addressMatch || catMatch;
  });

  const openDeleteConfirmation = (inm: PropiedadUnificada) => {
    setPropertyToDelete(inm);
    setDeleteDialogOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setPropertyToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!propertyToDelete || !propertyToDelete.id) return;
    try {
      setDeleting(true);
      if (propertyToDelete.tipoProp === 'casa') {
        await deleteCasa(propertyToDelete.id);
      } else if (propertyToDelete.tipoProp === 'departamento') {
        await deleteDepartamento(propertyToDelete.id);
      } else if (propertyToDelete.tipoProp === 'terreno') {
        await deleteTerreno(propertyToDelete.id);
      }

      setSnackbar({ open: true, message: 'Inmueble eliminado con éxito', severity: 'success' });
      // Reload list
      await loadPropiedades();
    } catch (err: any) {
      console.error('Error al eliminar propiedad:', err);
      setSnackbar({ open: true, message: 'No se pudo eliminar el inmueble', severity: 'error' });
    } finally {
      setDeleting(false);
      closeDeleteConfirmation();
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, color: 'text.primary' }}>
        Inmuebles
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Buscar por ref, dirección, localidad..."
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
            'aria-label': 'Buscar inmuebles',
          }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => navigate('/inmuebles/nuevo')}
          sx={{ height: 56 }}
        >
          Nuevo Inmueble
        </Button>
      </Box>

      {/* Tabs for filtration */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Todos" value="todos" />
        <Tab label="Casas" value="casa" />
        <Tab label="Departamentos" value="departamento" />
        <Tab label="Terrenos" value="terreno" />
      </Tabs>

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
              <Button variant="outlined" color="inherit" onClick={loadPropiedades}>
                Reintentar
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : filteredPropiedades.length === 0 ? (
        <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              {searchTerm ? 'No se encontraron inmuebles que coincidan con la búsqueda' : 'No hay inmuebles registrados en esta categoría'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredPropiedades.map((inm) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${inm.tipoProp}-${inm.id}`}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 140,
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Home sx={{ fontSize: 60, color: 'text.secondary' }} />
                </Box>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={getEstadoLabel(inm.estado)}
                      size="small"
                      color={getEstadoColor(inm.estado)}
                    />
                    <Chip
                      label={getTipoLabel(inm.tipoProp)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`Ref: ${inm.codigoRef}`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                    />
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {formatDireccion(inm.direccion)}
                  </Typography>
                  {inm.codigoCatastral && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      Cod. Catastral: {inm.codigoCatastral}
                    </Typography>
                  )}
                  {inm.superficieTotal !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Superficie: {inm.superficieTotal} m²
                      {inm.superficieCubierta !== undefined && ` (Cubierta: ${inm.superficieCubierta} m²)`}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/inmuebles/${inm.tipoProp}/${inm.id}/editar`)}
                    sx={{ flexGrow: 1 }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => openDeleteConfirmation(inm)}
                  >
                    Eliminar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteConfirmation}>
        <DialogTitle>¿Confirmar eliminación?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el inmueble con referencia{' '}
            <strong>{propertyToDelete?.codigoRef}</strong> en{' '}
            <strong>{propertyToDelete?.direccion?.calleRuta}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirmation} disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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