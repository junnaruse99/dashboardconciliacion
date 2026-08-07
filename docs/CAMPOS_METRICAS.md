# Campos del reporte

| Campo | Tabla | Descripción |
|---|---|---|
| `CONCILIATION_SEQUENTIAL_ID` | `T_PISD_INSURANCE_CONCILIATION` | Identificador único de la conciliación y clave de cruce con sus movimientos. |
| `INSURANCE_CONTRACT_ENTITY_ID` | `T_PISD_INSURANCE_CONCILIATION` | Entidad del contrato; participa en filtros y cruces con la maestra de contratos. |
| `INSURANCE_CONTRACT_BRANCH_ID` | `T_PISD_INSURANCE_CONCILIATION` | Oficina del contrato; participa en filtros y cruces con la maestra de contratos. |
| `INSRC_CONTRACT_INT_ACCOUNT_ID` | `T_PISD_INSURANCE_CONCILIATION` | Cuenta interna usada únicamente para cruzar la conciliación con el contrato. |
| `POLICY_RECEIPT_ID` | `T_PISD_INSURANCE_CONCILIATION` | Identificador del recibo mostrado en el detalle de Cobranza. |
| `SOURCE_PROCESS_TYPE` | `T_PISD_INSURANCE_CONCILIATION` | Proceso de conciliación: `CAN`, `REN` o `INV`. |
| `ERROR_CODE_ID` | `T_PISD_INSURANCE_CONCILIATION` | Código que identifica el motivo o resultado de la conciliación. |
| `ERROR_CODE_DESC` | `T_PISD_INSURANCE_CONCILIATION` | Descripción del código de conciliación. |
| `CONCILIATION_STATUS_TYPE` | `T_PISD_INSURANCE_CONCILIATION` | Estado de la conciliación: pendiente (`PEN`) o solucionada (`SOL`). |
| `CREATION_DATE` | `T_PISD_INSURANCE_CONCILIATION` | Fecha de apertura de la conciliación. |
| `AUDIT_DATE` | `T_PISD_INSURANCE_CONCILIATION` | Fecha de solución o última actualización de la conciliación. |
| `OPER_SEQ_MOV_ID` | `T_PISD_INSR_CONCILIATION_MOV` | Identificador único del movimiento de conciliación. |
| `CONCILIATION_SEQUENTIAL_ID` | `T_PISD_INSR_CONCILIATION_MOV` | Clave que relaciona el movimiento con su conciliación. |
| `SOURCE_PROCESS_TYPE` | `T_PISD_INSR_CONCILIATION_MOV` | Proceso al que pertenece el movimiento; los importes solo se usan para `INV`. |
| `PAYMENT_AMOUNT` | `T_PISD_INSR_CONCILIATION_MOV` | Importe informado por RIMAC. |
| `OPERATED_AMOUNT` | `T_PISD_INSR_CONCILIATION_MOV` | Importe operado por el Banco. |
| `INSURANCE_CONTRACT_ENTITY_ID` | `T_PISD_INSURANCE_CONTRACT` | Entidad que forma parte de la clave completa del contrato. |
| `INSURANCE_CONTRACT_BRANCH_ID` | `T_PISD_INSURANCE_CONTRACT` | Oficina que forma parte de la clave completa del contrato. |
| `CONTRACT_FIRST_VERFN_DIGIT_ID` | `T_PISD_INSURANCE_CONTRACT` | Primer dígito verificador de la clave completa del contrato. |
| `CONTRACT_SECOND_VERFN_DIGIT_ID` | `T_PISD_INSURANCE_CONTRACT` | Segundo dígito verificador de la clave completa del contrato. |
| `INSRC_CONTRACT_INT_ACCOUNT_ID` | `T_PISD_INSURANCE_CONTRACT` | Cuenta interna que forma parte de la clave completa del contrato. |
| `POLICY_ID` | `T_PISD_INSURANCE_CONTRACT` | Número de póliza usado en los detalles de Alta, Cancelación, Renovación y Cobranza. |
| `CUSTOMER_ID` | `T_PISD_INSURANCE_CONTRACT` | Identificador del cliente mostrado en el detalle de Alta. |
| `INSURANCE_PRODUCT_ID` | `T_PISD_INSURANCE_CONTRACT` | Tipo de producto usado en filtros, agrupaciones y detalles. |
| `INSRNC_CO_CONTRACT_STATUS_TYPE` | `T_PISD_INSURANCE_CONTRACT` | Estado contractual informado por RIMAC. |
| `CONTRACT_STATUS_ID` | `T_PISD_INSURANCE_CONTRACT` | Estado contractual del Banco. |
| `CREATION_DATE` | `T_PISD_INSURANCE_CONTRACT` | Fecha de alta o creación del contrato. |
| `CONTRACT_RENEWAL_STATUS_TYPE` | `T_PISD_INSURANCE_CONTRACT` | Estado de renovación; `REN` identifica un contrato renovado. |
| `CAP-ICCENDIS` | `ICDTCAP` | Entidad que forma parte de la clave completa del contrato. |
| `CAP-ICCOFDIS` | `ICDTCAP` | Oficina que forma parte de la clave completa del contrato. |
| `CAP-ICCD1CTO` | `ICDTCAP` | Primer dígito verificador de la clave completa del contrato. |
| `CAP-ICCD2CTO` | `ICDTCAP` | Segundo dígito verificador de la clave completa del contrato. |
| `CAP-ICCCTACT` | `ICDTCAP` | Cuenta interna que forma parte de la clave completa del contrato. |
| `CAP-ICFECTE` | `ICDTCAP` | Fecha de inicio del seguro usada para identificar renovaciones. |
| `CAP-ICFBAIXA` | `ICDTCAP` | Fecha de baja usada cuando el estado Banco es `BAJ`. |
| `CAP-ICFANCON` | `ICDTCAP` | Fecha de anulación usada cuando el estado Banco es `ANU`. |
| `CAP-ICCMOD01` | `ICDTCAP` | Modalidad del seguro mostrada en los detalles. |
| `CAP-ICTFOPAG` | `ICDTCAP` | Frecuencia de pago mostrada en el detalle de Alta. |
| `CAP-ICIPRTOT` | `ICDTCAP` | Prima periódica mostrada en el detalle de Alta. |
| `CAP-ICDIVISA` | `ICDTCAP` | Moneda de la prima periódica. |
| `CAP-ICHTIULM` | `ICDTCAP` | Fecha y hora usada para seleccionar el registro más reciente de cada contrato. |
| `CAP-ICFALMOV` | `ICDTCAP` | Fecha usada como desempate al seleccionar el registro más reciente. |
| `CAP-ICNUMCLIEN` | `ICDTCAP` | Identificador del cliente generado por la entidad y que se encuentra como asegurado en la póliza. El Asegurado es la persona que está en la posibilidad de sufrir un siniestro o tiene bienes de su propiedad susceptibles de sufrir un siniestro. |
| `ICCENDIS` | `ICDTCAM` | Entidad que forma parte de la clave contractual del recibo. |
| `ICCOFDIS` | `ICDTCAM` | Oficina que forma parte de la clave contractual del recibo. |
| `ICCD1CTO` | `ICDTCAM` | Primer dígito verificador de la clave contractual del recibo. |
| `ICCD2CTO` | `ICDTCAM` | Segundo dígito verificador de la clave contractual del recibo. |
| `ICCCTACT` | `ICDTCAM` | Cuenta interna que forma parte de la clave contractual del recibo. |
| `ICNUMOVI` | `ICDTCAM` | Número que identifica cada movimiento o recibo dentro del contrato. |
| `ICFELIQ` | `ICDTCAM` | Fecha en la que el recibo debe intentarse cobrar. |
| `ICFECOB` | `ICDTCAM` | Fecha real de cobro; `01-01-01` representa un recibo no cobrado. |
| `ICNUMINT` | `ICDTCAM` | Cantidad de intentos realizados sobre el recibo. |
| `ICPRREC` | `ICDTCAM` | Importe neto cobrado del recibo. |
| `ICINDPECO` | `ICDTCAM` | Estado informado del cobro del recibo. |

# Métricas calculadas

| Campo | Cálculo | Ubicación |
|---|---|---|
| Altas de hoy | Conteo de contratos con `CREATION_DATE = hoy`. | Alta |
| Altas del mes | Conteo de contratos con `CREATION_DATE` dentro del mes actual. | Alta |
| Pendientes históricos RIMAC | Conteo de contratos con `INSRNC_CO_CONTRACT_STATUS_TYPE = PEN`, sin filtro temporal. | Alta |
| Formalizadas del período | Conteo de contratos del rango con `INSRNC_CO_CONTRACT_STATUS_TYPE = FOR`. | Alta |
| Tasa de formalización | `Formalizadas del período / contratos filtrados del período × 100`. | Alta |
| Altas por período | Conteo de contratos agrupados por día, mes o año de `CREATION_DATE`. | Alta |
| Formalizadas por período | Conteo de contratos `FOR` agrupados por día, mes o año de `CREATION_DATE`. | Alta |
| Contratos por producto | Conteo de contratos agrupados por `INSURANCE_PRODUCT_ID`. | Alta |
| Pendientes por producto | Conteo de contratos `PEN` agrupados por `INSURANCE_PRODUCT_ID`. | Alta |
| Cancelados hoy | Conteo de contratos `BAJ` con `CAP-ICFBAIXA = hoy` más contratos `ANU` con `CAP-ICFANCON = hoy`. | Cancelación |
| Cancelados del mes | Conteo de contratos `BAJ` o `ANU` cuya fecha correspondiente pertenece al mes actual. | Cancelación |
| Abiertos sin cancelar en RIMAC | Conteo de conciliaciones `CAN`, `PEN` y `CAN_FILE_NOT_SENT`. | Cancelación |
| Tasa de resolución | `Conciliaciones SOL / total de conciliaciones filtradas × 100`. | Cancelación |
| Tiempo medio de resolución | Promedio de días entre `CREATION_DATE` y `AUDIT_DATE` para conciliaciones `SOL`. | Cancelación |
| Conciliaciones abiertas por período | Conteo agrupado por período de `CREATION_DATE`. | Cancelación |
| Conciliaciones resueltas por período | Conteo de conciliaciones `SOL` agrupado por período de `AUDIT_DATE`. | Cancelación |
| Motivos pendientes | Conteo de conciliaciones `PEN` agrupado por `ERROR_CODE_ID`. | Cancelación |
| Antigüedad de abiertas | Días entre `CREATION_DATE` y hoy para conciliaciones `PEN`, agrupados en bandas. | Cancelación |
| Renovados hoy | Conteo de contratos con `CONTRACT_RENEWAL_STATUS_TYPE = REN` y `CAP-ICFECTE = hoy`. | Renovación |
| Renovados del mes | Conteo de contratos `REN` con `CAP-ICFECTE` dentro del mes actual. | Renovación |
| Casos de renovación | Conteo de conciliaciones `REN` dentro del rango y estado seleccionados. | Renovación |
| Renovaciones abiertas por período | Conteo de conciliaciones `REN` agrupado por `CREATION_DATE`. | Renovación |
| Renovaciones resueltas por período | Conteo de conciliaciones `REN` y `SOL` agrupado por `AUDIT_DATE`. | Renovación |
| Recibos cobrados | Conteo de movimientos ICDTCAM con `ICFECOB` real y distinto de `01-01-01`. | Cobranza |
| Cobrados hoy | Conteo de movimientos con `ICFECOB = hoy`. | Cobranza |
| Cobrados del mes | Conteo de movimientos con `ICFECOB` dentro del mes actual. | Cobranza |
| Recibos intentados hoy | Conteo de movimientos con `ICFELIQ = hoy` e `ICNUMINT > 0`. | Cobranza |
| Intentos realizados hoy | Suma de `ICNUMINT` para movimientos con `ICFELIQ = hoy` e `ICNUMINT > 0`. | Cobranza |
| Efectividad de cobro | `Recibos con ICFELIQ = hoy, ICNUMINT > 0 e ICFECOB = hoy / recibos con ICFELIQ = hoy e ICNUMINT > 0 × 100`. | Cobranza |
| Cobro automático no informado | Conteo de conciliaciones `INV`, `PEN` e `INV_RIMAC_NOT_SENT`. | Cobranza |
| No cobrado ni informado | Conteo de conciliaciones `INV`, `PEN` e `INV_RIMAC_NOT_CHAR`. | Cobranza |
| Conciliaciones abiertas | Conteo de conciliaciones `INV` con `CONCILIATION_STATUS_TYPE = PEN`. | Cobranza |
| Monto informado | Suma de `PAYMENT_AMOUNT` de movimientos `INV` relacionados. | Cobranza |
| Monto operado | Suma de `OPERATED_AMOUNT` de movimientos `INV` relacionados. | Cobranza |
| Diferencia de centavos | `Monto informado - monto operado`. | Cobranza |
| Resultado de información RIMAC | Conteo de conciliaciones `INV` y `PEN` agrupado por `INV_RIMAC_NOT_SENT` e `INV_RIMAC_NOT_CHAR`. | Cobranza |
