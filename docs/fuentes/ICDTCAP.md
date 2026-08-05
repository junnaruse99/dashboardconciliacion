# Diccionario de campos — ICDTCAP

Catálogo independiente de la fuente `ICDTCAP`, actualizado con las descripciones completas suministradas por negocio. La longitud lógica indica caracteres o dígitos definidos por el formato COBOL. Los campos `COMP-3` deben desempaquetarse antes de cargarse al dataset analítico.

| Campo | Descripción suministrada | Tipo físico | Longitud lógica |
|---|---|---|---:|
| `CAP-ICCENDIS` | Código que permite identificar de manera unívoca a la entidad financiera/Banco del Identificador Único del Contrato de seguros. Se refleja en el código del contrato. | `PIC X(4)` | 4 caracteres |
| `CAP-ICCOFDIS` | Código que permite identificar de manera unívoca la oficina con la que se realizó la contratación y que hace parte del código del contrato de seguros. | `PIC X(4)` | 4 caracteres |
| `CAP-ICCD1CTO` | Identificador del primer dígito de verificación de autenticidad del contrato de seguro que se tiene sobre un producto financiero. | `PIC X(1)` | 1 carácter |
| `CAP-ICCD2CTO` | Identificador del segundo dígito de verificación de autenticidad del contrato de seguro que se tiene sobre un producto financiero. | `PIC X(1)` | 1 carácter |
| `CAP-ICCCTACT` | Identificador de la cuenta del contrato del seguro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICCCYCIA` | Código que identifica la compañía operadora de seguros. | `PIC X(2)` | 2 caracteres |
| `CAP-ICCPRODC` | Código que permite identificar de manera unívoca el producto y que hace parte del código del contrato de seguros. | `PIC X(3)` | 3 caracteres |
| `CAP-ICCSUBPR` | Identificador del subproducto asociado al producto sobre el cual se realiza la contratación de un seguro ofrecido por el banco. | `PIC X(4)` | 4 caracteres |
| `CAP-ICCMOD01` | Código que permite identificar la modalidad del seguro. Se entiende por modalidad la cobertura específica dentro de un ramo de seguro. | `PIC X(2)` | 2 caracteres |
| `CAP-ICNUMPOL` | Identificador único de la póliza contratada por la persona con la Entidad. La póliza es el documento en el cual se plasma el contrato de seguro, las obligaciones y los derechos de la aseguradora y del asegurado. El número depende del tipo de póliza: para pólizas individuales es un secuencial asignado por el banco y para pólizas colectivas es un número fijo según el tipo de seguro generado por la aseguradora. | `S9(7) COMP-3` | 7 dígitos |
| `CAP-ICCENTPF` | Código que permite identificar de manera unívoca a la entidad financiera/Banco del Identificador Único del Contrato. Se refleja en el código del contrato vinculado al producto financiero. | `PIC X(4)` | 4 caracteres |
| `CAP-ICCOFDPF` | Código que permite identificar de manera unívoca la oficina con la que se realizó la contratación y que hace parte del código del contrato vinculado al producto financiero. | `PIC X(4)` | 4 caracteres |
| `CAP-ICCD1PF` | Identificador del primer dígito de verificación de autenticidad del contrato vinculado al producto financiero. | `PIC X(1)` | 1 carácter |
| `CAP-ICCD2PF` | Identificador del segundo dígito de verificación de autenticidad del contrato vinculado al producto financiero. | `PIC X(1)` | 1 carácter |
| `CAP-ICCCTAPF` | Código único e irrepetible de la cuenta bancaria más el código del producto del contrato vinculado al producto financiero. Este número garantiza que la operativa realizada se aplique exclusivamente a la cuenta señalada como destino u origen por el cliente. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFALMOV` | Fecha de la última actualización del registro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFCONTR` | Fecha en que se originó la relación contractual actual, es decir, la fecha en que el contrato se convirtió en vinculante para todas las partes. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFECTE` | Representa la fecha de inicio del seguro asociada con el contrato. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFDUR03` | Número de meses transcurridos entre la fecha de inicio y la fecha de fin de vigencia de una póliza de seguro. | `S9(3) COMP-3` | 3 dígitos |
| `CAP-ICFVENPO` | Fecha del vencimiento de la vigencia de la póliza actual del seguro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFBAIXA` | Fecha en la cual se realiza la baja definitiva del seguro. Para las bajas no hay devolución del dinero al cliente, ya que pueden haber pasado varios meses desde la afiliación. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFANCON` | Fecha de cancelación del seguro. La cancelación o anulación implica devolver el dinero al cliente y se puede realizar durante el primer mes de alta del seguro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFCOMUN` | Fecha en la que se comunica a la compañía aseguradora la contratación del seguro en el banco. | `PIC X(10)` | 10 caracteres |
| `CAP-ICYSITUA` | Tipo de situación o estado en el que se encuentra el contrato del seguro de un producto financiero. El registro es válido cuando la situación es diferente de `00`. | `PIC X(2)` | 2 caracteres |
| `CAP-ICCANULA` | Clave que identifica el tipo de anulación o cancelación de la póliza. | `PIC X(2)` | 2 caracteres |
| `CAP-ICCOFFOR` | Código identificativo de la oficina o sucursal en la cual se contabiliza la operación. | `PIC X(4)` | 4 caracteres |
| `CAP-ICDIREC1` | Descripción que contiene información adicional del seguro adquirido. | `PIC X(50)` | 50 caracteres |
| `CAP-ICECALLE1` | Descripción del detalle del seguro adquirido por el cliente; por ejemplo, el número de proforma asignado por el broker de seguros que solicita el alta. | `PIC X(25)` | 25 caracteres |
| `CAP-ICECALLE2` | Información adicional del seguro adquirido. Para Desgravamen almacena la prima de desempleo; para seguros optativos o del bien, la prima RIMAC; y para G&L, el certificado asignado por el broker que solicita el alta. | `PIC X(25)` | 25 caracteres |
| `CAP-ICDIREC2` | Detalle del seguro adquirido. Para G&L almacena el número de póliza asignado por el broker y para Retiro Seguro almacena la divisa con la que se da de alta el seguro. | `PIC X(30)` | 30 caracteres |
| `CAP-ICDIREC3` | Identificador del cliente generado por BBVA que funge como responsable de pagar el seguro. El pagador es quien paga la prima para cubrir un riesgo propio o de un tercero. | `PIC X(8)` | 8 caracteres |
| `CAP-ICPOBLACI` | Literal informativo cuyo significado depende del origen: tipo de cliente en productos optativos, cobertura Lima/provincia en productos vehiculares, marca de migración en desgravamen de tarjetas o blanco para productos vinculados. | `PIC X(30)` | 30 caracteres |
| `CAP-ICESTADO` | Código que identifica el estado anterior de la póliza. Los cambios pueden deberse a actualización de cuenta domiciliataria u oficina titular, actualización de primas pendientes, cancelación de préstamos o entrada del préstamo en situación contenciosa. | `PIC X(2)` | 2 caracteres |
| `CAP-ICCODPOST` | Guarda la oficina anterior del contrato; la modificación puede deberse a migraciones de oficinas. | `PIC X(5)` | 5 caracteres |
| `CAP-ICCODPAIS` | Número que indica la cantidad de cuotas pendientes después de la reprogramación. | `PIC X(4)` | 4 caracteres |
| `CAP-ICIDEDIRE2` | Indicador que especifica si el cliente se encuentra en una situación de proceso judicial. | `PIC X(3)` | 3 caracteres |
| `CAP-ICPROVINCI` | Marca que indica si el seguro se encuentra en condonación o castigo. | `PIC X(2)` | 2 caracteres |
| `CAP-ICDISTRITO` | Edad del cliente al momento de dar de alta el contrato. | `PIC X(3)` | 3 caracteres |
| `CAP-ICPREFIJO` | Indica si el contrato está en situación contenciosa, es decir, en disputa entre las partes firmantes. | `PIC X(3)` | 3 caracteres |
| `CAP-ICNUMTELE` | Código que especifica la naturaleza o razón del cliente. Puede tomar valores como `F00`, `F01`, `M00`, `M01` u otros. | `PIC X(7)` | 7 caracteres |
| `CAP-ICCLASE` | Código que identifica el tipo de cálculo utilizado para obtener el valor del seguro. | `PIC X(2)` | 2 caracteres |
| `CAP-ICMARCA` | Fecha de nacimiento del asegurado. | `PIC X(10)` | 10 caracteres |
| `CAP-ICMODELO` | Identificador del movimiento registrado correspondiente al cobro del seguro, el cual puede darse en tarjeta, cuenta u otros medios. | `PIC X(10)` | 10 caracteres |
| `CAP-ICMOTOR` | Código identificativo del motor del vehículo. | `PIC X(20)` | 20 caracteres |
| `CAP-ICMATRI` | Porcentaje del importe de la prima respecto a la suma asegurada. | `PIC X(10)` | 10 caracteres |
| `CAP-ICUSO` | Indicador que muestra si se ha emitido la tarjeta al cliente. | `PIC X(1)` | 1 carácter |
| `CAP-ICNUMASI` | Número de asientos del vehículo. | `S9(2)V COMP-3` | 2 dígitos |
| `CAP-ICPESO` | Peso del cliente expresado en kilogramos; solo se utiliza para el producto 800. | `S9(3)V9(2) COMP-3` | 5 dígitos, 2 decimales |
| `CAP-ICTALLA` | Altura del cliente expresada en centímetros; solo se utiliza para el producto 800. | `S9(3)V9(2) COMP-3` | 5 dígitos, 2 decimales |
| `CAP-ICNROCIG` | Número de recibos emitidos para productos G&L. Históricamente, para productos 800, 806, 810 y 811 almacenaba la cantidad diaria de cigarrillos consumidos por el cliente. | `S9(3)V9(2) COMP-3` | 5 dígitos, 2 decimales |
| `CAP-ICCIOIDI` | Código de idioma según norma ISO en el que el cliente desea ser contactado. | `PIC X(1)` | 1 carácter |
| `CAP-ICTFOPAG` | Código que identifica la periodicidad con la que se realiza el pago de la póliza. | `PIC X(1)` | 1 carácter |
| `CAP-ICIPRTOT` | Cuantía que debe pagar periódicamente el cliente a la entidad financiera por la cobertura del seguro contratado, expresada en moneda de origen. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICIPBASR` | Prima a cobrar por liquidar a la compañía. En Perú, cuando la vigencia es indefinida corresponde a la prima facturada; en caso contrario, al remanente de la prima total. Expresada en moneda de origen. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICIDTCIR` | Comisión que paga la compañía de seguros a la banca comercial y otros canales por venta, cancelación o renovación de la póliza, expresada en moneda de origen. Aplica a seguros asociados a un bien. | `S9(7)V9(2) COMP-3` | 9 dígitos, 2 decimales |
| `CAP-ICICLEAR` | Factor de descuento utilizado para calcular el valor presente del flujo de efectivo. | `S9(7)V9(2) COMP-3` | 9 dígitos, 2 decimales |
| `CAP-ICIMPO1R` | Porcentaje para calcular la prima neta: tasa neta real aplicada al cliente. Solo se utiliza para productos G&L 201, 250, 251, 252, 254 y 255. | `S9(7)V9(2) COMP-3` | 9 dígitos, 2 decimales |
| `CAP-ICIMPO2R` | Porcentaje para calcular la prima neta para la aseguradora: tasa neta real aplicada para RIMAC. Solo se utiliza para productos G&L 201, 250, 251, 252, 254 y 255. | `S9(7)V9(2) COMP-3` | 9 dígitos, 2 decimales |
| `CAP-ICICOMIS` | Porcentaje de recargo del seguro de desgravamen aplicado sobre su precio base; el valor lo define la compañía aseguradora. | `S9(5)V9(2) COMP-3` | 7 dígitos, 2 decimales |
| `CAP-ICFINIRE` | Fecha de la última cuota especificada en el cronograma de pagos. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFFINRE` | Fecha de finalización del período de pago de la cuota. | `PIC X(10)` | 10 caracteres |
| `CAP-ICIGAPEN` | Importe asegurado que figura en el contrato y representa la cantidad máxima que debe pagar el asegurador en caso de siniestro. Expresado en moneda de origen. No incluye seguros G&L. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICIRESCA` | Número de código del concepto o tipo de descuento aplicable al seguro de desgravamen. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICCESTRE` | Indicador utilizado para reflejar el estado en el que se encuentra el recibo. | `PIC X(2)` | 2 caracteres |
| `CAP-ICCBEN01` | Código que identifica el tipo de beneficiario; por ejemplo, beneficiarios, declaratoria de herederos, testamento o Banco Continental. | `PIC X(2)` | 2 caracteres |
| `CAP-ICTDESCU` | Codificación interna que identifica unívocamente el canal con el que la Entidad realiza el cobro a un cliente. | `PIC X(1)` | 1 carácter |
| `CAP-ICQPER01` | Tipo de cambio diario oficial publicado por los bancos centrales y usado como referencia en operaciones de mercados de divisas. | `S9(3)V9(6) COMP-3` | 9 dígitos, 6 decimales |
| `CAP-ICIPRSUC` | Prima a cobrar en el próximo período. Depende de la periodicidad pactada con el cliente y está expresada en moneda de origen. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICNTRXAR` | Código interno que identifica unívocamente una transacción técnica que permite ejecutar operativa bancaria. Puede corresponder a una transacción de consulta, operativa o contratación, financiera o no financiera. | `PIC X(8)` | 8 caracteres |
| `CAP-ICCUSUAR` | Código que identifica al usuario que da de alta o modifica la información. | `PIC X(8)` | 8 caracteres |
| `CAP-ICHTIULM` | Momento en el que se actualiza algún dato del registro. Solo se informa la fecha. | `PIC X(26)` | 26 caracteres |
| `CAP-ICCOFMOD` | Código de la sucursal u oficina que realizó la última modificación del registro. | `PIC X(4)` | 4 caracteres |
| `CAP-ICFTRANS` | Fecha en la que se envía la información de la póliza o contrato de seguros a la compañía aseguradora. | `PIC X(10)` | 10 caracteres |
| `CAP-ICDIVISA` | Código alfanumérico de tres posiciones que clasifica la moneda según ISO 4217; por ejemplo, EUR, ARS, COP o CAD. | `PIC X(3)` | 3 caracteres |
| `CAP-ICDIPAG` | Código que indica el día en el que se hace efectiva, mediante pago, una obligación pecuniaria. | `PIC X(2)` | 2 caracteres |
| `CAP-ICACUIMPA` | Deuda vencida pendiente de pago de la póliza a la fecha del contrato. Incluye el total de primas impagadas y se expresa en moneda de origen. | `S9(13)V9(2) COMP-3` | 15 dígitos, 2 decimales |
| `CAP-ICINDEUPE` | Indicador que especifica si existe deuda vencida pendiente de pago de la póliza a la fecha del contrato. | `PIC X(1)` | 1 carácter |
| `CAP-ICDIASCAL` | Tipo de calendario heredado de préstamos. Se usa para calcular el próximo fin de vigencia, por ejemplo, en seguros vinculados a un préstamo. | `PIC X(1)` | 1 carácter |
| `CAP-ICPERPRI` | Marca utilizada para identificar la periodicidad con la que se produce el pago del capital de un contrato. | `PIC X(4)` | 4 caracteres |
| `CAP-ICFEPRVTO` | Fecha del próximo vencimiento del seguro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICVENPREC` | Fecha de fin de vigencia del recibo. | `PIC X(10)` | 10 caracteres |
| `CAP-ICPLPEN` | Cantidad de cuotas pendientes de pago por el cliente hasta el momento actual. | `S9(4)V COMP-3` | 4 dígitos |
| `CAP-ICFECOB` | Fecha en la que se realiza el cobro del recibo del seguro. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFELIQ` | Fecha en la que se liquida a la compañía aseguradora. | `PIC X(10)` | 10 caracteres |
| `CAP-ICNUMCLIEN` | Identificador del cliente generado por la Entidad y que figura como asegurado en la póliza. El asegurado es la persona susceptible de sufrir un siniestro o propietaria de bienes asegurables. | `PIC X(8)` | 8 caracteres |
| `CAP-ICFECHA1` | Fecha contable en la que se realiza la liquidación de contratos vinculados, es decir, asociados a productos financieros propios del banco. | `PIC X(10)` | 10 caracteres |
| `CAP-ICFECHA2` | Fecha contable en la que se realiza la liquidación de contratos de seguro opcionales u optativos ofrecidos por el banco de otras aseguradoras. | `PIC X(10)` | 10 caracteres |
| `CAP-ICINDLIB1` | Tipo de referencia del cliente e indicador del tipo de beneficio. Corresponde a situaciones donde una persona natural asegura a otra o una empresa asegura a sus empleados. | `PIC X(1)` | 1 carácter |
| `CAP-ICINDLIB2` | Determina el tipo de método utilizado para el origen del contrato. | `PIC X(1)` | 1 carácter |
| `CAP-ICCAMPOLIB1` | Campo de múltiples definiciones que se desagrega en campos calculados. Contiene información del gestor y del presentador de la venta de seguros. | `PIC X(15)` | 15 caracteres |

## Uso actual en Alta

El detalle utiliza `CAP-ICFECTE`, `CAP-ICCMOD01`, `CAP-ICTFOPAG`, `CAP-ICIPRTOT` y `CAP-ICDIVISA`. La clave de cruce se forma con `CAP-ICCENDIS`, `CAP-ICCOFDIS`, `CAP-ICCD1CTO`, `CAP-ICCD2CTO` y `CAP-ICCCTACT`.

## Observaciones físicas

- El formato real de los campos fecha `PIC X(10)` debe validarse con una muestra de la fuente.
- La columna de longitud muestra precisión lógica. El almacenamiento físico de `COMP-3` ocupa bytes empaquetados y debe decodificarse antes del análisis.
