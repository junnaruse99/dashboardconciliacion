# Diccionario de campos — ICDTCAN

Fuente `t_pisd_dly_mov_insc_cncl_info`, identificada como `icdtcan` en el catálogo recibido.

> `ICDTCAN.csv` se creó como plantilla sin registros porque aún no se proporcionó un archivo de ejemplo. Los nombres de encabezado conservan los nombres físicos recibidos en minúsculas. Las longitudes de los campos `string` no fueron informadas y no se inventan.

| Pos. | Campo ICDTCAN | Campo destino | Nombre funcional | Tipo | Longitud | Descripción |
|---:|---|---|---|---|---|---|
| 1 | `can_iccendis` | `insurance_contract_entity_id` | IDENTIFICADOR ENTIDAD CONTRATO SEGUROS | `string` | No informada | Identifica unívocamente la entidad financiera/Banco del contrato de seguros. |
| 2 | `can_iccofdis` | `insurance_contract_branch_id` | IDENTIFICADOR SUCURSAL CONTRATO SEGUROS | `string` | No informada | Identifica la oficina con la que se realizó la contratación. |
| 3 | `can_iccd1cto` | `insrnc_contract_first_verdgi_id` | IDENTIFICADOR PRIMER DIGITO DE VERIFICACION CONTRATO SEGURO | `string` | No informada | Primer dígito de verificación de autenticidad del contrato. |
| 4 | `can_iccd2cto` | `insrnc_contract_second_verdgi_id` | IDENTIFICADOR SEGUNDO DIGITO DE VERIFICACION CONTRATO SEGURO | `string` | No informada | Segundo dígito de verificación de autenticidad del contrato. |
| 5 | `can_iccctact` | `insrc_contract_int_account_id` | IDENTIFICADOR DE CUENTA INTERNA DEL CONTRATO DE SEGURO | `string` | No informada | Cuenta interna del contrato de seguro. |
| 6 | `can_iccodmov` | `canc_mov_id` | IDENTIFICADOR MOVIMIENTO DE CANCELACION | `string` | No informada | Código del tipo de movimiento anulador. |
| 7 | `can_iccodcan` | `unsub_reason_id` | IDENTIFICADOR DE MOTIVO DE CANCELACION | `string` | No informada | Motivo de la baja. |
| 8 | `can_icbaspen` | `pending_collect_amount` | IMPORTE PENDIENTE COBRO | `decimal(23,10)` | 23,10 | Importe pendiente de cobro. |
| 9 | `can_icbasimp` | `loan_balance_amount` | IMPORTE PENDIENTE PAGO | `decimal(23,10)` | 23,10 | Importe pendiente de pago al banco por préstamos. |
| 10 | `can_icobserva` | `insurance_ctrct_cncl_cmpltry_data_desc` | DESCRIPCION DATOS COMPLEMENTARIOS DE LA CANCELACION DEL CONTRATO DE SEGURO | `string` | No informada | Datos complementarios del movimiento de cancelación. |
| 11 | `can_icfeccan` | `plcy_cert_cncl_regis_rl_date` | FECHA REAL BAJA REGISTRO CERTIFICADO POLIZA | `date` | Fecha | Fecha real de baja del registro del certificado dentro de la póliza. |
| 12 | `can_icindret` | `insurance_ctrct_cncl_reversion_ind_type` | INDICADOR DE REVERSION DE LA CANCELACION DEL CONTRATO DE SEGURO | `string` | No informada | Indica si se realizó la reversión de la cancelación. |
| 13 | `can_centro_can` | `insurance_contract_cancellation_br_id` | IDENTIFICADOR DE SUCURSAL DE CANCELACION DEL CONTRATO DE SEGURO | `string` | No informada | Sucursal que realizó la cancelación. |
| 14 | `can_netname_can` | `register_terminal_id` | IDENTIFICADOR TERMINAL DE REGISTRO | `string` | No informada | Terminal desde la cual se registró el evento. |
| 15 | `can_userid_can` | `origin_manager_user_id` | IDENTIFICADOR USUARIO GESTOR ORIGINADOR | `string` | No informada | Usuario gestor de originación. |
| 16 | `can_trxar_can` | `transaction_id` | IDENTIFICADOR OPERACION-TRANSACCION | `string` | No informada | Identificador único de la transacción técnica. |
| 17 | `can_timestamp_can` | `register_date` | FECHA DE REGISTRO | `timestamp` | No informada | Fecha en la cual se realizó el registro. |
| 18 | `can_centro_umo` | `last_modify_branch_id` | IDENTIFICADOR SUCURSAL ULTIMA MODIFICACION | `string` | No informada | Sucursal que realizó la última modificación. |
| 19 | `can_netname_umo` | `modification_terminal_id` | IDENTIFICADOR ORDENADOR ULTIMA MODIFICACION | `string` | No informada | Terminal donde se realizó la última modificación. |
| 20 | `can_userid_umo` | `modification_user_id` | IDENTIFICADOR USUARIO ULTIMA MODIFICACION | `string` | No informada | Usuario de la última modificación. |
| 21 | `can_trxar_umo` | `update_transaction_id` | IDENTIFICADOR DE TRANSACCION QUE ACTUALIZA | `string` | No informada | Transacción que realizó la actualización. |
| 22 | `can_timestamp_umo` | `modification_date` | FECHA DE MODIFICACION | `timestamp` | No informada | Fecha en la cual se realizó la modificación. |
| 23 | Calculado | `contract_id` | IDENTIFICADOR UNICO CONTRATO | `string` | No informada | Codificación interna que identifica unívocamente un contrato. |
| 24 | Calculado | `cutoff_date` | FECHA DE CIERRE | `date` | Fecha | Fecha a la que se refiere la información del objeto. |
| 25 | Calculado | `audtiminsert_date` | FECHA INSERCION REGISTRO | `timestamp` | No informada | Momento de inserción de datos a máximo detalle. |

## Clave y uso previsto

- La clave contractual se forma con `can_iccendis` + `can_iccofdis` + `can_iccd1cto` + `can_iccd2cto` + `can_iccctact`, tratándolos como texto y preservando ceros iniciales.
- Para el detalle de Cancelación, `can_iccodmov` representa el tipo de cancelación y `can_iccodcan` el motivo de cancelación.
- La fuente puede aportar el movimiento, motivo, fecha real de baja y reversión de una cancelación.
- `can_icbaspen` es importe pendiente de cobro y `can_icbasimp` es saldo pendiente de préstamo. Ninguno está definido como importe devuelto; no deben etiquetarse ni agregarse como devolución.
- No existe todavía una regla aprobada que determine su granularidad técnica, deduplicación, relación con conciliaciones ni precedencia frente a `ICDTCAP.CAP-ICFBAIXA` y `CAP-ICFANCON`.

## Pendientes de negocio

1. Entregar una extracción con registros de ejemplo.
2. Confirmar la clave técnica de un movimiento de cancelación y el tratamiento de reversiones.
3. Confirmar si `can_icfeccan` sustituye o complementa las fechas de cancelación de ICDTCAP para los KPI y detalle.
4. Informar las longitudes de los campos `string`.
5. Informar el campo y la regla de negocio para el importe efectivamente devuelto al cliente.
