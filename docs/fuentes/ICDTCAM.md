# Diccionario de campos — ICDTCAM

Tabla de movimientos de seguros, publicada como `t_pmol_insurance_movements` para el ámbito `432`.

> La especificación recibida no informa la longitud de los campos `string`. Tampoco informa el nombre físico ICDTCAM de las posiciones 6, 17, 32, 33 y 39. Las posiciones 94 y 95 son calculadas. Estos datos se conservan como pendientes y no se inventan.

| Pos. | Campo ICDTCAM | Campo destino | Nombre funcional | Tipo | Longitud | Descripción |
|---:|---|---|---|---|---|---|
| 1 | `ICCENDIS` | `contract_entity_id` | IDENTIFICADOR ENTIDAD CONTRATO | `string` | No informada | Código unívoco de la entidad financiera del identificador del contrato. |
| 2 | `ICCOFDIS` | `contract_branch_id` | IDENTIFICADOR SUCURSAL CONTRATO | `string` | No informada | Código de la oficina con la que se realizó la contratación. |
| 3 | `ICCD1CTO` | `contract_cntl_digit1_type` | CODIGO DIGITO 1 DE CONTROL DEL CONTRATO | `string` | No informada | Primer dígito de control del contrato. |
| 4 | `ICCD2CTO` | `contract_cntl_digit2_type` | CODIGO DIGITO DE CONTROL 2 DE LA CUENTA DE PRESTAMO | `string` | No informada | Segundo dígito de control del contrato o cuenta relacionada. |
| 5 | `ICCCTACT` | `contract_id` | IDENTIFICADOR UNICO CONTRATO | `string` | No informada | Codificación interna que identifica unívocamente el contrato. |
| 6 | Pendiente de informar | `insurance_contract_id` | SEGURO CONTRATO ID | `string` | No informada | Código interno del contrato de seguros; en pólizas colectivas agrupa pólizas o certificados. |
| 7 | `ICCCYCIA` | `insurance_company_id` | IDENTIFICADOR EMPRESA SEGUROS | `string` | No informada | Código de la compañía operadora de seguros. |
| 8 | `ICCPRODC` | `policy_product_type` | TIPO DE PRODUCTO DE LA POLIZA | `string` | No informada | Código del producto al que pertenece la póliza. |
| 9 | `ICCSUBPR` | `policy_subproduct_type` | TIPO DE SUBPRODUCTO DE LA POLIZA | `string` | No informada | Código del subproducto al que pertenece la póliza. |
| 10 | `ICCMOD01` | `insurance_modality_type` | CODIGO DE LA MODALIDAD DEL SEGURO | `string` | No informada | Código de la modalidad o cobertura específica del seguro. |
| 11 | `ICNUMPOL` | `policy_id` | IDENTIFICADOR NUMERO DE POLIZA | `string` | No informada | Identificador único de la póliza contratada. |
| 12 | `ICNUMOVI` | `policy_movement_number` | NUMERO DE MOVIMIENTO DE LA POLIZA | `int64` | 64 bits | Número secuencial del movimiento de la póliza en el periodo. |
| 13 | `ICCENTPF` | `loan_account_entity_id` | IDENTIFICADOR ENTIDAD DE LA CUENTA DEL PRESTAMO | `string` | No informada | Entidad financiera de la cuenta del préstamo asociado. |
| 14 | `ICCOFDPF` | `loan_account_branch_id` | IDENTIFICADOR SUCURSAL DE LA CUENTA DE PRESTAMO | `string` | No informada | Oficina de la cuenta del préstamo asociado. |
| 15 | `ICCD1PF` | `loan_account_cntl_digit1_type` | CODIGO DIGITO DE CONTROL 1 DE LA CUENTA DE PRESTAMO | `string` | No informada | Primer dígito de control de la cuenta del préstamo. |
| 16 | `ICCD2PF` | `loan_account_cntl_digit2_type` | CODIGO DIGITO DE CONTROL 2 DE LA CUENTA DE PRESTAMO | `string` | No informada | Segundo dígito de control de la cuenta del préstamo. |
| 17 | Pendiente de informar | `loan_contract_id` | IDENTIFICADOR CONTRATO PRESTAMO | `string` | No informada | Identificador del préstamo asociado al seguro de riesgo. |
| 18 | `ICCCTAPF` | `loan_account_id` | IDENTIFICADOR CUENTA DEL PRESTAMO | `string` | No informada | Cuenta relacionada con el préstamo u obligación. |
| 19 | `ICFALMOV` | `last_change_date` | FECHA ULTIMA MODIFICACION | `date` | Fecha | Fecha en que se registra un cambio en la información. |
| 20 | `ICFCONTR` | `gl_account_date` | FECHA CONTABLE | `date` | Fecha | Fecha en que la entidad contabiliza el movimiento. |
| 21 | `ICFECTE` | `start_date` | FECHA DE ALTA | `date` | Fecha | Fecha de inicio o alta del contrato, servicio, pago o producto. |
| 22 | `ICFDUR03` | `contract_duration_number` | NUMERO PLAZO CONTRATO | `int32` | 32 bits | Número de periodos de duración del contrato. |
| 23 | `ICFVENPO` | `policy_end_date` | FECHA FIN POLIZA | `date` | Fecha | Fecha de vencimiento de la vigencia de la póliza. |
| 24 | `ICFBAIXA` | `end_date` | FECHA DE BAJA | `date` | Fecha | Fecha en que finaliza o se da de baja el contrato o producto. |
| 25 | `ICFANCON` | `policy_cancellation_date` | FECHA DE CANCELACION DE LA POLIZA | `date` | Fecha | Fecha en que se produce la cancelación de la póliza. |
| 26 | `ICFCOMUN` | `receipt_sent_date` | FECHA DE ENVIO DE RECIBO | `date` | Fecha | Fecha de envío del recibo por la trama diaria. |
| 27 | `ICCENTDM` | `account_entity_id` | IDENTIFICADOR ENTIDAD FINANCIERA DE LA CUENTA | `string` | No informada | Entidad financiera de la cuenta. |
| 28 | `ICCOFIDM` | `account_branch_id` | IDENTIFICADOR SUCURSAL BANCARIA DE LA CUENTA | `string` | No informada | Oficina a la que pertenece la cuenta. |
| 29 | `ICCD1DM` | `linked_account_cntl_digit1_type` | CODIGO DIGITO CONTROL 1 CUENTA VINCULADA | `string` | No informada | Primer dígito de control de la cuenta vinculada. |
| 30 | `ICCD2DM` | `linked_account_cntl_digit2_type` | CODIGO DIGITO CONTROL 2 CUENTA VINCULADA | `string` | No informada | Segundo dígito de control de la cuenta vinculada. |
| 31 | `ICNCTADM` | `account_id` | IDENTIFICADOR DE LA CUENTA | `string` | No informada | Identificador único de la cuenta bancaria. |
| 32 | Pendiente de informar | `account_id` | IDENTIFICADOR DE LA CUENTA | `string` | No informada | Segundo origen no identificado para el mismo campo lógico `account_id`. |
| 33 | Pendiente de informar | `direct_debit_contract_id` | IDENTIFICADOR CUENTA BANCARIA DOMICILIACION | `string` | No informada | Identificador de la cuenta en la que se domicilia el producto. |
| 34 | `ICCENTCG` | `guarantee_contract_entity_id` | IDENTIFICADOR ENTIDAD DE LA GARANTIA DEL CONTRATO | `string` | No informada | Entidad asociada a la garantía del seguro. |
| 35 | `ICCOFICG` | `guarantee_contract_branch_id` | IDENTIFICADOR SUCURSAL CONTRATO GARANTIA | `string` | No informada | Oficina de contratación asociada a la garantía. |
| 36 | `ICCD1CG` | `guarantee_acct_cntl_digit1_type` | CODIGO DIGITO DE CONTROL 1 DE LA GARANTIA | `string` | No informada | Primer dígito de control de la garantía o cuenta domiciliada. |
| 37 | `ICCD2CG` | `guarantee_acct_cntl_digit2_type` | CODIGO DIGITO DE CONTROL 2 DE LA GARANTIA | `string` | No informada | Segundo dígito de control de la garantía o cuenta domiciliada. |
| 38 | `ICNCTACG` | `guarantee_account_id` | IDENTIFICADOR DE CUENTA ASOCIADA A LA GARANTIA | `string` | No informada | Cuenta de garantía o cuenta domiciliada asociada al contrato. |
| 39 | Pendiente de informar | `auto_debit_contract_id` | IDENTIFICADOR AUTOMATICO CONTRATO DEBITO | `string` | No informada | Identificador automático del contrato de débito declarado para el cobro. |
| 40 | `ICYOPERA` | `movement_type` | TIPO MOVIMIENTO | `string` | No informada | Tipo de movimiento realizado. |
| 41 | `ICCANULA` | `canceled_policy_type` | TIPO DE CAUSA DE CANCELACION DE LA POLIZA | `string` | No informada | Causa de cancelación de la póliza. |
| 42 | `ICCOFFOR` | `manager_branch_id` | IDENTIFICADOR SUCURSAL GESTORA | `string` | No informada | Oficina o centro en que se realizan gestiones y formalizaciones. |
| 43 | `ICDIREC1` | `atm_withdraw_insurance_oper_id` | IDENTIFICADOR OPERACION PARA SEGURO DE RETIRO POR CAJERO | `string` | No informada | Clave de operación por cajero para el seguro de retiro. |
| 44 | `ICECALLE1` | `debit_account_id` | IDENTIFICADOR CUENTA DE CARGO | `string` | No informada | Cuenta en la que se efectúan los cargos. |
| 45 | `ICECALLE2` | `premium_amount` | IMPORTE PRIMA DEL SEGURO | `decimal(23,10)` | 23,10 | Prima periódica pagada por el cliente. |
| 46 | `ICDIREC2` | `additional_data_desc` | DESCRIPCION INFORMACION ADICIONAL | `string` | No informada | Información adicional del movimiento o transacción. |
| 47 | `ICDIREC3` | `insured_id` | IDENTIFICADOR DEL ASEGURADO | `string` | No informada | Identificador único del asegurado. |
| 48 | `ICAPPTO` | `insured_2_id` | IDENTIFICADOR DE CLIENTE DEL SEGUNDO ASEGURADO DE LA POLIZA | `string` | No informada | Identificador del segundo asegurado. |
| 49 | `ICPOBLACI` | `charge_note_reference_id` | IDENTIFICADOR REFERENCIA DE NOTA DE CARGO | `string` | No informada | Referencia de la nota de cargo del cobro realizado. |
| 50 | `ICESTADO` | `contract_previous_situation_type` | TIPO SITUACION ANTERIOR DEL CONTRATO | `string` | No informada | Situación anterior del contrato ante cancelación anticipada o extorno. |
| 51 | `ICCODPOST` | `contract_previous_branch_id` | IDENTIFICADOR DE SUCURSAL ANTERIOR DEL CONTRATO | `string` | No informada | Oficina anterior del contrato. |
| 52 | `ICCODPAIS` | `prev_pend_bill_rcpts_number` | NUMERO DE RECIBOS PENDIENTE DE FACTURAR | `string` | No informada | Cantidad anterior de recibos pendientes de facturar. |
| 53 | `ICIDEDIRE1` | `lse_and_gntee_insrnc_credit_type` | TIPO DE CREDITO DE SEGUROS Y LEASING | `string` | No informada | Tipo de crédito que originó el movimiento de garantía o leasing. |
| 54 | `ICIDEDIRE2` | `debit_channel_type` | TIPO DE CANAL DEL CARGO | `string` | No informada | Canal por el que se realiza el cobro. |
| 55 | `ICPROVINCI` | `writeoff_payment_mark_type` | INDICADOR DE PAGO POR CONDONACION | `string` | No informada | Indica si el pago corresponde a condonación o castigo. |
| 56 | `ICDISTRITO` | `holder_age_number` | NUMERO EDAD DEL TITULAR | `string` | No informada | Edad del cliente titular. |
| 57 | `ICPREFIJO` | `ctrct_dispute_status_type` | INDICADOR DE DISPUTA DEL CONTRATO | `string` | No informada | Indica si el contrato está en situación contenciosa. |
| 58 | `ICNUMTELE` | `other_information_desc` | DESCRIPCION OTRA INFORMACION | `string` | No informada | Observaciones y comentarios adicionales. |
| 59 | `ICCLASE` | `insurance_calculation_type` | TIPO CALCULO DEL VALOR DEL SEGURO | `string` | No informada | Tipo de cálculo utilizado para obtener el valor del seguro. |
| 60 | `ICMARCA` | `birth_date` | FECHA NACIMIENTO | `date` | Fecha | Fecha de nacimiento de la persona. |
| 61 | `ICMODELO` | `premium_charge_operation_id` | IDENTIFICADOR DE OPERACION DEL CARGO DE LA PRIMA | `string` | No informada | Operación del cargo de prima en cuenta o tarjeta. |
| 62 | `ICANNIO` | `contract_manag_branch_id` | IDENTIFICADOR SUCURSAL GESTORA CONTRATO | `string` | No informada | Oficina que realiza gestiones sobre el contrato. |
| 63 | `ICMOTOR` | `linked_contract_id` | IDENTIFICADOR DE CONTRATO VINCULADO | `string` | No informada | Identificador del contrato vinculado. |
| 64 | `ICMATRI` | `premium_rate_amount` | IMPORTE TASA DE PRIMA | `decimal(23,10)` | 23,10 | Importe de la tasa de prima. |
| 65 | `ICNUMASI` | `leasing_receipts_number` | NUMERO DE RECIBOS PARA EL SEGURO DE LEASING | `int32` | 32 bits | Número de recibos para seguros de garantías y leasing. |
| 66 | `ICVALORV` | `leasing_insured_amount` | IMPORTE ASEGURADO DE LEASING | `decimal(23,10)` | 23,10 | Suma asegurada de garantías y leasing. |
| 67 | `ICCIOIDI` | `language_id` | IDENTIFICADOR LENGUAJE | `string` | No informada | Código ISO del idioma. |
| 68 | `ICTFOPAG` | `payment_method_type` | INDICADOR METODO DE PAGO | `string` | No informada | Forma en que el cliente realiza el pago. |
| 69 | `ICIPRTOT` | `invoiced_premium_amount` | IMPORTE FACTURADO PRIMA | `decimal(23,10)` | 23,10 | Importe facturado de la prima. |
| 70 | `ICIPBASR` | `settle_pending_premium_amount` | IMPORTE POR LIQUIDAR DE LA PRIMA A LA COMPANIIA ASEGURADORA | `decimal(23,10)` | 23,10 | Prima pendiente de liquidar a la aseguradora. |
| 71 | `ICIBOMBR` | `deferred_quota_amount` | IMPORTE DE CUOTA DIFERIDA | `decimal(23,10)` | 23,10 | Importe de la cuota diferida o cuota balón. |
| 72 | `ICICLEAR` | `discount_by_premium_adj_amount` | IMPORTE O VALOR DE DESCUENTO POR AJUSTE DE PRIMA | `decimal(23,10)` | 23,10 | Descuento aplicado por ajuste de prima. |
| 73 | `ICFINIRE` | `receipt_start_date` | FECHA INICIO RECIBO | `date` | Fecha | Inicio de vigencia del recibo. |
| 74 | `ICFFINRE` | `receipt_end_date` | FECHA FIN RECIBO | `date` | Fecha | Fin de vigencia del recibo. |
| 75 | `ICCESTRE` | `receipt_status_type` | INDICADOR SITUACION DEL RECIBO | `string` | No informada | Estado del recibo, por ejemplo cargado, devuelto o rechazado. |
| 76 | `ICCBEN01` | `beneficiary_type` | TIPO DE BENEFICIARIO | `string` | No informada | Tipo de beneficiario de la póliza. |
| 77 | `ICLOCUPA` | `noleasing_secndy_exch_amount` | IMPORTE TIPO DE CAMBIO SECUNDARIO NO LEASING | `decimal(23,10)` | 23,10 | Tipo de cambio secundario para cobros no leasing. |
| 78 | `ICTDESCU` | `collection_method_type` | INDICADOR FORMA DE COBRO | `string` | No informada | Canal o forma de cobro al cliente. |
| 79 | `ICQPER01` | `premium_currency_exchange_amount` | IMPORTE TIPO DE CAMBIO DE LA PRIMA | `decimal(23,10)` | 23,10 | Tipo de cambio usado para convertir la prima. |
| 80 | `ICNTRXAR` | `transaction_id` | IDENTIFICADOR OPERACION-TRANSACCION | `string` | No informada | Identificador único de la transacción técnica. |
| 81 | `ICCUSUAR` | `user_audit_id` | IDENTIFICADOR USUARIO AUDITORIA | `string` | No informada | Usuario o proceso que insertó o modificó el registro. |
| 82 | `ICHTIULM` | `audit_date` | FECHA DE AUDITORIA | `timestamp_millis` | Milisegundos | Momento de inserción o modificación del registro. |
| 83 | `ICCOFMOD` | `last_change_branch_id` | IDENTIFICADOR SUCURSAL ULTIMA MODIFICACION | `string` | No informada | Oficina que realizó la última modificación. |
| 84 | `ICFTRANS` | `receipts_transmission_date` | FECHA DE TRANSMISION DEL RECIBO | `date` | Fecha | Fecha de transmisión de recibos a la aseguradora. |
| 85 | `ICDIVISA` | `currency_id` | IDENTIFICADOR DIVISA | `string` | No informada | Código de moneda conforme a ISO 4217. |
| 86 | `ICINDPECO` | `receipt_collection_status_type` | INDICADOR DE SITUACION DE COBRO DE RECIBO | `string` | No informada | Estado del cobro del recibo: total, parcial, pendiente u otro. |
| 87 | `ICSECURET` | `withholding_id` | IDENTIFICADOR DE RETENCION | `string` | No informada | Retención generada cuando no existe saldo para el cargo. |
| 88 | `ICPRREC` | `charged_net_amount` | IMPORTE NETO COBRADO | `decimal(23,10)` | 23,10 | Importe neto efectivamente cobrado. |
| 89 | `ICFELIQ` | `settlement_date` | FECHA LIQUIDACION | `date` | Fecha | Fecha de liquidación pactada. |
| 90 | `ICFECOB` | `collection_date` | FECHA DE COBRO | `date` | Fecha | Fecha en que se registra el movimiento de cobro al cliente. |
| 91 | `ICNUMINT` | `charge_attempts_number` | NUMERO DE INTENTOS DE COBRO | `int32` | 32 bits | Número de intentos realizados para efectuar el cobro. |
| 92 | `ICINDLIB1` | `rcpts_migrt_clct_ind_type` | NETNAME-ALTA | `string` | No informada | Indicador de cobro para recibos migrados de garantías y leasing. |
| 93 | `ICINDLIB2` | `rcpts_migrt_fees_pymt_ind_type` | INDICADOR DE PAGO DE COMISIONES PARA RECIBOS MIGRADOS | `string` | No informada | Indicador de pago de comisiones para recibos migrados. |
| 94 | Calculado | `cutoff_date` | FECHA DE CIERRE | `date` | Fecha | Fecha a la que hace referencia la información del objeto. |
| 95 | Calculado | `audtiminsert_date` | FECHA INSERCION REGISTRO | `timestamp_millis` | Milisegundos | Momento de inserción del registro al máximo detalle. |

## Claves y granularidad

- La granularidad declarada es **movimiento de seguro/póliza**, identificada funcionalmente por contrato y `ICNUMOVI`.
- El identificador completo del contrato se construye con `ICCENDIS` + `ICCOFDIS` + `ICCD1CTO` + `ICCD2CTO` + `ICCCTACT`, tratando todos los componentes como texto.
- `ICFECOB` es la fecha real del cobro; `ICPRREC` es el importe neto cobrado y `ICINDPECO` representa su situación.
- A diferencia de ICDTCAP, esta fuente no debe deduplicarse a un registro por contrato: deben conservarse sus movimientos.

## Uso actual en Cobranza

- `ICFECOB` es la fuente de verdad de la fecha real de cobro. El valor por defecto `01-01-01` se interpreta como no cobrado.
- `ICFELIQ` identifica la fecha en que corresponde intentar el cobro del recibo.
- `ICNUMINT` indica cuántas veces se intentó cobrar el recibo; un valor mayor que cero confirma que hubo al menos un intento.
- Los recibos intentados hoy son aquellos con `ICFELIQ` igual a hoy e `ICNUMINT` mayor que cero.
- La efectividad diaria divide los recibos intentados hoy que tienen `ICFECOB` igual a hoy entre todos los recibos intentados hoy.
- `ICPRREC` e `ICINDPECO` se cargan como importe neto y estado del cobro, aunque todavía no forman una tarjeta KPI.

## Pendientes de negocio

1. Informar el nombre físico ICDTCAM de las posiciones 6, 17, 32, 33 y 39.
2. Confirmar si la posición 32 es una segunda fuente de `account_id` o un duplicado documental.
3. Informar las longitudes de todos los campos `string`.
4. Confirmar la clave técnica única cuando un contrato pueda tener movimientos repetidos con el mismo `ICNUMOVI`.
