# Diccionario de campos — ICDTLIT

Tabla de literales de seguros, publicada como `t_ppad_insurance_literal` para el ámbito `434`.

> La especificación suministrada no informa tipo físico ni longitud. Se conservan pendientes y no se inventan.

| Pos. | Campo ICDTLIT | Campo destino | Nombre funcional | Tipo | Longitud | Descripción |
|---:|---|---|---|---|---|---|
| 1 | `ICCCYCIA` | `insurance_company_id` | IDENTIFICADOR EMPRESA SEGUROS | No informado | No informada | Identificador de la empresa de seguros. |
| 2 | `ICCLITER` | `insurance_literal_id` | IDENTIFICADOR DE LITERAL DE SEGUROS | No informado | No informada | Identificador del literal de seguros. |
| 3 | `ICCIOIDI` | `language_id` | IDENTIFICADOR LENGUAJE | No informado | No informada | Identificador del idioma del literal. |
| 4 | `ICLITER1` | `literal_desc` | DESCRIPCION DEL LITERAL | No informado | No informada | Descripción corta del literal. |
| 5 | `ICNTRXAR` | `transaction_id` | IDENTIFICADOR OPERACION-TRANSACCION | No informado | No informada | Identificador de la operación o transacción. |
| 6 | `ICCUSUAR` | `user_audit_id` | IDENTIFICADOR USUARIO AUDITORIA | No informado | No informada | Identificador del usuario de auditoría. |
| 7 | `ICHTIULM` | `audit_date` | FECHA DE AUDITORIA | No informado | No informada | Fecha y hora de auditoría. |
| 8 | `ICCOFMOD` | `last_change_branch_id` | IDENTIFICADOR SUCURSAL ULTIMA MODIFICACION | No informado | No informada | Oficina de la última modificación. |
| 9 | `ICDESLAR` | `literal_long_desc` | DESCRIPCION LARGA DEL LITERAL | No informado | No informada | Descripción extendida del literal. |
| 10 | `ICESTADO` | `insured_status_type` | TIPO DE ESTADO DEL ASEGURADO | No informado | No informada | Tipo de estado del asegurado. |
| 11 | `ICCAMBIT` | `location_type` | TIPO DE UBICACION | No informado | No informada | Tipo de ubicación del literal. |

## Reglas de uso para nombres de producto y modalidad

- ICDTLIT es la fuente autorizada de nombres legibles; ICDTCAP y las fuentes Oracle conservan los códigos.
- Toda búsqueda de literal debe restringirse por `ICCCYCIA` (compañía), `ICCLITER` (literal) e `ICCIOIDI` (idioma).
- El nombre visible debe tomar `ICLITER1`; `ICDESLAR` se conserva como descripción extendida cuando sea necesario.
- Literal de producto: `ICCLITER = 'P' + CAP-ICCPRODC + '1'`.
- Literal de modalidad: `ICCLITER = CAP-ICCPRODC + CAP-ICCMOD01`.
- El catálogo se generará localmente a partir de los mapeos de negocio suministrados; no se debe inferir una descripción para códigos no mapeados.

## Mapeo temporal de demostración

El archivo `ICDTLIT.csv` de este repositorio es sintético y solo habilita pruebas del join mientras se recibe el catálogo real. Usa compañía `01` e idioma `ES` y no debe promoverse a producción.

Para evitar una asignación directa desde los códigos de prueba de CAP, el motor asigna un producto por contrato usando una selección determinista ponderada. Los pesos corresponden a la distribución suministrada por negocio: `845: 771`, `850: 885`, `842: 3099`, `840: 2781`, `832: 3251`, `833: 2316`, `830: 14252`, `834: 6971`, `843: 208`, `841: 2284` y `836: 1421`.

La asignación toma un hash estable del identificador contractual, por lo que no cambia entre ejecuciones y converge a esos pesos cuando aumenta el volumen.

Para las modalidades, se usa una convención ingenua y temporal: dentro de cada producto, el primer nombre suministrado corresponde a `01`, el segundo a `02` y así sucesivamente. Los nombres repetidos conservan códigos distintos. Esta secuencia no representa una regla de negocio confirmada y debe sustituirse cuando se disponga del catálogo real código-modalidad.

## Pendientes de negocio

1. Entregar el catálogo real que sustituirá la asignación sintética ponderada.
2. Entregar el mapeo real de modalidad: producto, código de modalidad, descripción corta y descripción larga.
3. Confirmar el idioma `ICCIOIDI` que debe cargarse al generar el catálogo.
4. Informar tipos físicos y longitudes de los campos.
