import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ArrowBack, ExpandMore, Tune } from '@mui/icons-material';
import { getPersonasFisicas, getPersonasJuridicas } from '../services/personasService';
import { getAllPropiedades, type PropiedadUnificada } from '../services/propiedadesService';
import { createContrato, type EstadoContrato, type TipoMoneda, type IndiceAjuste, type ContratoDTO } from '../services/contratosService';

interface PersonaOption {
  id: number;
  nombre: string;
  tipo: string;
}

export default function NuevoContratoPage() {
  const navigate = useNavigate();

  // Feedback Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Autocomplete collections
  const [propiedades, setPropiedades] = useState<PropiedadUnificada[]>([]);
  const [propietarios, setPropietarios] = useState<PersonaOption[]>([]);
  const [inquilinos, setInquilinos] = useState<PersonaOption[]>([]);
  const [todosGarantes, setTodosGarantes] = useState<PersonaOption[]>([]);

  // Selection states
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<PropiedadUnificada | null>(null);
  const [propietariosSeleccionados, setPropietariosSeleccionados] = useState<PersonaOption[]>([]);
  const [inquilinosSeleccionados, setInquilinosSeleccionados] = useState<PersonaOption[]>([]);
  const [garantesSeleccionados, setGarantesSeleccionados] = useState<PersonaOption[]>([]);

  // Required form fields
  const [contratoNumero, setContratoNumero] = useState('');
  const [fechaFirma, setFechaFirma] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [contratoEstado, setContratoEstado] = useState<EstadoContrato>('BORRADOR');
  const [montoBase, setMontoBase] = useState<string>('');
  const [tipoMoneda, setTipoMoneda] = useState<TipoMoneda>('ARS');

  // Optional/Advanced form fields
  const [diaVencimientoPago, setDiaVencimientoPago] = useState<string>('');
  const [porcentajeComision, setPorcentajeComision] = useState<string>('');
  const [montoDeposito, setMontoDeposito] = useState<string>('');
  const [monedaDeposito, setMonedaDeposito] = useState<TipoMoneda | ''>('');
  const [observacionesGarantia, setObservacionesGarantia] = useState('');
  const [indiceAjuste, setIndiceAjuste] = useState<IndiceAjuste | ''>('');
  const [frecuenciaAjuste, setFrecuenciaAjuste] = useState<string>('');
  const [mesProximoAjuste, setMesProximoAjuste] = useState('');
  const [aplicaProdCarne, setAplicaProdCarne] = useState(false);
  const [cantidadCarne, setCantidadCarne] = useState<string>('');

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Load properties
        const propList = await getAllPropiedades();
        setPropiedades(propList);

        // Load owners
        const [propFisicas, propJuridicas] = await Promise.all([
          getPersonasFisicas('propietario'),
          getPersonasJuridicas('propietario'),
        ]);
        const mappedProp = [
          ...propFisicas.map((p) => ({ id: Number(p.id), nombre: `${p.primerNombre} ${p.primerApellido}`, tipo: 'Física' })),
          ...propJuridicas.map((p) => ({ id: Number(p.id), nombre: p.razonSocial, tipo: 'Jurídica' })),
        ];
        setPropietarios(mappedProp);

        // Load tenants
        const [inqFisicas, inqJuridicas] = await Promise.all([
          getPersonasFisicas('inquilino'),
          getPersonasJuridicas('inquilino'),
        ]);
        const mappedInq = [
          ...inqFisicas.map((p) => ({ id: Number(p.id), nombre: `${p.primerNombre} ${p.primerApellido}`, tipo: 'Física' })),
          ...inqJuridicas.map((p) => ({ id: Number(p.id), nombre: p.razonSocial, tipo: 'Jurídica' })),
        ];
        setInquilinos(mappedInq);

        // Load all personas for guarantors
        const [allFisicas, allJuridicas] = await Promise.all([
          getPersonasFisicas(),
          getPersonasJuridicas(),
        ]);
        const mappedAll = [
          ...allFisicas.map((p) => ({ id: Number(p.id), nombre: `${p.primerNombre} ${p.primerApellido}`, tipo: 'Física' })),
          ...allJuridicas.map((p) => ({ id: Number(p.id), nombre: p.razonSocial, tipo: 'Jurídica' })),
        ];
        setTodosGarantes(mappedAll);
      } catch (err) {
        console.error('Error al cargar datos del formulario de contratos:', err);
        setSnackbar({ open: true, message: 'Error al inicializar datos del formulario', severity: 'error' });
      }
    };

    loadDropdownData();
  }, []);

  // Sync owners when property is selected
  useEffect(() => {
    if (propiedadSeleccionada && propiedadSeleccionada.dueniosIds && propiedadSeleccionada.dueniosIds.length > 0) {
      const autoSelected = propietarios.filter((p) => propiedadSeleccionada.dueniosIds?.includes(p.id));
      setPropietariosSeleccionados(autoSelected);
    }
  }, [propiedadSeleccionada, propietarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !contratoNumero ||
      !fechaFirma ||
      !fechaInicio ||
      !fechaFinal ||
      !contratoEstado ||
      !montoBase ||
      !tipoMoneda ||
      !propiedadSeleccionada
    ) {
      setSnackbar({ open: true, message: 'Por favor complete todos los campos obligatorios', severity: 'error' });
      return;
    }

    if (propietariosSeleccionados.length === 0 || inquilinosSeleccionados.length === 0) {
      setSnackbar({ open: true, message: 'Debe seleccionar al menos un Propietario y un Inquilino', severity: 'error' });
      return;
    }

    const contratoDTO: ContratoDTO = {
      contratoNumero,
      fechaFirma,
      fechaInicio,
      fechaFinal,
      contratoEstado,
      montoBase: parseFloat(montoBase),
      tipoMoneda,
      propiedadAlquiladaId: propiedadSeleccionada.id!,
      propietariosIds: propietariosSeleccionados.map((p) => p.id),
      inquilinosIds: inquilinosSeleccionados.map((i) => i.id),
      garantesIds: garantesSeleccionados.length > 0 ? garantesSeleccionados.map((g) => g.id) : undefined,
      diaVencimientoPago: diaVencimientoPago ? parseInt(diaVencimientoPago) : undefined,
      porcentajeComision: porcentajeComision ? parseFloat(porcentajeComision) : undefined,
      montoDeposito: montoDeposito ? parseFloat(montoDeposito) : undefined,
      monedaDeposito: monedaDeposito || undefined,
      observacionesGarantia: observacionesGarantia || undefined,
      indiceAjuste: indiceAjuste || undefined,
      frecuenciaAjuste: frecuenciaAjuste ? parseInt(frecuenciaAjuste) : undefined,
      mesProximoAjuste: mesProximoAjuste || undefined,
      aplicaProdCarne,
      cantidadCarne: cantidadCarne ? parseFloat(cantidadCarne) : undefined,
    };

    try {
      await createContrato(contratoDTO);
      setSnackbar({ open: true, message: 'Contrato creado exitosamente', severity: 'success' });
      setTimeout(() => navigate('/contratos'), 1500);
    } catch (err: any) {
      console.error('Error al guardar el contrato:', err);
      setSnackbar({ open: true, message: 'Error al registrar el contrato en el servidor.', severity: 'error' });
    }
  };

  const getPropLabel = (prop: PropiedadUnificada): string => {
    const calle = prop.direccion ? prop.direccion.calleRuta : 'Sin calle';
    const altura = prop.direccion && prop.direccion.alturaKm ? ` ${prop.direccion.alturaKm}` : '';
    const loc = prop.direccion ? `, ${prop.direccion.localidad}` : '';
    const tipoLabel = prop.tipoProp.charAt(0).toUpperCase() + prop.tipoProp.slice(1);
    return `[${tipoLabel}] Ref: ${prop.codigoRef} - ${calle}${altura}${loc}`;
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/contratos')}
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
        >
          Contratos
        </Link>
        <Typography color="text.primary">Nuevo Contrato</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/contratos')}
          variant="outlined"
          aria-label="Volver a lista de contratos"
        >
          Volver
        </Button>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
          Nuevo Contrato
        </Typography>
      </Box>

      <Card sx={{ maxWidth: 800 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Contrato Numero */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Número de Contrato"
                  value={contratoNumero}
                  onChange={(e) => setContratoNumero(e.target.value)}
                  required
                />
              </Grid>

              {/* Estado de Contrato */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Estado del Contrato"
                  value={contratoEstado}
                  onChange={(e) => setContratoEstado(e.target.value as EstadoContrato)}
                  required
                >
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="VIGENTE">Vigente</MenuItem>
                  <MenuItem value="FINALIZADO">Finalizado</MenuItem>
                  <MenuItem value="EN_MORA">En Mora</MenuItem>
                </TextField>
              </Grid>

              {/* Fechas */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Firma"
                  value={fechaFirma}
                  onChange={(e) => setFechaFirma(e.target.value)}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Inicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Finalización"
                  value={fechaFinal}
                  onChange={(e) => setFechaFinal(e.target.value)}
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Alquiler Pricing */}
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monto Base de Alquiler"
                  value={montoBase}
                  onChange={(e) => setMontoBase(e.target.value)}
                  required
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  fullWidth
                  label="Moneda"
                  value={tipoMoneda}
                  onChange={(e) => setTipoMoneda(e.target.value as TipoMoneda)}
                  required
                >
                  <MenuItem value="ARS">ARS ($)</MenuItem>
                  <MenuItem value="USD">USD (US$)</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
              </Grid>

              {/* Propiedad Alquilada */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Propiedad Alquilada
                </Typography>
                <Autocomplete
                  options={propiedades}
                  getOptionLabel={getPropLabel}
                  value={propiedadSeleccionada}
                  onChange={(_, newValue) => setPropiedadSeleccionada(newValue)}
                  renderInput={(params) => <TextField {...params} label="Seleccionar Propiedad" required />}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Typography variant="body2">{getPropLabel(option)}</Typography>
                    </li>
                  )}
                />
              </Grid>

              {/* Propietarios */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Propietarios
                </Typography>
                <Autocomplete
                  multiple
                  options={propietarios}
                  getOptionLabel={(option) => `${option.nombre} (${option.tipo})`}
                  value={propietariosSeleccionados}
                  onChange={(_, newValue) => setPropietariosSeleccionados(newValue)}
                  renderInput={(params) => <TextField {...params} label="Propietarios del Contrato" required />}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tipo: {option.tipo}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* Inquilinos */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Inquilinos
                </Typography>
                <Autocomplete
                  multiple
                  options={inquilinos}
                  getOptionLabel={(option) => `${option.nombre} (${option.tipo})`}
                  value={inquilinosSeleccionados}
                  onChange={(_, newValue) => setInquilinosSeleccionados(newValue)}
                  renderInput={(params) => <TextField {...params} label="Inquilinos del Contrato" required />}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Tipo: {option.tipo}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>

              {/* Garantes */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Garantes
                </Typography>
                <Autocomplete
                  multiple
                  options={todosGarantes}
                  getOptionLabel={(option) => `${option.nombre} (${option.tipo})`}
                  value={garantesSeleccionados}
                  onChange={(_, newValue) => setGarantesSeleccionados(newValue)}
                  renderInput={(params) => <TextField {...params} label="Garantes (Opcional)" />}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      <Box>
                        <Typography variant="body2">{option.nombre}</Typography>
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

              {/* Advanced settings in Accordion */}
              <Grid size={{ xs: 12 }}>
                <Accordion sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <AccordionSummary expandIcon={<ExpandMore />} aria-controls="advanced-settings-content">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tune color="primary" />
                      <Typography sx={{ fontWeight: 600 }}>Parámetros Avanzados y Garantías</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {/* Pagos y Depósitos */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Pagos y Depósitos
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Día de Vencimiento de Pago"
                          value={diaVencimientoPago}
                          onChange={(e) => setDiaVencimientoPago(e.target.value)}
                          slotProps={{ htmlInput: { min: 1, max: 31 } }}
                          placeholder="e.g. 5 o 10"
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Porcentaje de Comisión (%)"
                          value={porcentajeComision}
                          onChange={(e) => setPorcentajeComision(e.target.value)}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 8 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Monto Depósito de Garantía"
                          value={montoDeposito}
                          onChange={(e) => setMontoDeposito(e.target.value)}
                          slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          select
                          fullWidth
                          label="Moneda Depósito"
                          value={monedaDeposito}
                          onChange={(e) => setMonedaDeposito(e.target.value as TipoMoneda)}
                        >
                          <MenuItem value="">Ninguna</MenuItem>
                          <MenuItem value="ARS">ARS ($)</MenuItem>
                          <MenuItem value="USD">USD (US$)</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          label="Observaciones de la Garantía"
                          multiline
                          rows={3}
                          value={observacionesGarantia}
                          onChange={(e) => setObservacionesGarantia(e.target.value)}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Divider />
                      </Grid>

                      {/* Ajustes del Contrato */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Cláusulas de Ajuste
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
                          label="Índice de Ajuste"
                          value={indiceAjuste}
                          onChange={(e) => setIndiceAjuste(e.target.value as IndiceAjuste)}
                        >
                          <MenuItem value="">Ninguno</MenuItem>
                          <MenuItem value="ICL">ICL (Índice Contrato Locación)</MenuItem>
                          <MenuItem value="IPC">IPC (Consumidor)</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Frecuencia de Ajuste (Meses)"
                          value={frecuenciaAjuste}
                          onChange={(e) => setFrecuenciaAjuste(e.target.value)}
                          slotProps={{ htmlInput: { min: 1 } }}
                          placeholder="e.g. 3, 4 o 6"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Mes Próximo Ajuste"
                          value={mesProximoAjuste}
                          onChange={(e) => setMesProximoAjuste(e.target.value)}
                          slotProps={{ inputLabel: { shrink: true } }}
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Divider />
                      </Grid>

                      {/* Rendimiento Agrícola / Carne */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          Pago en Especie (Carne)
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Checkbox checked={aplicaProdCarne} onChange={(e) => setAplicaProdCarne(e.target.checked)} />
                          }
                          label="Aplica Pago con Producto Carne"
                        />
                      </Grid>

                      {aplicaProdCarne && (
                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Cantidad de Carne (Kg)"
                            value={cantidadCarne}
                            onChange={(e) => setCantidadCarne(e.target.value)}
                            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                            placeholder="e.g. 150"
                          />
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Submit Buttons */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="outlined" onClick={() => navigate('/contratos')} size="large">
                    Cancelar
                  </Button>
                  <Button type="submit" variant="contained" color="primary" size="large">
                    Guardar Contrato
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
