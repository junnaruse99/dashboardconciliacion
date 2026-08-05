# Diccionario de campos — MAESTRA_CONTRATOS

Fuente independiente de la pestaña **Alta**. Este archivo conserva el catálogo suministrado por negocio.

| Campo | Descripción | Tipo | Longitud |
|---|---|---|---:|
| `INSURANCE_CONTRACT_ENTITY_ID` | Código que permite identificar de manera unívoca a la entidad financiera/Banco del Identificador Único del Contrato de seguros. Se refleja en el código del contrato. | `VARCHAR2(4)` | 4 |
| `INSURANCE_CONTRACT_BRANCH_ID` | Código que permite identificar de manera unívoca la oficina con la que se realizó la contratación y que hace parte del código del contrato de seguros. | `VARCHAR2(4)` | 4 |
| `INSRC_CONTRACT_INT_ACCOUNT_ID` | Identificador que corresponde a la cuenta interna del contrato de seguro. | `VARCHAR2(10)` | 10 |
| `CONTRACT_FIRST_VERFN_DIGIT_ID` | Identificador del primer dígito de verificación de autenticidad del contrato vinculado al producto financiero. | `VARCHAR2(1)` | 1 |
| `CONTRACT_SECOND_VERFN_DIGIT_ID` | Identificador del segundo dígito de verificación de autenticidad del contrato vinculado al producto financiero. | `VARCHAR2(1)` | 1 |
| `POLICY_QUOTA_INTERNAL_ID` | Identificador interno de cotización que se pudo realizar en la compra de la póliza. Este campo llave sirve para relacionar con tablas alternas al modelo de datos de cotizaciones. | `VARCHAR2(20)` | 20 |
| `INSURANCE_PRODUCT_ID` | Código que identifica el alias del tipo de producto de seguro contratado por el cliente que viene definido por el negocio. | `NUMBER(4)` | 4 dígitos |
| `POLICY_ID` | Identificador único de la póliza contratada por la persona con la Entidad. El documento plasma el contrato de seguro, las obligaciones y derechos de la aseguradora y del asegurado, así como las personas, objetos o instrumentos asegurados, indemnizaciones y garantías. Proviene de PIC. | `VARCHAR2(10)` | 10 |
| `CUSTOMER_ID` | Codificación interna de la Entidad para la identificación unívoca de cada cliente. | `VARCHAR2(8)` | 8 |
| `ENDORSEMENT_POLICY_IND_TYPE` | Indicador que determina si la póliza se encuentra endosada. | `VARCHAR2(1)` | 1 |
| `INSRNC_CO_CONTRACT_STATUS_TYPE` | Código utilizado para reflejar el estado en el que se encuentra el contrato de la compañía aseguradora. | `VARCHAR2(3)` | 3 |
| `CONTRACT_STATUS_ID` | Código identificativo utilizado para indicar el estado comercial en el que se encuentra el contrato del cliente con la Entidad. | `VARCHAR2(3)` | 3 |
| `CREATION_USER_ID` | Código del usuario que realizó la creación del movimiento. | `VARCHAR2(8)` | 8 |
| `CREATION_DATE` | Fecha y hora en la que se realizó la creación del registro en el aplicativo. | `DATE` | Fecha Oracle |
| `DATA_TREATMENT_IND_TYPE` | Indicador que determina si aplica el tratamiento de datos. | `VARCHAR2(1)` | 1 |
| `CONTRACT_ACCEPTANCE_IND_TYPE` | Indicador que determina si hay aceptación del contrato. | `VARCHAR2(1)` | 1 |
| `CONTRACT_NON_CNCL_IND_TYPE` | Indicador que determina si el contrato no puede ser cancelado. | `VARCHAR2(1)` | 1 |
| `CONTRACT_RENEWAL_STATUS_TYPE` | Código correspondiente al estado de la renovación del contrato. | `VARCHAR2(3)` | 3 |
| `CONTRACT_RENEWAL_SENDING_DATE` | Fecha correspondiente al envío de la renovación del contrato. | `DATE` | Fecha Oracle |
| `CONTRACT_RENEWAL_RECEIPT_DATE` | Fecha correspondiente a la recepción de la renovación del contrato. | `DATE` | Fecha Oracle |
| `POLICY_DISCOUNT_COUPON_ID` | Identificador del cupón de descuento en la póliza; puede otorgarse en una campaña de promoción o al realizar la cotización. | `VARCHAR2(20)` | 20 |
| `ORIGINAL_PAYMENT_SUBCHANNEL_ID` | Identificador del subcanal. | `VARCHAR2(6)` | 6 |
| `AVAILABLE_INV_FUND_AMOUNT` | Monto del aporte al fondo de inversión. | `NUMBER(18,6)` | 18 dígitos, 6 decimales |
| `PREFORMALIZATION_CHANNEL_ID` | Identificador que corresponde al canal de preformalización. | `VARCHAR2(3)` | 3 |
| `PREFORMALIZATION_SUBCHANNEL_ID` | Identificador que corresponde al subcanal de preformalización. | `VARCHAR2(6)` | 6 |
| `PAYMENT_METHOD_NAME` | Nombre del modo utilizado para identificar la forma en la que un cliente realiza un pago a la Entidad; por ejemplo, efectivo, tarjeta, cheque u otros. | `VARCHAR2(60)` | 60 |
| `CROSS_SELL_ID` | Código de operación de venta cruzada. Identifica la operación financiera que dio origen o se ejecutó antes de contratar el seguro y permite determinar si el contrato se realizó mediante venta cruzada. | `NUMBER(9)` | 9 dígitos |
| `PULVERIZED_INSURANCE_IND_TYPE` | Indicador que determina si el seguro será pulverizado, entendido como cambiar su periodicidad de anual a mensual. | `VARCHAR2(3)` | 3 |
| `PREMIUM_PULVERIZATION_REJ_CUST_IND_TYPE` | Indicador que determina si el cliente rechazó la pulverización de la prima, es decir, convertir un contrato anual en pagos mensuales. | `VARCHAR2(3)` | 3 |
| `PULVERIZATION_PROC_AVLB_FUND_AC_IND_TYPE` | Indicador que determina si la cuenta tiene fondos disponibles para iniciar el proceso de pulverización. | `VARCHAR2(3)` | 3 |
| `RATE_CURRENT_PRFTBLY_PER` | Porcentaje correspondiente a la tasa de rentabilidad actual. | `NUMBER(9,6)` | 9 dígitos, 6 decimales |
| `TIME_PERIOD_NUMBER` | Número de plazo del horizonte de inversión para productos de seguro con componente de inversión, como Renta Garantizada o Vida Inversión. | `NUMBER(4)` | 4 dígitos |
| `PERIOD_TYPE` | Código de tipo de plazo del horizonte de inversión para productos de seguro con componente de inversión. | `VARCHAR2(3)` | 3 |
| `GROSS_PROJECTED_PROFITABILITY_AMOUNT` | Importe correspondiente a la rentabilidad bruta proyectada para productos de seguro con componente de inversión, como Renta Garantizada o Vida Inversión. | `NUMBER(18,6)` | 18 dígitos, 6 decimales |
| `SOURCE_PLATFORM_TYPE` | Identificador del sistema operacional en el que se realiza la gestión de la póliza. | `VARCHAR2(8)` | 8 |

## Uso actual en Alta

- `CREATION_DATE` es la fecha de alta o creación, no la fecha de inicio del seguro.
- El identificador completo se forma con entidad + oficina + primer verificador + segundo verificador + cuenta interna.
- El cruce con `ICDTCAP` es un `LEFT JOIN` por esos cinco componentes normalizados como texto.
