# Diccionario de campos — T_PISD_INSURANCE_CONCILIATION

Tabla maestra de conciliaciones. Los tipos, longitudes y restricciones corresponden a la definición suministrada. Las descripciones funcionales se conservaron según el uso acordado para el dashboard.

| Campo | Descripción | Tipo | Longitud | Nulabilidad |
|---|---|---|---:|---|
| `CONCILIATION_SEQUENTIAL_ID` | Identificador secuencial único de la conciliación y clave para relacionarla con sus movimientos. | `NUMBER(6)` | 6 dígitos | No nulo |
| `INSURANCE_CONTRACT_ENTITY_ID` | Código de la entidad financiera del contrato de seguro. | `VARCHAR2(4)` | 4 | No nulo |
| `INSURANCE_CONTRACT_BRANCH_ID` | Código de la oficina o sucursal asociada al contrato. | `VARCHAR2(4)` | 4 | No nulo |
| `INSRC_CONTRACT_INT_ACCOUNT_ID` | Cuenta interna del contrato de seguro. Se conserva en origen, pero no se muestra ni exporta en conciliaciones. | `VARCHAR2(10)` | 10 | No nulo |
| `POLICY_ID` | Identificador de la póliza. Para el dashboard debe contener entre 1 y 10 dígitos numéricos. | `VARCHAR2(10)` | 10 | Nulo permitido |
| `POLICY_RECEIPT_ID` | Identificador del recibo de la póliza. | `NUMBER(4)` | 4 dígitos | No nulo |
| `SOURCE_PROCESS_TYPE` | Código del proceso de origen de la conciliación: `CAN`, `REN` o `INV`. | `VARCHAR2(3)` | 3 | No nulo |
| `ERROR_CODE_ID` | Código del error o diferencia detectada durante la conciliación. | `VARCHAR2(20)` | 20 | No nulo |
| `ERROR_CODE_DESC` | Descripción funcional del error o diferencia detectada. | `VARCHAR2(254)` | 254 | Nulo permitido |
| `CONCILIATION_STATUS_TYPE` | Estado de la conciliación: `PEN` para pendiente o `SOL` para solucionada. | `VARCHAR2(3)` | 3 | No nulo |
| `CREATION_USER_ID` | Identificador del usuario o proceso que creó el registro. | `VARCHAR2(8)` | 8 | Nulo permitido |
| `CREATION_DATE` | Fecha y hora de creación de la conciliación. | `TIMESTAMP(6)` | Fracción de 6 dígitos | Nulo permitido |
| `USER_AUDIT_ID` | Identificador del usuario o proceso de la última auditoría/modificación. | `VARCHAR2(8)` | 8 | No nulo |
| `AUDIT_DATE` | Fecha y hora de la última auditoría o modificación. | `TIMESTAMP(6)` | Fracción de 6 dígitos | No nulo |

## Relación

`T_PISD_INSURANCE_CONCILIATION.CONCILIATION_SEQUENTIAL_ID` (1) → `T_PISD_INSR_CONCILIATION_MOV.CONCILIATION_SEQUENTIAL_ID` (N).
