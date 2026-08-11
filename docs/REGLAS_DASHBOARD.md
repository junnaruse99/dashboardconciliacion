# Reglas Canónicas del Dashboard

Este documento es la fuente única de reglas funcionales y de datos del dashboard.

## 1. Uso obligatorio

- Antes de implementar cualquier cambio, revisar este documento completo.
- Si una solicitud nueva contradice una regla existente, no asumir: registrar la contradicción y confirmar con negocio.
- Si una regla no está aquí, agregarla en la sección 10 con fecha y contexto.

## 2. Alcance funcional

- El dashboard tiene cinco vistas: Overview, Alta, Cancelación, Renovación y Cobranza.
- La secuencia visual por proceso es obligatoria: filtros, KPIs, gráficos y tabla.
- En Renovación, Cancelación y Cobranza se debe separar visualmente:
  - Corte fijo del día/mes (no responde a filtros).
  - Resultado de filtros (sí responde a filtros).

## 3. Fuentes y relaciones

### 3.1 Fuentes principales

- T_PISD_INSURANCE_CONCILIATION.csv.
- T_PISD_INSR_CONCILIATION_MOV.csv.
- MAESTRA_CONTRATOS.csv.
- ICDTCAP.csv.
- ICDTCAM.csv.
- ICDTLIT.

### 3.2 Reglas de relación

- Conciliación y movimientos se relacionan solo por CONCILIATION_SEQUENTIAL_ID con cardinalidad 1:N.
- Alta no participa en el cruce de conciliaciones y movimientos.
- El identificador completo de contrato es:
  - entidad + oficina + dígito verificador 1 + dígito verificador 2 + cuenta interna.
- No usar póliza como clave de cruce técnico.

### 3.3 Reglas de calidad de fuentes

- Mantener un diccionario independiente por fuente en docs/fuentes.
- No inventar nombres físicos, tipos, longitudes o semánticas faltantes.
- Mantener compatibilidad con encabezados CSV Oracle documentados.

## 4. Catálogos y valores válidos

- Procesos válidos: CAN, REN, INV.
- Estados de conciliación válidos: PEN, SOL.
- Estados contractuales válidos: ANU, BAJ, ERR, FOR, PEN, INC.
- Códigos de error admitidos:
  - CAN_FILE_NOT_SENT
  - CAN_DUPLICATE_RESP
  - CAN_UNEXPECTED_ERR
  - CAN_CONCILIATION
  - PRE_NOTFOUND_ERR
  - PRE_AUT_NOTFOUND_ERR
  - REN_NOTFOUND_ERR
  - REN_AUT_NOTFOUND_ERR
  - INV_RIMAC_NOT_SENT
  - INV_RIMAC_NOT_CHAR

## 5. Reglas por proceso

### 5.1 Alta

- CREATION_DATE es fecha de alta/creación.
- INSURANCE_PRODUCT_ID es tipo de producto.
- CAP-ICFECTE es inicio del seguro (no fecha de alta).
- Mostrar modalidad CAP-ICCMOD01 y frecuencia CAP-ICTFOPAG.
- Mostrar prima CAP-ICIPRTOT y moneda CAP-ICDIVISA.
- El backlog PEN es histórico; los demás indicadores responden al rango.

### 5.2 Cancelación

- Para cancelados, usar CONTRACT_STATUS_ID del banco:
  - BAJ con CAP-ICFBAIXA.
  - ANU con CAP-ICFANCON.
- En detalle de Cancelación:
  - Póliza desde MAESTRA_CONTRATOS.
  - Producto desde MAESTRA_CONTRATOS.
  - Modalidad desde ICDTCAP CAP-ICCMOD01.
  - No usar POLICY_ID de conciliación.

### 5.3 Renovación

- CAP-ICFVENPO es fin de vigencia y fecha base operativa.
- CAP-ICFECTE se mantiene solo como inicio de cobertura.
- Mostrar lenguaje de negocio:
  - Confirmación de renovación.
  - Recibos enviados por RIMAC.
  - Fin de vigencia.
  - Días para regularizar.
- No mostrar al usuario etiquetas técnicas D-50, D-45, D0.
- Renovación efectiva:
  - CONTRACT_RENEWAL_STATUS_TYPE = REN.
- Clasificación de incidencias:
  - PRE_NOTFOUND_ERR y PRE_AUT_NOTFOUND_ERR: confirmación pendiente.
  - REN_NOTFOUND_ERR y REN_AUT_NOTFOUND_ERR: recibos pendientes.
- PEN significa información faltante abierta.
- SOL significa información recibida posteriormente.
- No equiparar SOL con archivo exitoso.
- No atribuir no renovación a decisión de RIMAC sin campo explícito de motivo/decisión.
- En detalle de Renovación:
  - Póliza y producto desde MAESTRA_CONTRATOS.
  - Modalidad desde CAP-ICCMOD01.
  - Mostrar días restantes hacia CAP-ICFVENPO.

### 5.4 Cobranza

- Importes se muestran solo en INV, con dos decimales.
- PAYMENT_AMOUNT y OPERATED_AMOUNT pertenecen a movimientos; agregarlos antes de mostrar a nivel conciliación.
- Recibos cobrados y métricas diarias/mensuales usan ICDTCAM ICFECOB.
- ICFECOB con valor 01-01-01 se interpreta como no cobrado.
- Para intentos:
  - Recibos esperados/intentados del día por ICFELIQ.
  - Intentos por ICNUMINT.
- Efectividad diaria:
  - (ICFELIQ de hoy con ICNUMINT > 0 e ICFECOB de hoy) / (ICFELIQ de hoy con ICNUMINT > 0).
- INV_RIMAC_NOT_SENT en PEN: cobro automático realizado no informado por RIMAC.
- INV_RIMAC_NOT_CHAR en PEN: no cobrado y no informado por RIMAC.
- En detalle de Cobranza:
  - Póliza y producto desde MAESTRA_CONTRATOS por entidad + oficina + cuenta interna.
  - Modalidad desde CAP-ICCMOD01.
  - No usar póliza de conciliación.

## 6. Filtros obligatorios

- Renovación, Cancelación y Cobranza deben tener:
  - Filtro por producto.
  - Filtro por frecuencia de pago.
- Frecuencias permitidas:
  - Mensual, Trimestral, Bimestral, Semestral, Anual.
- La frecuencia proviene de ICDTCAP CAP-ICTFOPAG.

## 7. Restricciones de datos y privacidad

- POLICY_ID es numérico y permite 1 a 10 dígitos.
- No mostrar ni exportar INSRC_CONTRACT_INT_ACCOUNT_ID.
- No deduplicar ICDTCAM por contrato; conservar granularidad por movimiento.
- Para ICDTCAP, ante duplicados:
  - Priorizar CAP-ICHTIULM más reciente.
  - Desempatar con CAP-ICFALMOV.

## 8. Reglas de presentación

- Corregir siempre tildes y caracteres especiales en textos visibles.
- Mantener terminología de negocio comprensible para Operaciones.
- Evitar conclusiones no demostrables con campos disponibles.

## 9. Checklist previo a entregar cambios

- Reglas de este documento revisadas.
- Fuentes y joins respetados.
- Métricas fijas y variables separadas donde corresponde.
- Filtros de producto y frecuencia presentes donde corresponde.
- Campos prohibidos no expuestos.
- npm run build ejecutado y exitoso.

## 10. Bitácora de reglas (agregar nuevas)

Usar este formato para cada nueva regla:

- Fecha:
- Solicitud de negocio:
- Regla acordada:
- Impacto (vistas/campos/métricas):
- Archivos actualizados:

### Entradas

- 2026-08-10
  - Solicitud de negocio: agregar en Alta un gráfico de altas por canal, un pie de top productos (top 3 + otros) y un pie de pendientes vs formalizadas, todo dependiente del filtro activo.
  - Regla acordada: en Alta, los gráficos de canal y distribución deben recalcularse al filtrar por producto/canal/frecuencia/estado/fechas; el pie de productos agrupa el resto en "Otros" y el pie de estado usa Pendientes vs Formalizadas.
  - Impacto: vista Alta (insights de distribución comercial y estado operativo).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: reforzar separación visual de filtros en Alta, mejorar subtítulos de bloques KPI, dejar gráfico ocupando todo el ancho y agregar columna de días pendientes RIMAC en tabla.
  - Regla acordada: en Alta dividir filtros por bloques de fecha y segmentación, usar títulos ejecutivos en métricas, mantener gráfico principal full-width y mostrar días transcurridos solo cuando el estado RIMAC sea PEN.
  - Impacto: vista Alta (UX de filtros, KPIs, gráfico y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: ajustar Dashboard de Alta con estados RIMAC válidos (BAJ, ERR, INC, FOR, PEN), separar métricas por dependencia de fecha, incluir filtro de canal y simplificar tabla.
  - Regla acordada: en Alta, las métricas fijas no dependen del rango de fechas pero sí del resto de filtros; las métricas variables sí dependen del rango. Se reemplazan gráficos por una línea de tiempo de altas por día y producto. En tabla, frecuencia sin código, sin fecha de inicio, y se agregan canal/subcanal.
  - Impacto: vista Alta (filtros, KPIs, gráfico y tabla) y enriquecimiento ICDTCAP para canal/subcanal.
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en todos los dashboards usar filtros de rango de fechas (inicio/fin), frecuencia de pago y producto; evaluar visualización por producto en Overview considerando más de 10 productos y crecimiento futuro.
  - Regla acordada: todos los tabs deben incluir filtros funcionales de fecha inicio/fin, producto y frecuencia (Mensual, Bimestral, Trimestral, Semestral, Anual); en Overview usar gráfico Top 10 productos y agrupar el resto en "Otros".
  - Impacto: Overview, Alta, Cancelación, Renovación y Cobranza (filtros); Overview (gráfico por producto).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en Overview retirar el texto "CONTROL OPERATIVO · ÚLTIMOS 12 MESES", eliminar filtros de entidad/sucursal/búsqueda y dejar el período funcional.
  - Regla acordada: Overview mantiene solo filtros operativos útiles (periodo y estado) y el período debe afectar el conjunto de datos mostrado.
  - Impacto: vista Overview (cabecera, panel de filtros y lógica de filtrado).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: separar métricas fijas y variables en Renovación, Cancelación y Cobranza; agregar filtros de producto y frecuencia de pago en las tres vistas.
  - Regla acordada: mantener dos bloques explícitos de métricas y filtros comunes por producto/frecuencia.
  - Impacto: vistas REN, CAN, INV; KPIs y filtros.
  - Archivos actualizados: src/App.tsx, src/App.css, README.md, .github/copilot-instructions.md.

- 2026-08-10
  - Solicitud de negocio: rediseñar Renovación con filtros en dos bloques, KPI de no renovación en bloque variable, gráfico de fallas por producto y tabla estrictamente a nivel conciliación.
  - Regla acordada: en Renovación, el rango de fechas debe ir primero; producto y frecuencia se mantienen en segmentación operativa; el resultado de no renovación por decisión RIMAC se calcula con estados NRE y RZD; la tabla de detalle usa siempre ID de conciliación, muestra confirmación/recibos en formato corto y el resultado de renovación se expresa con códigos ENV, NRE, REN, PRN, PRE y RZD.
  - Impacto: vista Renovación (filtros, KPIs, gráficos y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: en Cobranza aplicar filtros y bloques KPI con el mismo esquema visual, quitar el gráfico por estado, convertir resultado de información RIMAC a pie y simplificar columnas de tabla.
  - Regla acordada: en Cobranza los filtros se separan en rango de fechas y segmentación operativa; se elimina el gráfico de estado actual; el gráfico de información RIMAC se representa como pie con categorías "Cobrados en automático" y "No cobrados"; en la tabla se retiran columnas de movimientos y resultado y se agrega moneda.
  - Impacto: vista Cobranza (filtros, gráficos y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: en Cobranza mover moneda a la derecha de ambos montos, quitar prefijo monetario en montos/diferencia, agregar días abierto; en Overview mostrar KPI fijos por cuatro procesos.
  - Regla acordada: en la tabla de Cobranza, la columna Moneda se muestra inmediatamente después de Monto operado; Monto informado, Monto operado y Diferencia se visualizan sin símbolo monetario; se agrega Días abierto al extremo derecho calculado como hoy menos fecha de creación. En Overview, el bloque KPI debe ser fijo para Alta, Cancelación, Renovación y Cobranza.
  - Impacto: vista Cobranza (tabla) y vista Overview (KPIs).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en Cobranza quitar subtítulos de KPIs, eliminar KPI de monto informado y separar KPI monetarios por soles/dólares sin usar la palabra centavos.
  - Regla acordada: en Cobranza, los KPIs se muestran sin subtítulos; se elimina el KPI de monto informado; los KPIs monetarios quedan como monto operado en soles/dólares y diferencia en soles/dólares.
  - Impacto: vista Cobranza (bloques KPI fijo y variable).
  - Archivos actualizados: src/App.tsx.
