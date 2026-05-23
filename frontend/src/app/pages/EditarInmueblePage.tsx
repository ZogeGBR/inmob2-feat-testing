import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  Breadcrumbs,
  Link,
  Autocomplete,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import {
  getPersonasFisicas,
  getPersonasJuridicas,
} from '../services/personasService';
import {
  getCasaById,
  getDepartamentoById,
  getTerrenoById,
  updateCasa,
  updateDepartamento,
  updateTerreno,
  type EstadoPropiedad,
  type Disposicion,
  type Perimetro,
  type Amenity,
  type CasaDTO,
  type DepartamentoDTO,
  type TerrenoDTO,
} from '../services/propiedadesService';

export default function EditarInmueblePage() {
  const navigate = useNavigate();
  const { tipo, id } = useParams<{ tipo: string; id: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feedback Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Owners list
  const [personas, setPersonas] = useState<{ id: number; nombre: string; tipo: string }[]>([]);
  const [dueniosSeleccionados, setDueniosSeleccionados] = useState<{ id: number; nombre: string; tipo: string }[]>([]);

  // Dirección fields
  const [calleRuta, setCalleRuta] = useState('');
  const [alturaKm, setAlturaKm] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');

  // Datos básicos fields
  const [codigoRef, setCodigoRef] = useState('');
  const [codigoCatastral, setCodigoCatastral] = useState('');
  const [estado, setEstado] = useState<EstadoPropiedad>('disponible');
  const [superficieTotal, setSuperficieTotal] = useState<string>('');
  const [superficieCubierta, setSuperficieCubierta] = useState<string>('');

  // Unidad Habitacional fields (Casa / Departamento)
  const [ambientesNum, setAmbientesNum] = useState<string>('');
  const [dormitoriosNum, setDormitoriosNum] = useState<string>('');
  const [baniosNum, setBaniosNum] = useState<string>('');
  const [mascotas, setMascotas] = useState(false);
  const [aptoProfesional, setAptoProfesional] = useState(false);
  const [anioConstruccion, setAnioConstruccion] = useState<string>('');

  // Casa specific fields
  const [plantasNum, setPlantasNum] = useState<string>('');
  const [jardin, setJardin] = useState(false);
  const [cochera, setCochera] = useState(false);
  const [barrioCerrado, setBarrioCerrado] = useState(false);

  // Departamento specific fields
  const [piso, setPiso] = useState('');
  const [letraNumero, setLetraNumero] = useState('');
  const [expensasMonto, setExpensasMonto] = useState<string>('');
  const [disposicion, setDisposicion] = useState<Disposicion | ''>('');
  const [selectedAmenities, setSelectedAmenities] = useState<Amenity[]>([]);

  // Terreno specific fields
  const [aplicaRendimiento, setAplicaRendimiento] = useState(false);
  const [superficieProduccion, setSuperficieProduccion] = useState<string>('');
  const [perimetro, setPerimetro] = useState<Perimetro | ''>('');

  const provinciasArgentinas = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
    'Tierra del Fuego', 'Tucumán',
  ];

  const amenitiesOptions: { value: Amenity; label: string }[] = [
    { value: 'PILETA', label: 'Pileta' },
    { value: 'GYM', label: 'Gimnasio' },
    { value: 'SUM', label: 'S.U.M.' },
    { value: 'PARRILLA', label: 'Parrilla' },
    { value: 'SEGURIDAD_24H', label: 'Seguridad 24h' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !tipo) return;
      try {
        setLoading(true);
        setError(null);

        // Load all personas for autocomplete selection
        const [fisicas, juridicas] = await Promise.all([
          getPersonasFisicas(),
          getPersonasJuridicas(),
        ]);

        const mappedFisicas = fisicas.map((p) => ({
          id: Number(p.id),
          nombre: `${p.primerNombre} ${p.primerApellido}`,
          tipo: 'Física',
        }));

        const mappedJuridicas = juridicas.map((p) => ({
          id: Number(p.id),
          nombre: p.razonSocial,
          tipo: 'Jurídica',
        }));

        const allOwners = [...mappedFisicas, ...mappedJuridicas];
        setPersonas(allOwners);

        // Fetch property details based on type
        let propData: any = null;
        if (tipo === 'casa') {
          propData = await getCasaById(id);
        } else if (tipo === 'departamento') {
          propData = await getDepartamentoById(id);
        } else if (tipo === 'terreno') {
          propData = await getTerrenoById(id);
        } else {
          throw new Error('Tipo de propiedad inválido');
        }

        // Fill form fields
        if (propData) {
          setCodigoRef(propData.codigoRef || '');
          setCodigoCatastral(propData.codigoCatastral || '');
          setEstado(propData.estado || 'disponible');
          setSuperficieTotal(propData.superficieTotal ? String(propData.superficieTotal) : '');
          setSuperficieCubierta(propData.superficieCubierta ? String(propData.superficieCubierta) : '');

          if (propData.direccion) {
            setCalleRuta(propData.direccion.calleRuta || '');
            setAlturaKm(propData.direccion.alturaKm || '');
            setLocalidad(propData.direccion.localidad || '');
            setProvincia(propData.direccion.provincia || '');
            setCodigoPostal(propData.direccion.codigoPostal || '');
          }

          if (propData.dueniosIds && propData.dueniosIds.length > 0) {
            const preselected = allOwners.filter((o) => propData.dueniosIds.includes(o.id));
            setDueniosSeleccionados(preselected);
          }

          // Fields for Unidad Habitacional
          if (tipo === 'casa' || tipo === 'departamento') {
            setAmbientesNum(propData.ambientesNum ? String(propData.ambientesNum) : '');
            setDormitoriosNum(propData.dormitoriosNum ? String(propData.dormitoriosNum) : '');
            setBaniosNum(propData.baniosNum ? String(propData.baniosNum) : '');
            setMascotas(!!propData.mascotas);
            setAptoProfesional(!!propData.aptoProfesional);
            setAnioConstruccion(propData.anioConstruccion ? String(propData.anioConstruccion) : '');
          }

          // Specifics
          if (tipo === 'casa') {
            setPlantasNum(propData.plantasNum ? String(propData.plantasNum) : '');
            setJardin(!!propData.jardin);
            setCochera(!!propData.cochera);
            setBarrioCerrado(!!propData.barrioCerrado);
          } else if (tipo === 'departamento') {
            setPiso(propData.piso || '');
            setLetraNumero(propData.letraNumero || '');
            setExpensasMonto(propData.expensasMonto ? String(propData.expensasMonto) : '');
            setDisposicion(propData.disposicion || '');
            setSelectedAmenities(propData.amenities || []);
          } else if (tipo === 'terreno') {
            setAplicaRendimiento(!!propData.aplicaRendimiento);
            setSuperficieProduccion(propData.superficieProduccion ? String(propData.superficieProduccion) : '');
            setPerimetro(propData.perimetro || '');
          }
        }
      } catch (err: any) {
        console.error('Error al cargar datos del inmueble:', err);
        setError('No se pudo cargar el inmueble seleccionado.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tipo, id]);

  const handleAmenityChange = (amenity: Amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!calleRuta || !localidad || !provincia || !codigoRef || !estado || !id) {
      setSnackbar({ open: true, message: 'Por favor complete todos los campos obligatorios', severity: 'error' });
      return;
    }

    const baseDTO = {
      id: Number(id),
      codigoRef,
      codigoCatastral: codigoCatastral || undefined,
      estado,
      superficieTotal: superficieTotal ? parseFloat(superficieTotal) : undefined,
      superficieCubierta: superficieCubierta ? parseFloat(superficieCubierta) : undefined,
      direccion: {
        calleRuta,
        alturaKm: alturaKm || undefined,
        localidad,
        provincia,
        codigoPostal: codigoPostal || undefined,
      },
      dueniosIds: dueniosSeleccionados.map((d) => d.id),
    };

    try {
      if (tipo === 'casa') {
        const casaDTO: CasaDTO = {
          ...baseDTO,
          ambientesNum: ambientesNum ? parseInt(ambientesNum) : undefined,
          dormitoriosNum: dormitoriosNum ? parseInt(dormitoriosNum) : undefined,
          baniosNum: baniosNum ? parseInt(baniosNum) : undefined,
          mascotas,
          aptoProfesional,
          anioConstruccion: anioConstruccion ? parseInt(anioConstruccion) : undefined,
          plantasNum: plantasNum ? parseInt(plantasNum) : undefined,
          jardin,
          cochera,
          barrioCerrado,
        };
        await updateCasa(id, casaDTO);
      } else if (tipo === 'departamento') {
        const deptoDTO: DepartamentoDTO = {
          ...baseDTO,
          ambientesNum: ambientesNum ? parseInt(ambientesNum) : undefined,
          dormitoriosNum: dormitoriosNum ? parseInt(dormitoriosNum) : undefined,
          baniosNum: baniosNum ? parseInt(baniosNum) : undefined,
          mascotas,
          aptoProfesional,
          anioConstruccion: anioConstruccion ? parseInt(anioConstruccion) : undefined,
          piso: piso || undefined,
          letraNumero: letraNumero || undefined,
          expensasMonto: expensasMonto ? parseFloat(expensasMonto) : undefined,
          disposicion: disposicion || undefined,
          amenities: selectedAmenities,
        };
        await updateDepartamento(id, deptoDTO);
      } else if (tipo === 'terreno') {
        const terrenoDTO: TerrenoDTO = {
          ...baseDTO,
          aplicaRendimiento,
          superficieProduccion: superficieProduccion ? parseFloat(superficieProduccion) : undefined,
          perimetro: perimetro || undefined,
        };
        await updateTerreno(id, terrenoDTO);
      }

      setSnackbar({ open: true, message: 'Inmueble actualizado exitosamente', severity: 'success' });
      setTimeout(() => navigate('/inmuebles'), 1500);
    } catch (err: any) {
      console.error('Error al actualizar inmueble:', err);
      setSnackbar({ open: true, message: 'Ocurrió un error al guardar los cambios.', severity: 'error' });
    }
  };

  const getTipoLabel = (tipoString?: string): string => {
    if (tipoString === 'casa') return 'Casa';
    if (tipoString === 'departamento') return 'Departamento';
    if (tipoString === 'terreno') return 'Terreno';
    return tipoString || '';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText', m: 4 }}>
        <CardContent>
          <Typography variant="h6" align="center">
            {error}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button variant="outlined" color="inherit" onClick={() => navigate('/inmuebles')}>
              Volver a Inmuebles
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/inmuebles')}
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
        >
          Inmuebles
        </Link>
        <Typography color="text.primary">Editar Inmueble</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inmuebles')}
          variant="outlined"
          aria-label="Volver a lista de inmuebles"
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
          Editar Inmueble ({getTipoLabel(tipo)})
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Type selector (disabled since we are editing) */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Tipo de Inmueble"
                  value={getTipoLabel(tipo)}
                  disabled
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Owner selection */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Propietarios
                </Typography>
                <Autocomplete
                  multiple
                  options={personas}
                  getOptionLabel={(option) => `${option.nombre} (${option.tipo})`}
                  value={dueniosSeleccionados}
                  onChange={(_, newValue) => setDueniosSeleccionados(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Seleccionar dueños (opcional)" />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body1">{option.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tipo: {option.tipo}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Dirección Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Dirección
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Calle / Ruta"
                  value={calleRuta}
                  onChange={(e) => setCalleRuta(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Altura / Km"
                  value={alturaKm}
                  onChange={(e) => setAlturaKm(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Provincia"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  required
                >
                  {provinciasArgentinas.map((prov) => (
                    <MenuItem key={prov} value={prov}>
                      {prov}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Localidad"
                  value={localidad}
                  onChange={(e) => setLocalidad(e.target.value)}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Datos Básicos Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Datos Básicos
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Código Ref"
                  value={codigoRef}
                  onChange={(e) => setCodigoRef(e.target.value)}
                  required
                  slotProps={{ htmlInput: { maxLength: 50 } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Código Catastral"
                  value={codigoCatastral}
                  onChange={(e) => setCodigoCatastral(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoPropiedad)}
                  required
                >
                  <MenuItem value="disponible">Disponible</MenuItem>
                  <MenuItem value="alquilado">Alquilado</MenuItem>
                  <MenuItem value="reservado">Reservado</MenuItem>
                  <MenuItem value="fuera_de_servicio">Fuera de Servicio</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superficie Total (m²)"
                  value={superficieTotal}
                  onChange={(e) => setSuperficieTotal(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Superficie Cubierta (m²)"
                  value={superficieCubierta}
                  onChange={(e) => setSuperficieCubierta(e.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </Grid>

              {/* Specific sections */}
              {(tipo === 'casa' || tipo === 'departamento') && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                      Detalles Habitacionales
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Ambientes"
                      value={ambientesNum}
                      onChange={(e) => setAmbientesNum(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Dormitorios"
                      value={dormitoriosNum}
                      onChange={(e) => setDormitoriosNum(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Baños"
                      value={baniosNum}
                      onChange={(e) => setBaniosNum(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Año de Construcción"
                      value={anioConstruccion}
                      onChange={(e) => setAnioConstruccion(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormGroup row>
                      <FormControlLabel
                        control={<Checkbox checked={mascotas} onChange={(e) => setMascotas(e.target.checked)} />}
                        label="Acepta Mascotas"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={aptoProfesional} onChange={(e) => setAptoProfesional(e.target.checked)} />}
                        label="Apto Profesional"
                      />
                    </FormGroup>
                  </Grid>
                </>
              )}

              {/* Casa specific */}
              {tipo === 'casa' && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                      Detalles de la Casa
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad de Plantas"
                      value={plantasNum}
                      onChange={(e) => setPlantasNum(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormGroup row>
                      <FormControlLabel
                        control={<Checkbox checked={jardin} onChange={(e) => setJardin(e.target.checked)} />}
                        label="Jardín"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={cochera} onChange={(e) => setCochera(e.target.checked)} />}
                        label="Cochera"
                      />
                      <FormControlLabel
                        control={<Checkbox checked={barrioCerrado} onChange={(e) => setBarrioCerrado(e.target.checked)} />}
                        label="Barrio Cerrado"
                      />
                    </FormGroup>
                  </Grid>
                </>
              )}

              {/* Departamento specific */}
              {tipo === 'departamento' && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                      Detalles del Departamento
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Piso"
                      value={piso}
                      onChange={(e) => setPiso(e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 10 } }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      label="Letra / Número"
                      value={letraNumero}
                      onChange={(e) => setLetraNumero(e.target.value)}
                      slotProps={{ htmlInput: { maxLength: 10 } }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Monto Expensas (ARS)"
                      value={expensasMonto}
                      onChange={(e) => setExpensasMonto(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Disposición"
                      value={disposicion}
                      onChange={(e) => setDisposicion(e.target.value as Disposicion)}
                    >
                      <MenuItem value="">Ninguna</MenuItem>
                      <MenuItem value="FRENTE">Frente</MenuItem>
                      <MenuItem value="CONTRAFRENTE">Contrafrente</MenuItem>
                      <MenuItem value="LATERAL">Lateral</MenuItem>
                      <MenuItem value="INTERNO">Interno</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mt: 1 }}>
                      Amenities
                    </Typography>
                    <FormGroup row>
                      {amenitiesOptions.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          control={
                            <Checkbox
                              checked={selectedAmenities.includes(option.value)}
                              onChange={() => handleAmenityChange(option.value)}
                            />
                          }
                          label={option.label}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                </>
              )}

              {/* Terreno specific */}
              {tipo === 'terreno' && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1, fontWeight: 600 }}>
                      Detalles del Terreno
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Perímetro / Cierre"
                      value={perimetro}
                      onChange={(e) => setPerimetro(e.target.value as Perimetro)}
                    >
                      <MenuItem value="">Ninguno</MenuItem>
                      <MenuItem value="ALAMBRADO">Alambrado</MenuItem>
                      <MenuItem value="CERCADO">Cercado</MenuItem>
                      <MenuItem value="SIN_CIERRE">Sin Cierre</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={<Checkbox checked={aplicaRendimiento} onChange={(e) => setAplicaRendimiento(e.target.checked)} />}
                      label="Aplica Rendimiento Agrícola"
                    />
                  </Grid>

                  {aplicaRendimiento && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Superficie de Producción (m²)"
                        value={superficieProduccion}
                        onChange={(e) => setSuperficieProduccion(e.target.value)}
                      />
                    </Grid>
                  )}
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="outlined" onClick={() => navigate('/inmuebles')} size="large">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="contained" color="primary" size="large">
                    Guardar Cambios
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

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
