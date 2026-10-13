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
| `CAP-ICFECTE` | `ICDTCAP` | Fecha de inicio de cobertura; no se usa para fechar los hitos de renovación. |
| `CAP-ICFVENPO` | `ICDTCAP` | Último día de vigencia y fecha D0; permite calcular D-50 y D-45. |
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

En Renovación, Cancelación y Cobranza las métricas generales responden al contexto indicado en cada visual y no muestran un corte fijo del día o mes. Las tres vistas admiten producto y frecuencia de pago; ambos atributos provienen del contrato enriquecido con `MAESTRA_CONTRATOS` e `ICDTCAP.CAP-ICTFOPAG`.

| Campo | Cálculo | Ubicación |
|---|---|---|
| Pendientes históricos RIMAC | Conteo de contratos con `INSRNC_CO_CONTRACT_STATUS_TYPE = PEN`, sin filtro temporal. | Alta |
| Cantidad de altas | Conteo de contratos con `CREATION_DATE` dentro del rango y contexto filtrado. | Alta |
| Monto total de altas por moneda | Suma de `CAP-ICIPRTOT` de los contratos del rango y contexto filtrado, separada en PEN y USD según `CAP-ICDIVISA`, sin conversión. Se muestra debajo de Cantidad de altas. | Alta |
| Monto pendiente RIMAC por moneda | Suma de `CAP-ICIPRTOT` de los contratos `PEN` del rango y contexto filtrado, separada en PEN y USD según `CAP-ICDIVISA`, sin conversión. Se muestra debajo de Pendientes RIMAC. | Alta |
| Tasa de formalización | `Formalizadas del período / contratos filtrados del período × 100`. | Alta |
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
| Pólizas previstas para renovar | Contratos activos cuyo `CAP-ICFVENPO` pertenece al período seleccionado; excluye estados Banco `BAJ`, `ANU` y `ERR`. | Renovación |
| Confirmadas por RIMAC | Pólizas previstas para renovar menos las que tienen incidencia abierta `PRE_*` y menos las rechazadas (`NRE`). | Renovación |
| Recibos enviados por RIMAC | Casos confirmados cuyo estado de renovación del recibo es `PRN`. | Renovación |
| Falta enviar recibos | Casos confirmados con estado `PRE` cuando ya corresponde la ventana de envío de recibos (D-45). | Renovación |
| Aún no corresponde envío de recibos | Casos confirmados cuya ventana de envío de recibos aún no llega (antes de D-45). | Renovación |
| En riesgo sin confirmación | Pólizas aún vigentes con incidencia `PRE_NOTFOUND_ERR` o `PRE_AUT_NOTFOUND_ERR` en estado `PEN`. | Renovación |
| Por renovar con información pendiente | Pólizas aún vigentes con una incidencia `PRE_*` o `REN_*` abierta. | Renovación |
| No renovación por decisión RIMAC | Pólizas con estado de renovación `NRE`. | Renovación |
| Renovadas hoy | Contratos con `CONTRACT_RENEWAL_STATUS_TYPE = REN` y `CAP-ICFECTE = hoy`. | Renovación |
| Vencidas sin renovar por información pendiente | Contratos con vigencia terminada, estado distinto de `REN` e incidencia `PRE_*` o `REN_*` abierta. | Renovación |
| Renovadas en el mes | Contratos con `CONTRACT_RENEWAL_STATUS_TYPE = REN` y `CAP-ICFVENPO` dentro del mes actual. | Renovación |
| Días para regularizar | Diferencia firmada en días calendario entre hoy y `CAP-ICFVENPO`; un valor negativo indica vigencia vencida. | Renovación |
| Recibos a facturar | Conteo de movimientos ICDTCAM con `ICFELIQ` dentro del rango filtrado. El escenario demostrativo completo contiene 223. | Cobranza |
| Recibos facturados | Conteo de recibos con estado demostrativo `FAC`. El escenario completo contiene 180; el campo físico productivo queda pendiente de confirmación de negocio. | Cobranza |
| Recibos cobrados | Conteo de movimientos ICDTCAM con `ICFECOB` real y dentro del rango filtrado. El escenario demostrativo completo contiene 177. | Cobranza |
| Tasa de cobranza | `Recibos cobrados / recibos a facturar × 100`; para el escenario completo, `177 / 223 = 79,4 %`. | Cobranza |
| Monto a facturar | Suma del importe facturable de los recibos por moneda. En producción corresponde a `ICDTCAM.ICIPRTOT`. | Cobranza |
| Monto cobrado | Suma del importe neto cobrado por moneda. En producción corresponde a `ICDTCAM.ICPRREC`. | Cobranza |
| Porcentaje cobrado | `Monto cobrado / monto a facturar × 100`. | Cobranza |
| Evolución de facturación y cobranza | Conteos de recibos por facturar, facturados y cobrados agrupados por `ICFELIQ`. | Cobranza |
| Tasa por producto | Recibos cobrados sobre recibos a facturar, ordenados por volumetría; se muestran Top 5 productos y el resto se agrupa en `Otros`. | Cobranza |
| Recibos facturados en automático | Universo demostrativo de facturación automática. En la vista completa se fija en 100 hasta confirmar el campo físico productivo. | Conciliación Cobranza |
| Recibos no conciliados | Parte pendiente del universo facturado en automático. En el escenario demostrativo son 20. | Conciliación Cobranza |
| Recibos conciliados | Diferencia entre facturados en automático y no conciliados. En el escenario demostrativo son 80 y debe cumplirse `20 + 80 = 100`. | Conciliación Cobranza |
| Recibos no facturados | `Recibos a facturar - recibos facturados`; para el escenario completo, `223 - 180 = 43`. | Conciliación Cobranza |
| Monto no facturado | Suma del importe facturable de los recibos con estado de facturación pendiente, separada por moneda. En el escenario completo son S/ 13.760,00 y USD 0,00. | Conciliación Cobranza |
| Antigüedad de no conciliados | Recibos no conciliados agrupados por días desde `ICFELIQ` en bandas mutuamente excluyentes: 1-3, 4-5, 6-7 y más de 7 días. Las bandas deben sumar el KPI de no conciliados. | Conciliación Cobranza |
| Antigüedad de no facturados | Recibos no facturados agrupados por días desde `ICFELIQ` en bandas mutuamente excluyentes: 1-3, 4-5, 6-7 y más de 7 días. Las bandas deben sumar el KPI de no facturados. | Conciliación Cobranza |
| Cobro automático no informado | Conteo de conciliaciones `INV`, `PEN` e `INV_RIMAC_NOT_SENT`. | Cobranza |
| No cobrado ni informado | Conteo de conciliaciones `INV`, `PEN` e `INV_RIMAC_NOT_CHAR`. | Cobranza |
| Conciliaciones abiertas | Conteo de conciliaciones `INV` con `CONCILIATION_STATUS_TYPE = PEN`. | Cobranza |
| Monto informado | Suma de `PAYMENT_AMOUNT` de movimientos `INV` relacionados. | Cobranza |
| Monto operado | Suma de `OPERATED_AMOUNT` de movimientos `INV` relacionados. | Cobranza |
| Diferencia de centavos | `Monto informado - monto operado`. | Cobranza |
