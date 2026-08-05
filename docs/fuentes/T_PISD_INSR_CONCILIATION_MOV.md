# Diccionario de campos — T_PISD_INSR_CONCILIATION_MOV

Tabla de movimientos asociados a las conciliaciones. Los tipos, longitudes y restricciones corresponden a la definición suministrada. Las descripciones funcionales se conservaron según el uso acordado para el dashboard.

| Campo | Descripción | Tipo | Longitud | Nulabilidad |
|---|---|---|---:|---|
| `OPER_SEQ_MOV_ID` | Identificador secuencial único del movimiento. | `NUMBER(6)` | 6 dígitos | No nulo |
| `CONCILIATION_SEQUENTIAL_ID` | Identificador de la conciliación maestra a la que pertenece el movimiento. | `NUMBER(9)` | 9 dígitos | No nulo |
| `SOURCE_PROCESS_TYPE` | Código del proceso de origen: `CAN`, `REN` o `INV`. | `VARCHAR2(3)` | 3 | No nulo |
| `PAYMENT_AMOUNT` | Importe pagado informado por el movimiento. Solo se utiliza para Cobranza (`INV`). | `NUMBER(17,2)` | 17 dígitos, 2 decimales | Nulo permitido |
| `OPERATED_AMOUNT` | Importe efectivamente operado. Solo se utiliza para Cobranza (`INV`). | `NUMBER(17,2)` | 17 dígitos, 2 decimales | Nulo permitido |
| `INPUT_FILE_NAME` | Nombre del archivo de entrada del que se obtuvo el movimiento. | `VARCHAR2(60)` | 60 | Nulo permitido |
| `ERROR_CODE_ID` | Código del error o diferencia asociado al movimiento. | `VARCHAR2(20)` | 20 | No nulo |
| `ERROR_CODE_DESC` | Descripción funcional del error asociado al movimiento. | `VARCHAR2(254)` | 254 | Nulo permitido |
| `ORIGINAL_MOV_DETAIL_DESC` | Detalle original del movimiento recibido desde la fuente. | `VARCHAR2(254)` | 254 | Nulo permitido |
| `CONCILIATION_DESC` | Descripción del resultado, comentario o tratamiento de la conciliación. | `VARCHAR2(254)` | 254 | Nulo permitido |
| `CREATION_USER_ID` | Identificador del usuario o proceso que creó el movimiento. | `VARCHAR2(8)` | 8 | Nulo permitido |
| `CREATION_DATE` | Fecha y hora de creación del movimiento. | `TIMESTAMP(6)` | Fracción de 6 dígitos | Nulo permitido |
| `USER_AUDIT_ID` | Identificador del usuario o proceso de la última auditoría/modificación. | `VARCHAR2(8)` | 8 | No nulo |
| `AUDIT_DATE` | Fecha y hora de la última auditoría o modificación. | `TIMESTAMP(6)` | Fracción de 6 dígitos | No nulo |

## Reglas de uso

- La relación con la maestra se realiza exclusivamente mediante `CONCILIATION_SEQUENTIAL_ID`.
- La cardinalidad esperada es 1:N desde conciliación hacia movimientos.
- `PAYMENT_AMOUNT` y `OPERATED_AMOUNT` se agregan antes de mostrarse a nivel de conciliación.
- Los importes se muestran únicamente para `INV`; se ignoran para `CAN` y `REN`.
