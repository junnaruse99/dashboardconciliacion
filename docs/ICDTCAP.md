# Contrato de datos — ICDTCAP

## 1. Objetivo

`ICDTCAP` contiene información del contrato de seguro registrado en el sistema bancario: identificación, producto, póliza, vigencia, situación, cliente, primas, cobros y datos operativos.

La fuente se utilizará para enriquecer la vista de **Alta** y contrastar la información de la maestra de contratos con el registro bancario.

Plantilla física con los 90 encabezados: [`ICDTCAP.csv`](../ICDTCAP.csv).

## 2. Relación con la maestra de contratos

### 2.1 Clave compuesta

El join se realizará con el identificador completo del contrato:

| Maestra de contratos | ICDTCAP | Longitud | Componente |
|---|---|---:|---|
| `INSURANCE_CONTRACT_ENTITY_ID` | `CAP-ICCENDIS` | 4 | Entidad financiera |
| `INSURANCE_CONTRACT_BRANCH_ID` | `CAP-ICCOFDIS` | 4 | Oficina de contratación |
| `CONTRACT_FIRST_VERFN_DIGIT_ID` | `CAP-ICCD1CTO` | 1 | Primer dígito verificador |
| `CONTRACT_SECOND_VERFN_DIGIT_ID` | `CAP-ICCD2CTO` | 1 | Segundo dígito verificador |
| `INSRC_CONTRACT_INT_ACCOUNT_ID` | `CAP-ICCCTACT` | 10 | Cuenta interna del contrato |

Identificador normalizado:

`ENTITY(4) + BRANCH(4) + DV1(1) + DV2(1) + ACCOUNT(10)`

Longitud esperada: **20 caracteres**.

Ejemplo:

`0011` + `0204` + `4` + `8` + `7300000002` = `00110204487300000002`

### 2.2 Condiciones del join

- Tipo: `LEFT JOIN` desde la maestra de contratos hacia `ICDTCAP`.
- Cardinalidad esperada: `1:1` por identificador completo.
- Todos los componentes deben tratarse como texto para conservar ceros a la izquierda.
- Antes del cruce se debe aplicar `TRIM`, completar a la izquierda y validar longitudes.
- No usar `CAP-ICNUMPOL` / `POLICY_ID` como clave principal del join.
- Si `ICDTCAP` contiene duplicados para la clave, conservar el registro más reciente según `CAP-ICHTIULM`; usar `CAP-ICFALMOV` como segundo criterio.
- Los registros sin correspondencia deben permanecer en el reporte con indicador `SIN_MATCH_ICDTCAP`.

### 2.3 Normalización sugerida

| Campo | Regla |
|---|---|
| Entidad | `LPAD(TRIM(valor), 4, '0')` |
| Oficina | `LPAD(TRIM(valor), 4, '0')` |
| Dígitos verificadores | Un carácter cada uno |
| Cuenta | `LPAD(TRIM(valor), 10, '0')` |
| Fechas PIC X(10) | Convertir al formato de fecha real identificado en la fuente |
| Campos COMP-3 | Desempaquetar como decimal antes de cargar a QuickSight |

> El formato físico de las fechas `PIC X(10)` debe confirmarse con una muestra real. No debe asumirse `YYYY-MM-DD` sin validación.

## 3. Campos prioritarios para Alta

| Campo ICDTCAP | Uso propuesto |
|---|---|
| `CAP-ICCENDIS`, `CAP-ICCOFDIS`, `CAP-ICCD1CTO`, `CAP-ICCD2CTO`, `CAP-ICCCTACT` | Join e identificador completo |
| `CAP-ICCPRODC` | Producto bancario para análisis de oportunidad |
| `CAP-ICCSUBPR` | Subproducto |
| `CAP-ICCMOD01` | Modalidad/cobertura |
| `CAP-ICNUMPOL` | Contraste de póliza |
| `CAP-ICFCONTR` | Fecha contractual bancaria |
| `CAP-ICFECTE` | Inicio de vigencia del seguro |
| `CAP-ICFVENPO` | Fin de vigencia actual |
| `CAP-ICFBAIXA` | Fecha de baja definitiva |
| `CAP-ICFANCON` | Fecha de cancelación/anulación |
| `CAP-ICFCOMUN` | Comunicación de la contratación a la aseguradora |
| `CAP-ICFTRANS` | Envío de póliza/contrato a la aseguradora |
| `CAP-ICYSITUA` | Situación bancaria actual del contrato |
| `CAP-ICESTADO` | Estado anterior de la póliza |
| `CAP-ICDIREC3` | Cliente pagador |
| `CAP-ICNUMCLIEN` | Cliente asegurado |
| `CAP-ICTFOPAG` | Periodicidad de pago |
| `CAP-ICIPRTOT` | Prima periódica del cliente |
| `CAP-ICIPBASR` | Prima a liquidar a la compañía |
| `CAP-ICDIVISA` | Moneda |
| `CAP-ICACUIMPA` | Deuda vencida pendiente |
| `CAP-ICINDEUPE` | Indicador de deuda vencida |
| `CAP-ICCUSUAR` | Usuario de alta/modificación |
| `CAP-ICHTIULM` | Última actualización |
| `CAP-ICCOFMOD` | Oficina de última modificación |

## 4. Indicadores derivados sugeridos

- **Match ICDTCAP:** contrato de la maestra encontrado por clave completa.
- **Desfase de póliza:** `POLICY_ID` diferente de `CAP-ICNUMPOL`.
- **Desfase de producto:** producto de la maestra no homologado con `CAP-ICCPRODC`.
- **Días hasta comunicación:** `CAP-ICFCOMUN - CAP-ICFCONTR`.
- **Días hasta envío:** `CAP-ICFTRANS - CAP-ICFCONTR`.
- **Contrato vigente en banco:** situación bancaria válida y sin fecha de baja/cancelación.
- **Oportunidad de formalización:** Banco `FOR` y RIMAC `PEN`, segmentada por producto/subproducto/modalidad.
- **Deuda pendiente:** `CAP-ICINDEUPE` activo o `CAP-ICACUIMPA > 0`.

La homologación entre `INSURANCE_PRODUCT_ID` y `CAP-ICCPRODC` debe suministrarse como catálogo; no se debe asumir equivalencia directa.

## 5. Catálogo completo de campos

### 5.1 Identificación del contrato de seguro

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICCENDIS` | PIC X(4) | Entidad financiera del contrato de seguro |
| `CAP-ICCOFDIS` | PIC X(4) | Oficina de contratación |
| `CAP-ICCD1CTO` | PIC X(1) | Primer dígito verificador del contrato |
| `CAP-ICCD2CTO` | PIC X(1) | Segundo dígito verificador del contrato |
| `CAP-ICCCTACT` | PIC X(10) | Cuenta interna del contrato de seguro |
| `CAP-ICCCYCIA` | PIC X(2) | Compañía operadora de seguros |
| `CAP-ICCPRODC` | PIC X(3) | Producto del contrato de seguro |
| `CAP-ICCSUBPR` | PIC X(4) | Subproducto asociado |
| `CAP-ICCMOD01` | PIC X(2) | Modalidad o cobertura específica |
| `CAP-ICNUMPOL` | S9(7) COMP-3 | Número de póliza |

### 5.2 Producto financiero vinculado

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICCENTPF` | PIC X(4) | Entidad del contrato financiero vinculado |
| `CAP-ICCOFDPF` | PIC X(4) | Oficina del contrato financiero vinculado |
| `CAP-ICCD1PF` | PIC X(1) | Primer dígito verificador del contrato financiero |
| `CAP-ICCD2PF` | PIC X(1) | Segundo dígito verificador del contrato financiero |
| `CAP-ICCCTAPF` | PIC X(10) | Cuenta del producto financiero vinculado |

### 5.3 Fechas y vigencia

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICFALMOV` | PIC X(10) | Fecha de última actualización del registro |
| `CAP-ICFCONTR` | PIC X(10) | Fecha de origen de la relación contractual |
| `CAP-ICFECTE` | PIC X(10) | Fecha de inicio del seguro |
| `CAP-ICFDUR03` | S9(3) COMP-3 | Duración de la vigencia en meses |
| `CAP-ICFVENPO` | PIC X(10) | Vencimiento de la póliza actual |
| `CAP-ICFBAIXA` | PIC X(10) | Baja definitiva del seguro |
| `CAP-ICFANCON` | PIC X(10) | Cancelación/anulación con devolución |
| `CAP-ICFCOMUN` | PIC X(10) | Comunicación de contratación a la aseguradora |
| `CAP-ICFINIRE` | PIC X(10) | Fecha de la última cuota del cronograma |
| `CAP-ICFFINRE` | PIC X(10) | Fin del período de pago de la cuota |
| `CAP-ICFTRANS` | PIC X(10) | Envío de información a la aseguradora |
| `CAP-ICFEPRVTO` | PIC X(10) | Próximo vencimiento del seguro |
| `CAP-ICVENPREC` | PIC X(10) | Fin de vigencia del recibo |
| `CAP-ICFECOB` | PIC X(10) | Fecha de cobro del recibo |
| `CAP-ICFELIQ` | PIC X(10) | Fecha de liquidación a la aseguradora |
| `CAP-ICFECHA1` | PIC X(10) | Fecha contable de liquidación de contratos vinculados |
| `CAP-ICFECHA2` | PIC X(10) | Fecha contable de liquidación de seguros optativos |

### 5.4 Situación, cancelación y trazabilidad

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICYSITUA` | PIC X(2) | Situación actual del contrato; válido cuando es diferente de `00` |
| `CAP-ICCANULA` | PIC X(2) | Tipo de anulación/cancelación |
| `CAP-ICCOFFOR` | PIC X(4) | Oficina donde se contabiliza la operación |
| `CAP-ICESTADO` | PIC X(2) | Estado anterior de la póliza |
| `CAP-ICCODPOST` | PIC X(5) | Oficina anterior del contrato |
| `CAP-ICNTRXAR` | PIC X(8) | Transacción técnica que originó la operación |
| `CAP-ICCUSUAR` | PIC X(8) | Usuario que dio de alta o modificó el registro |
| `CAP-ICHTIULM` | PIC X(26) | Momento de última actualización |
| `CAP-ICCOFMOD` | PIC X(4) | Oficina de última modificación |

### 5.5 Descripciones y datos complementarios

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICDIREC1` | PIC X(50) | Información adicional del seguro |
| `CAP-ICECALLE1` | PIC X(25) | Detalle/proforma del seguro |
| `CAP-ICECALLE2` | PIC X(25) | Prima RIMAC, certificado u otro dato según producto |
| `CAP-ICDIREC2` | PIC X(30) | Número de póliza de broker, divisa u otro detalle |
| `CAP-ICDIREC3` | PIC X(8) | Identificador del cliente pagador |
| `CAP-ICPOBLACI` | PIC X(30) | Literal variable según producto/origen |
| `CAP-ICCODPAIS` | PIC X(4) | Cuotas pendientes tras reprogramación |
| `CAP-ICIDEDIRE2` | PIC X(3) | Indicador de proceso judicial |
| `CAP-ICPROVINCI` | PIC X(2) | Condonación o castigo |
| `CAP-ICDISTRITO` | PIC X(3) | Edad del cliente al alta |
| `CAP-ICPREFIJO` | PIC X(3) | Indicador de situación contenciosa |
| `CAP-ICNUMTELE` | PIC X(7) | Naturaleza o razón del cliente |
| `CAP-ICCLASE` | PIC X(2) | Tipo de cálculo del seguro |
| `CAP-ICMARCA` | PIC X(10) | Fecha de nacimiento del asegurado |
| `CAP-ICMODELO` | PIC X(10) | Identificador del movimiento de cobro |
| `CAP-ICMOTOR` | PIC X(20) | Motor del vehículo |
| `CAP-ICMATRI` | PIC X(10) | Porcentaje de prima respecto a suma asegurada |
| `CAP-ICUSO` | PIC X(1) | Indicador de emisión de tarjeta |
| `CAP-ICNUMASI` | S9(2)V COMP-3 | Número de asientos del vehículo |
| `CAP-ICPESO` | S9(3)V9(2) COMP-3 | Peso del cliente |
| `CAP-ICTALLA` | S9(3)V9(2) COMP-3 | Altura del cliente |
| `CAP-ICNROCIG` | S9(3)V9(2) COMP-3 | Recibos emitidos o dato histórico de cigarrillos |
| `CAP-ICCIOIDI` | PIC X(1) | Idioma de contacto |
| `CAP-ICCBEN01` | PIC X(2) | Tipo de beneficiario |
| `CAP-ICTDESCU` | PIC X(1) | Canal de cobro |
| `CAP-ICNUMCLIEN` | PIC X(8) | Cliente asegurado |
| `CAP-ICINDLIB1` | PIC X(1) | Tipo de referencia/beneficio del cliente |
| `CAP-ICINDLIB2` | PIC X(1) | Método de origen del contrato |
| `CAP-ICCAMPOLIB1` | PIC X(15) | Campo múltiple con gestor y presentador de venta |

### 5.6 Pagos, primas, importes y tasas

| Campo | Tipo físico | Descripción funcional |
|---|---|---|
| `CAP-ICTFOPAG` | PIC X(1) | Periodicidad de pago de la póliza |
| `CAP-ICIPRTOT` | S9(13)V9(2) COMP-3 | Prima periódica pagada por el cliente |
| `CAP-ICIPBASR` | S9(13)V9(2) COMP-3 | Prima a liquidar a la aseguradora |
| `CAP-ICIDTCIR` | S9(7)V9(2) COMP-3 | Comisión pagada por la aseguradora |
| `CAP-ICICLEAR` | S9(7)V9(2) COMP-3 | Factor de descuento de flujo |
| `CAP-ICIMPO1R` | S9(7)V9(2) COMP-3 | Tasa neta real del cliente para G&L |
| `CAP-ICIMPO2R` | S9(7)V9(2) COMP-3 | Tasa neta real de RIMAC para G&L |
| `CAP-ICICOMIS` | S9(5)V9(2) COMP-3 | Recargo de seguro de desgravamen |
| `CAP-ICIGAPEN` | S9(13)V9(2) COMP-3 | Importe asegurado máximo |
| `CAP-ICIRESCA` | S9(13)V9(2) COMP-3 | Código/concepto de descuento de desgravamen |
| `CAP-ICQPER01` | S9(3)V9(6) COMP-3 | Tipo de cambio oficial diario |
| `CAP-ICIPRSUC` | S9(13)V9(2) COMP-3 | Prima a cobrar en el próximo período |
| `CAP-ICACUIMPA` | S9(13)V9(2) COMP-3 | Deuda vencida de póliza |
| `CAP-ICINDEUPE` | PIC X(1) | Indicador de deuda vencida |
| `CAP-ICPLPEN` | S9(4)V COMP-3 | Cuotas pendientes de pago |
| `CAP-ICDIVISA` | PIC X(3) | Moneda ISO 4217 |
| `CAP-ICDIPAG` | PIC X(2) | Día de pago |
| `CAP-ICDIASCAL` | PIC X(1) | Tipo de calendario heredado de préstamos |
| `CAP-ICPERPRI` | PIC X(4) | Periodicidad del pago de capital |
| `CAP-ICCESTRE` | PIC X(2) | Estado del recibo |

## 6. Controles de calidad

1. Validar que la clave compuesta tenga exactamente 20 caracteres.
2. Reportar componentes nulos o con longitud inválida.
3. Detectar duplicados por clave antes del join.
4. Confirmar el formato real de cada fecha `PIC X(10)`.
5. Confirmar escala y signo al convertir todos los campos `COMP-3`.
6. Validar que `CAP-ICYSITUA` sea diferente de `00` cuando el registro se considere vigente.
7. Comparar `CAP-ICNUMPOL` con `POLICY_ID` solo como control de consistencia.
8. Mantener un catálogo explícito de homologación entre productos de ambas fuentes.
9. Medir porcentajes de match, no match y duplicidad en cada carga.

## 7. Salida recomendada para QuickSight

La capa preparada para el dashboard debería exponer, como mínimo:

- `CONTRACT_ID`
- `MATCH_ICDTCAP_IND`
- `POLICY_ID_MASTER`
- `POLICY_ID_ICDTCAP`
- `PRODUCT_ID_MASTER`
- `PRODUCT_ID_ICDTCAP`
- `SUBPRODUCT_ID`
- `MODALITY_ID`
- `CONTRACT_DATE_BANK`
- `INSURANCE_START_DATE`
- `INSURANCE_END_DATE`
- `COMMUNICATION_DATE`
- `TRANSFER_DATE`
- `BANK_SITUATION_TYPE`
- `BANK_PREVIOUS_STATUS_TYPE`
- `BANK_CUSTOMER_ID`
- `RIMAC_CONTRACT_STATUS_TYPE`
- `BANK_CONTRACT_STATUS_TYPE`
- `FORMALIZATION_GAP_IND`
- `PAYMENT_FREQUENCY_TYPE`
- `PREMIUM_AMOUNT`
- `SETTLEMENT_PREMIUM_AMOUNT`
- `CURRENCY_ID`
- `OVERDUE_DEBT_AMOUNT`
- `OVERDUE_DEBT_IND`
- `SOURCE_LAST_UPDATE_TIMESTAMP`

Este dataset debe mantener trazabilidad hacia ambas fuentes y permitir filtrar los contratos Banco `FOR` versus RIMAC `PEN` por producto, subproducto, modalidad y período.
