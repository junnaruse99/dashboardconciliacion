# Dashboard de Conciliación de Seguros

MVP interactivo para presentar a negocio el diseño objetivo de un dashboard de Amazon QuickSight. Permite analizar diferencias operativas entre el banco y RIMAC para Cancelación, Renovación y Cobranza, además de una vista independiente de altas.

## Alcance funcional

- Overview ejecutivo con KPIs consolidados.
- Pestañas de Alta, Cancelación, Renovación y Cobranza.
- Flujo por proceso: filtros, KPIs, gráficos y tabla de detalle.
- Datos de demostración incluidos para presentar el prototipo sin archivos externos.
- Importación separada de los archivos CSV de conciliaciones, movimientos, maestra de contratos, ICDTCAP e ICDTCAM.
- Exportación de la tabla filtrada a CSV e impresión del dashboard.
- Diseño responsivo para escritorio, tablet y móvil.

## Ejecutar

Requiere Node.js 18 o superior. Para evitar advertencias de herramientas se recomienda Node.js 20 LTS.

1. Instalar dependencias con `npm install`.
2. Iniciar el modo de desarrollo con `npm run dev`.
3. Crear una versión productiva con `npm run build`.
4. Validar estilo y código con `npm run lint`.

## Modelo de fuentes

El catálogo consolidado de campos está organizado en un archivo independiente por fuente en [docs/fuentes/README.md](docs/fuentes/README.md). Cada diccionario conserva campo, descripción, tipo y longitud para poder reutilizarlo en futuras evoluciones.

La trazabilidad de los KPI y gráficos hasta sus campos físicos, filtros, cruces y transformaciones se encuentra en [docs/CAMPOS_METRICAS.md](docs/CAMPOS_METRICAS.md). El inventario diferencia la implementación actual de las reglas funcionales objetivo.

Las fuentes se cargan y conservan por separado. El dashboard construye una relación lógica de uno a muchos:

`T_PISD_INSURANCE_CONCILIATION.CONCILIATION_SEQUENTIAL_ID` (1) → `T_PISD_INSR_CONCILIATION_MOV.CONCILIATION_SEQUENTIAL_ID` (N).

El identificador de conciliación es la clave de cruce. `SOURCE_PROCESS_TYPE` también se conserva en ambas fuentes para validación de consistencia, pero no sustituye la clave.

Alta no participa en este cruce: se alimenta de forma independiente desde `MAESTRA_CONTRATOS.csv`.

La vista de Alta se enriquecerá mediante un `LEFT JOIN` con `ICDTCAP`. El contrato completo de la fuente, su catálogo de campos y las reglas del cruce están documentados en [docs/ICDTCAP.md](docs/ICDTCAP.md). La plantilla física está disponible en [ICDTCAP.csv](ICDTCAP.csv).

`ICDTCAM` representa los recibos y movimientos de seguros y se conserva como una fuente independiente, sin reemplazar `T_PISD_INSR_CONCILIATION_MOV`. Su diccionario de 95 posiciones está en [docs/fuentes/ICDTCAM.md](docs/fuentes/ICDTCAM.md) y la plantilla con los 88 nombres físicos informados está en [ICDTCAM.csv](ICDTCAM.csv). Las cinco posiciones sin nombre físico y las dos columnas calculadas no se inventan ni se incluyen como encabezados físicos.

La granularidad de ICDTCAM es movimiento o recibo de póliza. El contrato completo se identifica mediante `ICCENDIS` + `ICCOFDIS` + `ICCD1CTO` + `ICCD2CTO` + `ICCCTACT`; `ICNUMOVI` identifica el número del movimiento. Para Cobranza se usan `ICFECOB` como fecha real de cobro, `ICFELIQ` como fecha en que corresponde intentar el cobro e `ICNUMINT` como cantidad de intentos. `ICPRREC` e `ICINDPECO` se conservan como importe neto y estado del cobro.

## Maestra de contratos para Alta

El botón **Contratos** aparece en la pestaña Alta y admite los encabezados Oracle suministrados. Para el reporte se utilizan:

| Campo | Uso en Alta |
|---|---|
| INSURANCE_CONTRACT_ENTITY_ID | Entidad y componente del identificador de contrato |
| INSURANCE_CONTRACT_BRANCH_ID | Oficina y componente del identificador de contrato |
| INSRC_CONTRACT_INT_ACCOUNT_ID | Componente final del identificador completo del contrato |
| CONTRACT_FIRST_VERFN_DIGIT_ID | Primer dígito verificador |
| CONTRACT_SECOND_VERFN_DIGIT_ID | Segundo dígito verificador |
| INSURANCE_PRODUCT_ID | Tipo de producto por ID |
| POLICY_ID | Póliza numérica de hasta 10 dígitos |
| CUSTOMER_ID | Identificador del cliente |
| INSRNC_CO_CONTRACT_STATUS_TYPE | Estado del contrato en RIMAC |
| CONTRACT_STATUS_ID | Estado del contrato en el Banco |
| CREATION_DATE | Fecha de alta o creación; se usa para conteos diarios, mensuales y filtros temporales |
| SOURCE_PLATFORM_TYPE | Plataforma operacional de origen |

Estados contractuales admitidos: `ANU`, `BAJ`, `ERR`, `FOR`, `PEN` e `INC`. Para el KPI de formalización, `FOR` representa un contrato formalizado en RIMAC y únicamente `PEN` se considera pendiente de formalizar.

La vista permite elegir Hoy, Mes actual, Año actual, Últimos 12 meses, Histórico o un rango personalizado. La agrupación del gráfico cambia automáticamente entre día, mes y año según la extensión seleccionada. También permite filtrar por producto y estado RIMAC. El KPI de pendientes usa todo el histórico y al seleccionarlo aplica `PEN` y el período Histórico, comportamiento trasladable a QuickSight mediante una acción de filtro.

El identificador del contrato se muestra completo y concatenado, sin separadores: entidad (`0011`) + oficina + dos dígitos verificadores + cuenta interna. Entidad y oficina no se repiten como columnas independientes.

Archivo de muestra: `MAESTRA_CONTRATOS.csv`.

### Enriquecimiento de Alta con ICDTCAP

El dashboard permite cargar `ICDTCAP.csv` de forma independiente y realiza un `LEFT JOIN` por el identificador completo normalizado. Antes del cruce completa entidad y oficina a cuatro posiciones, la cuenta a diez posiciones y conserva ambos dígitos verificadores como texto. Si existen duplicados, conserva la versión más reciente por `CAP-ICHTIULM` y usa `CAP-ICFALMOV` como desempate.

La tabla de detalle diferencia explícitamente:

| Columna | Fuente |
|---|---|
| Fecha de alta | `MAESTRA_CONTRATOS.CREATION_DATE` |
| Fecha de inicio | `ICDTCAP.CAP-ICFECTE` |
| Modalidad | `ICDTCAP.CAP-ICCMOD01` |
| Frecuencia de pago | `ICDTCAP.CAP-ICTFOPAG` |
| Prima periódica | `ICDTCAP.CAP-ICIPRTOT` |
| Moneda | `ICDTCAP.CAP-ICDIVISA` |

Los contratos sin correspondencia permanecen visibles y muestran un guion en los campos ICDTCAP. El MVP reconoce fechas ICDTCAP en formato `YYYY-MM-DD` o `DD/MM/YYYY`; el formato definitivo debe validarse con una muestra productiva. Los códigos de frecuencia se muestran con el catálogo provisional `M`, `B`, `T`, `S` y `A`; cualquier otro código se conserva como dato sin catalogar.

## T_PISD_INSURANCE_CONCILIATION

El botón **Maestra** acepta encabezados Oracle con estos nombres exactos:

| Campo | Obligatorio | Uso |
|---|---:|---|
| CONCILIATION_SEQUENTIAL_ID | Sí | Identificador único de conciliación |
| INSURANCE_CONTRACT_ENTITY_ID | Sí | Entidad |
| INSURANCE_CONTRACT_BRANCH_ID | Sí | Sucursal |
| INSRC_CONTRACT_INT_ACCOUNT_ID | No | Campo de origen no expuesto en el dashboard |
| POLICY_ID | No | Póliza numérica de 1 a 10 dígitos |
| POLICY_RECEIPT_ID | Sí | Recibo de póliza |
| SOURCE_PROCESS_TYPE | Sí | CAN, REN o INV |
| ERROR_CODE_ID | Sí | Código de diferencia |
| ERROR_CODE_DESC | No | Descripción de diferencia |
| CONCILIATION_STATUS_TYPE | Sí | PEN o SOL |
| CREATION_USER_ID | No | Usuario creador |
| CREATION_DATE | Sí | Fecha de creación |
| USER_AUDIT_ID | Sí | Usuario de auditoría |
| AUDIT_DATE | Sí | Fecha de auditoría/solución |

Los registros con procesos distintos de CAN, REN o INV, o estados diferentes de PEN o SOL, no se incorporan al dashboard.

La cuenta interna no se muestra, no se exporta y no participa en las búsquedas. Las pólizas que no cumplan la expresión `^\d{1,10}$` se tratan como no identificadas.

### Catálogo de errores admitido

- `CAN_FILE_NOT_SENT`
- `CAN_DUPLICATE_RESP`
- `INV_RIMAC_NOT_SENT`
- `INV_RIMAC_NOT_CHAR`
- `CAN_UNEXPECTED_ERR`
- `REN_POL_NOTFOUND_ERR`
- `CAN_CONCILIATION`

El prefijo del error debe coincidir con `SOURCE_PROCESS_TYPE`.

Archivo de muestra: `T_PISD_INSURANCE_CONCILIATION.csv`.

## T_PISD_INSR_CONCILIATION_MOV

El botón **Movimientos** acepta los siguientes campos:

| Campo | Obligatorio | Uso |
|---|---:|---|
| OPER_SEQ_MOV_ID | Sí | Identificador único del movimiento |
| CONCILIATION_SEQUENTIAL_ID | Sí | Clave foránea hacia la tabla maestra |
| SOURCE_PROCESS_TYPE | Sí | CAN, REN o INV |
| PAYMENT_AMOUNT | No | Monto pagado; solo aplica a INV |
| OPERATED_AMOUNT | No | Monto operado; solo aplica a INV |
| INPUT_FILE_NAME | No | Archivo origen del movimiento |
| ERROR_CODE_ID | Sí | Código de error del movimiento |
| ERROR_CODE_DESC | No | Descripción del error |
| ORIGINAL_MOV_DETAIL_DESC | No | Detalle original recibido |
| CONCILIATION_DESC | No | Resultado o comentario de conciliación |
| CREATION_USER_ID | No | Usuario creador |
| CREATION_DATE | No | Fecha de creación |
| USER_AUDIT_ID | Sí | Usuario de auditoría |
| AUDIT_DATE | Sí | Fecha de auditoría |

Archivo de muestra: `T_PISD_INSR_CONCILIATION_MOV.csv`.

Cada movimiento se agrega a nivel de conciliación. Los importes se fuerzan a cero para CAN y REN, y no se muestran en esas pestañas ni en Overview. En Cobranza se calculan la suma de `PAYMENT_AMOUNT`, la suma de `OPERATED_AMOUNT` y su diferencia. Esta diferencia se presenta con dos decimales porque se espera que sea excepcional y de pocos centavos.

## Definiciones del MVP

- **Total de casos:** cantidad de filas de conciliación.
- **Backlog pendiente:** registros con estado PEN.
- **Tasa de solución:** registros SOL entre total de registros.
- **Pólizas afectadas:** pólizas únicas no vacías.
- **Tiempo promedio de resolución:** días entre CREATION_DATE y AUDIT_DATE para registros SOL.
- **Movimientos relacionados:** filas de movimientos cuyo identificador existe en la selección de conciliaciones.
- **Monto pagado (solo Cobranza):** suma de PAYMENT_AMOUNT de movimientos INV.
- **Monto operado (solo Cobranza):** suma de OPERATED_AMOUNT de movimientos INV.
- **Diferencia de centavos (solo Cobranza):** monto pagado menos monto operado.
- **Altas de hoy:** contratos cuya `CREATION_DATE` corresponde al día actual.
- **Altas del mes:** contratos cuya `CREATION_DATE` corresponde al mes actual.
- **Pendientes históricos en RIMAC:** contratos con estado RIMAC `PEN` en todo el histórico, respetando el producto seleccionado.
- **Formalizadas del período:** contratos con estado RIMAC `FOR` dentro del rango seleccionado.
- **Tasa de formalización:** contratos `FOR` sobre las altas del rango seleccionado.

### Definiciones específicas de Cancelación

- **Periodo y estado:** filtran las conciliaciones `CAN` por `CREATION_DATE` y `CONCILIATION_STATUS_TYPE`. No se aplican filtros de entidad, sucursal ni búsqueda en esta vista.
- **Cancelados hoy/del mes:** contratos cuyo `CONTRACT_STATUS_ID` del Banco sea `BAJ` o `ANU`. Para `BAJ` se usa `ICDTCAP.CAP-ICFBAIXA`; para `ANU`, `ICDTCAP.CAP-ICFANCON`.
- **Abiertos sin cancelar en RIMAC:** conciliaciones `PEN` con error `CAN_FILE_NOT_SENT` dentro del rango seleccionado.
- **Tasa de resolución:** conciliaciones `SOL` entre el total de conciliaciones del rango.
- **Tiempo medio de resolución:** promedio de días entre `CREATION_DATE` y `AUDIT_DATE`, únicamente para registros `SOL`.
- **Conciliaciones abiertas y resueltas:** las aperturas se agrupan por `CREATION_DATE`; las resoluciones `SOL`, por `AUDIT_DATE`. No se presenta un backlog histórico mensual porque las fuentes disponibles no contienen snapshots de estado ni historial de transiciones suficiente para reconstruirlo correctamente.
- **Detalle de Cancelación:** la póliza y el código de producto se obtienen de `MAESTRA_CONTRATOS`; la modalidad se obtiene de `ICDTCAP.CAP-ICCMOD01`. El cruce parte de entidad + oficina + cuenta interna. Nunca se toma `T_PISD_INSURANCE_CONCILIATION.POLICY_ID` para esta vista. Los verificadores no están presentes en la conciliación, por lo que no participan en este cruce.

### Definiciones específicas de Renovación

- **Periodo y estado:** filtran las conciliaciones `REN` por `CREATION_DATE` y `CONCILIATION_STATUS_TYPE`. No se aplican filtros de entidad, sucursal ni búsqueda.
- **Renovados hoy/del mes:** contratos cuyo `CONTRACT_RENEWAL_STATUS_TYPE` sea `REN`, usando `ICDTCAP.CAP-ICFECTE` como fecha de inicio del contrato para determinar el día o mes.
- **Cantidad de casos:** conciliaciones `REN` dentro del periodo y estado seleccionados.
- **Tendencia histórica diaria:** aperturas por `CREATION_DATE` y soluciones `SOL` por `AUDIT_DATE`; ambas se agrupan por día.
- **Detalle de Renovación:** la póliza y `INSURANCE_PRODUCT_ID` se obtienen de `MAESTRA_CONTRATOS`; la modalidad se obtiene de `ICDTCAP.CAP-ICCMOD01`. El cruce usa entidad + oficina + cuenta interna y no usa la póliza de conciliación.

### Definiciones específicas de Cobranza

- **Recibos cobrados:** movimientos ICDTCAM cuya fecha real `ICFECOB` está informada. El valor por defecto `01-01-01` se interpreta como no cobrado.
- **Cobrados hoy/del mes:** recibos ICDTCAM cuya fecha real de cobro `ICFECOB` corresponde al día o mes actual.
- **Recibos intentados hoy:** recibos con `ICFELIQ` igual a la fecha actual e `ICNUMINT` mayor que cero. La suma de `ICNUMINT` informa el total de intentos realizados sobre esos recibos.
- **Efectividad de cobro:** recibos intentados hoy que además tienen `ICFECOB` igual a hoy, divididos entre el total de recibos intentados hoy.
- **Cobro automático no informado:** conciliaciones `INV` en estado `PEN` con código `INV_RIMAC_NOT_SENT`. El recibo sí fue cobrado automáticamente, pero RIMAC no envió la información.
- **No cobrado ni informado:** conciliaciones `INV` en estado `PEN` con código `INV_RIMAC_NOT_CHAR`. El recibo no fue cobrado y RIMAC tampoco envió la información.
- **Conciliaciones abiertas:** conciliaciones `INV` en estado `PEN`, respetando los filtros activos de conciliación.
- **Monto informado:** suma de `PAYMENT_AMOUNT` de los movimientos `INV` relacionados con la selección.
- **Monto operado:** suma de `OPERATED_AMOUNT` de los movimientos `INV` relacionados con la selección.
- **Diferencia de centavos:** `PAYMENT_AMOUNT - OPERATED_AMOUNT` después de agregar los movimientos.
- **Detalle de Cobranza:** la póliza y `INSURANCE_PRODUCT_ID` se obtienen de `MAESTRA_CONTRATOS` mediante entidad + oficina + cuenta interna; la modalidad se obtiene de `ICDTCAP.CAP-ICCMOD01`. No se utiliza la póliza de conciliación. La tabla muestra el resultado funcional del código: cobrado automático, no cobrado o regularizado cuando la conciliación ya está `SOL`.
- ICDTCAM conserva la granularidad por recibo o movimiento y no se deduplica por contrato.

## Evolución hacia QuickSight

El prototipo define jerarquía visual, filtros, campos y cálculos. Para productivizarlo en QuickSight se debe cargar el extracto diario en S3, catalogarlo con Glue, crear el dataset en SPICE y trasladar los cálculos anteriores a campos calculados.
