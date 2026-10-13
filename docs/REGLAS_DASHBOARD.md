# Reglas Canónicas del Dashboard

Este documento es la fuente única de reglas funcionales y de datos del dashboard.

## 1. Uso obligatorio

- Antes de implementar cualquier cambio, revisar este documento completo.
- Si una solicitud nueva contradice una regla existente, no asumir: registrar la contradicción y confirmar con negocio.
- Si una regla no está aquí, agregarla en la sección 10 con fecha y contexto.

## 2. Alcance funcional

- El dashboard tiene cinco vistas: Overview, Alta, Cancelación, Renovación y Cobranza.
- La secuencia visual por proceso es obligatoria: filtros, KPIs, gráficos y tabla.
- En Cobranza no se muestra un corte fijo del día/mes; las métricas generales responden a los filtros activos.
- En Renovación y Cancelación no se muestra un corte fijo del día/mes; sus métricas generales responden al contexto indicado en cada visual.

## 3. Fuentes y relaciones

### 3.1 Fuentes principales

- T_PISD_INSURANCE_CONCILIATION.csv.
- T_PISD_INSR_CONCILIATION_MOV.csv.
- MAESTRA_CONTRATOS.csv.
- ICDTCAP.csv.
- ICDTCAM.csv.
- ICDTCAN.csv.
- ICDTLIT.

### 3.2 Reglas de relación

- Conciliación y movimientos se relacionan solo por CONCILIATION_SEQUENTIAL_ID con cardinalidad 1:N.
- Alta no participa en el cruce de conciliaciones y movimientos.
- ICDTLIT es la fuente de nombres legibles de producto y modalidad. El cruce de un literal requiere compañía (`ICCCYCIA`), literal (`ICCLITER`) e idioma (`ICCIOIDI`).
- Para ICDTCAP, el literal de producto es `'P' + CAP-ICCPRODC + '1'` y el literal de modalidad es `CAP-ICCPRODC + CAP-ICCMOD01`.
- ICDTCAN aporta movimientos de cancelación mediante la clave contractual entidad + oficina + dos dígitos verificadores + cuenta interna. Hasta recibir registros y reglas de precedencia, no reemplaza las fechas de baja o anulación de ICDTCAP.
- No inferir la descripción de producto o modalidad para códigos que no estén en el mapeo de negocio; se requiere confirmar el idioma que se debe mostrar.
- El `ICDTLIT.csv` local puede usar una asignación sintética ponderada por contrato solo para demostración. Sus descripciones, pesos y equivalencias no son reglas de negocio ni se pueden promover a producción.
- Para las modalidades del catálogo sintético, el orden recibido por producto se asigna ingenuamente a códigos consecutivos desde `01`. Esta convención es solo temporal.
- El identificador completo de contrato es:
  - entidad + oficina + dígito verificador 1 + dígito verificador 2 + cuenta interna.
- No usar póliza como clave de cruce técnico.

### 3.3 Reglas de calidad de fuentes

- Mantener un diccionario independiente por fuente en docs/fuentes.
- No inventar nombres físicos, tipos, longitudes o semánticas faltantes.
- Mantener compatibilidad con encabezados CSV Oracle documentados.

## 4. Catálogos y valores válidos

- Procesos válidos: CAN, REN, INV.
- Estados de conciliación válidos: PEN, SOL.
- Estados contractuales válidos: ANU, BAJ, ERR, FOR, PEN, INC.
- Códigos de error admitidos:
  - CAN_FILE_NOT_SENT
  - CAN_DUPLICATE_RESP
  - CAN_UNEXPECTED_ERR
  - CAN_CONCILIATION
  - PRE_NOTFOUND_ERR
  - PRE_AUT_NOTFOUND_ERR
  - REN_NOTFOUND_ERR
  - REN_AUT_NOTFOUND_ERR
  - INV_RIMAC_NOT_SENT
  - INV_RIMAC_NOT_CHAR

## 5. Reglas por proceso

### 5.0 Overview

- Overview se presenta en dos secciones numeradas después de los filtros:
  - **Métricas generales:** volúmenes de Alta, Cancelación, Renovadas y Cobranza. No mostrar el gráfico de conciliaciones por producto.
  - **Conciliación:** conciliaciones creadas como primer KPI, seguidas de abiertas, cerradas, porcentaje cerrado, ANS, evolución de incidencias, estado actual, backlog por proceso y tabla de detalle.
- En el escenario demostrativo, las métricas generales muestran 76 altas del año actual, 4,892 cancelaciones, 3 renovadas y 177 recibos cobrados.
- En la tabla y exportación de Overview mostrar el número completo de contrato inmediatamente después del ID de conciliación; obtenerlo del contrato enriquecido y no exponer la cuenta interna por separado.

### 5.1 Alta

- Alta se presenta como una única sección numerada de **Métricas generales de alta**; no contiene una sección de conciliación.
- Mantener la secuencia dentro de esta vista: filtros, KPI del período seleccionado, gráficos de altas y tabla de detalle. La sección usa la misma jerarquía visual y estructura compacta de los demás procesos.
- No mostrar un corte operativo independiente ni KPI de altas de hoy o del mes; las métricas generales de Alta responden al período seleccionado.
- CREATION_DATE es fecha de alta/creación.
- INSURANCE_PRODUCT_ID es tipo de producto.
- CAP-ICFECTE es inicio del seguro (no fecha de alta).
- Mostrar modalidad CAP-ICCMOD01 y frecuencia CAP-ICTFOPAG.
- Mostrar prima CAP-ICIPRTOT y moneda CAP-ICDIVISA.
- Mostrar debajo de Cantidad de altas la suma de `CAP-ICIPRTOT` del contexto filtrado en PEN y USD, y debajo de Pendientes RIMAC los mismos importes restringidos al estado `PEN`; no convertir ni mezclar monedas.
- No mostrar el gráfico de altas diarias por producto.
- No mostrar evolución de formalización o de altas formalizadas por período mientras no exista un campo que registre la fecha real de formalización en RIMAC. No usar `CREATION_DATE` como sustituto.
- Los gráficos generales de Alta muestran resultado actual de formalización y desempeño por canal y producto, inspirados en la referencia `images/Altas - General.png` y limitados a campos aprobados.
- El backlog PEN es histórico; los demás indicadores responden al rango.

### 5.2 Cancelación

- Para cancelados, usar CONTRACT_STATUS_ID del banco:
  - BAJ con CAP-ICFBAIXA.
  - ANU con CAP-ICFANCON.
- En detalle de Cancelación:
  - Póliza desde MAESTRA_CONTRATOS.
  - Producto desde MAESTRA_CONTRATOS.
  - Modalidad desde ICDTCAP CAP-ICCMOD01.
  - Tipo de cancelación desde ICDTCAN `can_iccodmov` y motivo desde `can_iccodcan`, cuando la fuente contenga registros.
  - No usar `can_icbaspen` ni `can_icbasimp` como importe devuelto: son importe pendiente de cobro y saldo pendiente de préstamo, respectivamente.
  - No usar POLICY_ID de conciliación.

### 5.3 Renovación

- CAP-ICFVENPO es fin de vigencia y fecha base operativa.
- CAP-ICFECTE se mantiene solo como inicio de cobertura.
- Mostrar lenguaje de negocio:
  - Confirmación de renovación.
  - Recibos enviados por RIMAC.
  - Fin de vigencia.
  - Días para regularizar.
- No mostrar al usuario etiquetas técnicas D-50, D-45, D0.
- Renovación efectiva:
  - CONTRACT_RENEWAL_STATUS_TYPE = REN.
- Estados permitidos de renovación: `ENV`, `NRE`, `REN`, `PRN`, `PRE`, `RZD` y `PNR`.
  - `REN` identifica una renovación efectiva, `NRE` un rechazo explícito de RIMAC y `RZD` un rechazo del cliente.
- Para el funnel de Renovación:
  - Base: contratos activos del período (excluye BAJ, ANU y ERR).
  - Cuadratura PRE: Confirmadas + No enviadas (`PRE_NOTFOUND_ERR`, `PRE_AUT_NOTFOUND_ERR`) + Rechazadas (`NRE`) = Total previsto.
  - No enviadas PRE se desglosan en automática (`PRE_AUT_NOTFOUND_ERR`) y no automática (`PRE_NOTFOUND_ERR`).
  - Todas las pendientes automáticas PRE pasan a “Por renovar con información pendiente”; no se dividen en “Aún no corresponde”.
  - Etapa recibos en confirmadas: enviadas (`PRN`), falta enviar (`PRE` y aplica D-45) y aún no corresponde (antes de D-45).
  - La urgencia se presenta en dos gráficos: PRE agrupa las confirmaciones pendientes no automáticas y automáticas; REN agrupa la falta de información de RIMAC y la información pendiente automática de las pólizas en renovación.
  - El gráfico PRE usa rojo oscuro para pendientes no automáticas y ámbar para pendientes automáticas. El gráfico REN usa azul para falta de información de RIMAC y verde para información pendiente automática. Las series se apilan por rango de urgencia y las etiquetas de composición conservan esos colores.
  - Vehicular es el único producto sin renovación automática; no mostrar una gráfica comparativa de productos con fallas de renovación.
  - Completada del día: `REN` con fecha de inicio `CAP-ICFECTE = hoy`.
  - No completada a tiempo: vigencia vencida, sin `REN` y con incidencia PRE/REN abierta.
  - Rechazada por RIMAC: estado `NRE`.
  - Rechazada por cliente: estado `RZD`.
- Clasificación de incidencias:
  - PRE_NOTFOUND_ERR y PRE_AUT_NOTFOUND_ERR: confirmación pendiente.
  - REN_NOTFOUND_ERR y REN_AUT_NOTFOUND_ERR: recibos pendientes.
- PEN significa información faltante abierta.
- SOL significa información recibida posteriormente.
- No equiparar SOL con archivo exitoso.
- Para este MVP, tratar `NRE` como rechazo explícito de renovación por RIMAC.
- Las métricas generales de Renovación se separan en dos lecturas:
  - **Cómo vamos:** usa el mismo universo de pólizas de la conciliación seleccionada. La confirmación previa suma aceptadas y aceptadas en automático; por renovar suma las aceptadas con información pendiente, las listas para renovar y las pendientes automáticas; el peligro de no renovación suma la falta de información de RIMAC y las pendientes no automáticas.
  - **Cómo me fue:** contratos cuya fecha `CAP-ICFVENPO` ya se alcanzó. Las no renovadas se clasifican sin solapamientos y en este orden: `NRE` como decisión de RIMAC; incidencia PRE o recibos abierta como información tardía; el remanente como decisión del cliente. Las tres causas deben sumar el total de no renovadas.
- La decisión de no renovación del cliente se identifica mediante el estado `RZD`.
- En detalle de Renovación:
  - Póliza y producto desde MAESTRA_CONTRATOS.
  - Modalidad desde CAP-ICCMOD01.
  - Mostrar días restantes hacia CAP-ICFVENPO.

### 5.4 Cobranza

- Organizar la vista en dos secciones numeradas:
  - **Métricas generales de cobranza:** contiene únicamente el resultado de los filtros.
  - **Conciliación con RIMAC:** contiene los KPI de conciliación, la antigüedad de pendientes y la tabla de detalle.
- Importes se muestran solo en INV, con dos decimales.
- PAYMENT_AMOUNT y OPERATED_AMOUNT pertenecen a movimientos; agregarlos antes de mostrar a nivel conciliación.
- Los KPIs y detalle de recibos se calculan directamente desde ICDTCAM, a grano de recibo/movimiento; no se consolida ICDTCAM a una fila por contrato ni se publica una tercera tabla física.
- En Cobranza, el filtro temporal aplica `ICFELIQ` como fecha operativa de los recibos por facturar e `ICFECOB` para los recibos cobrados; producto, frecuencia y modalidad se obtienen desde `contract_master` mediante la clave contractual.
- Las métricas generales presentan únicamente: recibos a facturar, recibos facturados, recibos cobrados y tasa de cobranza. No mostrar la tarjeta de recibos no cobrados ni un flujo de cobranza independiente.
- En el escenario demostrativo completo deben cuadrar 223 recibos a facturar, 180 facturados y 177 cobrados. La tasa de cobranza es `177 / 223 × 100 = 79,4 %`.
- El estado facturado de los 180 recibos es demostrativo hasta que negocio confirme el campo físico que lo identifica; no promover esta clasificación a producción sin esa definición.
- Las métricas generales incluyen monto a facturar, monto cobrado y porcentaje cobrado por moneda. Soles y USD se muestran simultáneamente dentro de cada caja, sin selector de moneda. Para la maqueta, ambos importes usan un importe unitario consistente para que el porcentaje monetario cuadre con `177 / 223`.
- La evolución muestra por fecha los recibos por facturar, facturados y cobrados. La tabla por producto ordena por mayor volumen de recibos a facturar, conserva los cinco productos principales y agrupa el resto en `Otros`.
- El importe facturado por recibo usa `ICDTCAM.ICIPRTOT`; el importe neto efectivamente cobrado usa `ICDTCAM.ICPRREC`.
- Los recibos cobrados del resultado filtrado usan ICDTCAM ICFECOB.
- ICFECOB con valor 01-01-01 se interpreta como no cobrado.
- INV_RIMAC_NOT_SENT en PEN: cobro automático realizado no informado por RIMAC.
- INV_RIMAC_NOT_CHAR en PEN: no cobrado y no informado por RIMAC.
- Los KPI de Conciliación con RIMAC se organizan en dos filas y reemplazan los KPI anteriores:
  - Primera fila: recibos facturados en automático, recibos no conciliados y recibos conciliados. En el escenario demostrativo son 100, 20 y 80, respectivamente; no conciliados más conciliados debe ser igual al total facturado en automático.
  - Segunda fila: recibos a facturar, recibos no facturados y monto no facturado. En el escenario completo son 223 recibos a facturar, 43 no facturados y S/ 13.760,00 pendientes; el monto muestra Soles y USD, uno debajo del otro, dentro de la misma caja.
- La clasificación entre conciliado y no conciliado de estos 100 recibos es demostrativa hasta que negocio confirme el campo físico productivo.
- En Conciliación con RIMAC no mostrar el gráfico mensual de evolución de incidencias. Reemplazarlo por dos gráficos de barras horizontales:
  - Antigüedad de recibos no conciliados; sus bandas deben sumar el KPI de no conciliados.
  - Antigüedad de recibos no facturados; sus bandas deben sumar el KPI de no facturados.
- Las bandas de antigüedad son mutuamente excluyentes: 1-3, 4-5, 6-7 y más de 7 días. La etiqueta visible `7+` representa más de 7 días para evitar contar dos veces el día 7.
- No mostrar el gráfico `Resultado de información RIMAC`; después de los dos gráficos de antigüedad debe mostrarse directamente la tabla de detalle.
- En detalle de Cobranza:
  - Mostrar el número de contrato completo inmediatamente después del ID de conciliación, tanto en la tabla como en la exportación.
  - Póliza y producto desde MAESTRA_CONTRATOS por entidad + oficina + cuenta interna.
  - Modalidad desde CAP-ICCMOD01.
  - No usar póliza de conciliación.

## 6. Filtros obligatorios

- Renovación, Cancelación y Cobranza deben tener:
  - Filtro por producto.
  - Filtro por frecuencia de pago.
- Frecuencias permitidas:
  - Mensual, Trimestral, Bimestral, Semestral, Anual.
- La frecuencia proviene de ICDTCAP CAP-ICTFOPAG.

## 7. Restricciones de datos y privacidad

- POLICY_ID es numérico y permite 1 a 10 dígitos.
- No mostrar ni exportar INSRC_CONTRACT_INT_ACCOUNT_ID.
- No deduplicar ICDTCAM por contrato; conservar granularidad por movimiento.
- Para ICDTCAP, ante duplicados:
  - Priorizar CAP-ICHTIULM más reciente.
  - Desempatar con CAP-ICFALMOV.

## 8. Reglas de presentación

- Corregir siempre tildes y caracteres especiales en textos visibles.
- Mantener terminología de negocio comprensible para Operaciones.
- Evitar conclusiones no demostrables con campos disponibles.

## 9. Checklist previo a entregar cambios

- Reglas de este documento revisadas.
- Fuentes y joins respetados.
- Métricas fijas y variables separadas donde corresponde.
- Filtros de producto y frecuencia presentes donde corresponde.
- Campos prohibidos no expuestos.
- npm run build ejecutado y exitoso.

## 10. Bitácora de reglas (agregar nuevas)

Usar este formato para cada nueva regla:

- Fecha:
- Solicitud de negocio:
- Regla acordada:
- Impacto (vistas/campos/métricas):
- Archivos actualizados:

### Entradas

- 2026-10-13
  - Solicitud de negocio: ajustar los KPI de Overview a 76 altas, 4,892 cancelaciones, 3 renovadas y 177 cobranzas; retirar conciliaciones por producto; agregar conciliaciones creadas y el contrato en el detalle.
  - Regla acordada: las métricas generales usan esos universos demostrativos; Conciliaciones creadas abre la segunda sección y el número completo de contrato aparece tras el ID de conciliación en tabla y CSV.
  - Impacto: KPI, gráficos y detalle de Overview.
  - Archivos actualizados: src/App.tsx, src/App.css y docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: retirar Evolución de altas porque no existe un campo con la fecha de formalización en RIMAC.
  - Regla acordada: no construir series temporales de formalización con `CREATION_DATE`; conservar resultado actual y análisis por canal y producto.
  - Impacto: gráficos generales de Alta y catálogo de métricas.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md y docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: separar Overview en métricas generales y conciliación, siguiendo la estructura de los demás procesos.
  - Regla acordada: métricas generales concentra volúmenes por proceso y producto; conciliación concentra estado, resolución, ANS, incidencias, backlog y detalle.
  - Impacto: estructura visual de Overview, sin cambios en los cálculos.
  - Archivos actualizados: src/App.tsx, src/App.css y docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: ubicar los montos debajo del total y de lo pendiente por formalizar, y retirar el gráfico de altas diarias por producto.
  - Regla acordada: cada uno de esos conteos muestra debajo sus importes PEN y USD; se elimina la serie temporal diaria y su cálculo asociado.
  - Impacto: composición de KPI y gráficos de las métricas generales de Alta.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: renombrar Formalizadas RIMAC como Cantidad de altas e incorporar montos para trazabilidad.
  - Regla acordada: Cantidad de altas cuenta los contratos del contexto filtrado y los montos suman `CAP-ICIPRTOT` en tarjetas separadas para PEN y USD, sin conversión de moneda.
  - Impacto: KPI y trazabilidad monetaria de las métricas generales de Alta.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: retirar el corte operativo de Alta.
  - Regla acordada: eliminar las tarjetas de altas de hoy y altas del mes; Alta conserva únicamente los KPI que responden al período seleccionado.
  - Impacto: métricas generales y estructura visual de Alta.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: aplicar a Alta una estructura y formato de colores coherentes con los demás procesos, sin agregar conciliación.
  - Regla acordada: Alta se organiza en una sola sección numerada de métricas generales que integra sus KPI, gráficos y tabla después de los filtros.
  - Impacto: estructura visual y presentación responsive de Alta.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: retirar el gráfico Resultado de información RIMAC de Cobranza.
  - Regla acordada: la sección de conciliación conserva únicamente los dos gráficos de antigüedad y continúa directamente con la tabla de detalle.
  - Impacto: visualizaciones de Conciliación con RIMAC.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: reemplazar la evolución mensual de incidencias de Cobranza por la antigüedad de no conciliados y no facturados.
  - Regla acordada: mostrar dos barras horizontales con bandas 1-3, 4-5, 6-7 y más de 7 días; cada gráfico debe cuadrar con su KPI, 20 no conciliados y 43 no facturados en el escenario completo.
  - Impacto: visualizaciones de Conciliación con RIMAC y fechas demostrativas de ICDTCAM.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: reemplazar los KPI de Conciliación con RIMAC por métricas de facturación automática y pendientes de facturación.
  - Regla acordada: mostrar dos filas; la primera cuadra 100 facturados automáticos = 20 no conciliados + 80 conciliados, y la segunda muestra 223 a facturar, 43 no facturados y monto no facturado en Soles/USD dentro de una sola caja.
  - Impacto: KPI de la sección Conciliación con RIMAC y modelo demostrativo de facturación.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: agregar el número de contrato después del ID de conciliación en la tabla de Cobranza.
  - Regla acordada: mostrar y exportar el identificador contractual completo obtenido del contrato enriquecido; no exponer la cuenta interna de conciliación.
  - Impacto: detalle tabular y CSV de Conciliación con RIMAC en Cobranza.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: mostrar Soles y USD juntos en las cajas de montos y porcentaje de Cobranza.
  - Regla acordada: retirar el selector de moneda y presentar ambos valores simultáneamente dentro de cada caja.
  - Impacto: panel de montos de facturación y cobranza.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: reemplazar la lectura de liquidación/intentos por facturación y cuadrar el escenario general de Cobranza.
  - Regla acordada: mostrar 223 recibos a facturar, 180 facturados, 177 cobrados y tasa de 79,4 % (`177 / 223`); retirar recibos no cobrados y el flujo; mostrar monto a facturar, monto cobrado y porcentaje; ajustar evolución y ordenar productos por volumen con Top 5 + Otros.
  - Impacto: modelo demostrativo ICDTCAM, KPI, montos, evolución y tabla por producto de Cobranza.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md, docs/CAMPOS_METRICAS.md.

- 2026-10-13
  - Solicitud de negocio: modelar las métricas generales de Cobranza con base en la referencia visual aprobada.
  - Regla acordada: mostrar resumen, flujo, montos por moneda, evolución y tasa por producto usando únicamente `ICFELIQ`, `ICNUMINT`, `ICFECOB`, `ICPRREC` y el enriquecimiento contractual; no incorporar etapas de la referencia sin campo fuente confirmado.
  - Impacto: métricas generales, flujo operativo y visualizaciones de Cobranza.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: retirar el corte fijo del día y mes de Cobranza.
  - Regla acordada: Métricas generales de Cobranza muestra únicamente resultados que responden a los filtros; se eliminan las tarjetas de cobro diario/mensual, intentos y efectividad diaria.
  - Impacto: métricas generales, cálculos y reglas de presentación de Cobranza.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md, .github/copilot-instructions.md.

- 2026-10-13
  - Solicitud de negocio: separar Cobranza en métricas generales y conciliación, siguiendo la jerarquía de Renovación.
  - Regla acordada: la primera sección reúne el corte fijo y los resultados filtrados; la segunda reúne evolución, resultado RIMAC y detalle de conciliaciones.
  - Impacto: estructura visual y jerarquía de la vista Cobranza, sin cambios en cálculos.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: retirar la gráfica de productos con fallas de renovación.
  - Regla acordada: Vehicular es el único producto sin renovación automática, por lo que no corresponde mostrar un comparativo de fallas por producto.
  - Impacto: visuales de conciliación de Renovación.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: cuadrar las 13 pólizas no renovadas de “Cómo me fue” por causa.
  - Regla acordada: 2 se clasifican como no renovadas por decisión de RIMAC, 1 por información tardía y las 10 restantes por decisión del cliente. Las listas son excluyentes y deben sumar el total de no renovadas.
  - Impacto: wording, cálculo y cuadratura de causas en “Cómo me fue”.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: corregir la composición de los gráficos PRE y REN de urgencia.
  - Regla acordada: PRE contiene pendientes no automáticas y pendientes automáticas; REN contiene falta de información de RIMAC e información pendiente automática. Esta distribución reemplaza la agrupación anterior.
  - Impacto: datasets, totales, etiquetas y colores de los gráficos de urgencia de Renovación.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: diferenciar dentro de cada gráfico de urgencia las dos causas que componen PRE y REN.
  - Regla acordada: cada rango se muestra como barra apilada de dos series. PRE distingue pendientes no automáticas y falta de información de RIMAC; REN distingue pendientes automáticas y por renovar con información pendiente. Las etiquetas superiores usan los mismos colores.
  - Impacto: series, colores y lectura de los gráficos de urgencia de Renovación.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: destacar como máxima prioridad las pólizas que no van a renovar y diferenciar las renovaciones automáticas con información pendiente.
  - Regla acordada: PRE se muestra primero y en rojo crítico; REN se muestra después y en azul operativo. El color se aplica a barras, títulos, borde y etiquetas de composición.
  - Impacto: jerarquía visual de los gráficos de urgencia de Renovación.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: separar la urgencia de Renovación entre pólizas que no van a renovar y pólizas que van a renovar, ambas con información pendiente de RIMAC.
  - Regla acordada: el gráfico PRE agrupa pendientes no automáticas y falta de información de RIMAC; el gráfico REN agrupa pendientes automáticas y pólizas por renovar con información pendiente. Ambos conservan la agrupación por días hasta el fin de vigencia.
  - Impacto: gráficos de urgencia de la conciliación de Renovación.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: eliminar “Aún no corresponde” de las pendientes automáticas en la conciliación de Renovación.
  - Regla acordada: todas las pólizas con pendiente automática PRE pasan directamente a “Por renovar con información pendiente”, sin separarlas por la fecha esperada de recibos.
  - Impacto: flujo y tabla dinámica de conciliación de Renovación.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md.

- 2026-10-13
  - Solicitud de negocio: cuadrar las métricas de “Cómo vamos” con el flujo de conciliaciones de Renovación.
  - Regla acordada: el total usa el mismo universo de la conciliación; confirmación previa suma aceptadas y aceptadas en automático; por renovar suma información pendiente, listas para renovar y pendientes automáticas; peligro suma falta de información de RIMAC y pendientes no automáticas. `RZD` se confirma como rechazo del cliente.
  - Impacto: tarjetas de métricas generales de Renovación y clasificación del estado `RZD`.
  - Archivos actualizados: src/App.tsx, docs/REGLAS_DASHBOARD.md, .github/copilot-instructions.md.

- 2026-10-07
  - Solicitud de negocio: separar las métricas generales de Renovación en “Cómo vamos” y “Cómo me fue”, con seguimiento de la ventana de 50 días, estados PRE/REN y causas de no renovación.
  - Regla acordada: “Cómo vamos” muestra situación y riesgo antes del fin de vigencia; “Cómo me fue” muestra resultados al alcanzar el fin de vigencia. `NRE` identifica rechazo de RIMAC y las incidencias `PEN` vencidas identifican falta de información a tiempo. La decisión del cliente queda sin dato hasta recibir un campo o código explícito.
  - Impacto: métricas generales de Renovación y clasificación de causas.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-06
  - Solicitud de negocio: retirar el corte fijo del día y del mes de Renovación.
  - Regla acordada: Renovación muestra únicamente sus métricas generales y de conciliación; no incluye tarjetas independientes de renovadas hoy o renovadas en el mes.
  - Impacto: sección de métricas generales de Renovación.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-10-06
  - Solicitud de negocio: reemplazar el corte fijo de Cancelación por métricas generales y visuales de motivo, prima cancelada, devolución y comisión.
  - Regla acordada: para la maqueta se usan 4,892 cancelaciones demostrativas: 2,987 por impago, 1,245 por fin de vigencia y 660 por solicitud del cliente. Los importes de prima, devolución y comisión tomados de la referencia visual se etiquetan como demostrativos hasta recibir campos fuente y reglas de cálculo aprobadas.
  - Impacto: primera sección de Cancelación; tarjetas, barras mensuales, distribución por motivo y gráfico combinado de devolución/comisión.
  - Archivos actualizados: src/App.tsx, src/App.css, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: mostrar en Cancelación el tipo, motivo e importe devuelto del movimiento ICDTCAN.
  - Regla acordada: `can_iccodmov` es tipo de cancelación y `can_iccodcan` es motivo. No se calcula importe devuelto porque los únicos importes informados son pendiente de cobro y saldo pendiente de préstamo.
  - Impacto: detalle de Cancelación y pendientes de integración ICDTCAN.
  - Archivos actualizados: docs/fuentes/ICDTCAN.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: incorporar la definición de la fuente ICDTCAN sin una extracción de ejemplo.
  - Regla acordada: crear una plantilla vacía con sus 25 encabezados y documentar sus campos, sin generar registros ni cambiar métricas de Cancelación hasta confirmar granularidad, reversiones y precedencia de fechas.
  - Impacto: catálogo de fuentes y futura integración del motor de Cancelación.
  - Archivos actualizados: ICDTCAN.csv, docs/fuentes/ICDTCAN.md, docs/fuentes/README.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: cargar los nombres de modalidad disponibles sin disponer aún de su código real.
  - Regla acordada: asignar cada modalidad al código consecutivo según su orden dentro del producto. Los nombres repetidos se conservan como literales independientes.
  - Impacto: ICDTLIT.csv de demostración y nombres de modalidad en el motor contractual.
  - Archivos actualizados: ICDTLIT.csv, docs/fuentes/ICDTLIT.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: evitar un mapeo fijo de los códigos de prueba CAP y representar más productos en el dashboard.
  - Regla acordada: asignar productos sintéticos de forma determinista por contrato con los pesos de distribución proporcionados por negocio. Los códigos y nombres reales de CAP se conservan sin reemplazarse.
  - Impacto: catálogo ICDTLIT de demostración, enriquecimiento contractual y gráficos de producto.
  - Archivos actualizados: ICDTLIT.csv, notebooks/01_engines_conciliacion.ipynb, docs/fuentes/ICDTLIT.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: habilitar temporalmente el cruce de ICDTLIT para los códigos de prueba `1001` a `1004`.
  - Regla acordada: usar un mapeo sintético y equilibrado sobre cuatro productos del catálogo disponible; las modalidades se etiquetan explícitamente como demostración hasta recibir sus nombres reales.
  - Impacto: archivo ICDTLIT.csv de demostración y futuras pruebas de enriquecimiento contractual.
  - Archivos actualizados: ICDTLIT.csv, docs/fuentes/ICDTLIT.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: confirmar las reglas para generar ICDTLIT.
  - Regla acordada: el identificador de literal de producto es `P{CAP-ICCPRODC}1`; el de modalidad es `{CAP-ICCPRODC}{CAP-ICCMOD01}`. `ICLITER1` es descripción corta e `ICDESLAR` descripción larga.
  - Impacto: generación de ICDTLIT y enriquecimiento futuro del motor contractual.
  - Archivos actualizados: docs/fuentes/ICDTLIT.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: incorporar ICDTLIT como fuente de los nombres de producto y modalidad.
  - Regla acordada: la descripción corta proviene de `ICLITER1` y se identifica por compañía, literal e idioma. El mapeo desde los códigos de producto/modalidad y el idioma visible quedan pendientes de confirmación, por lo que no se infieren nombres.
  - Impacto: diccionario de fuentes y futuros detalles de todas las vistas.
  - Archivos actualizados: docs/fuentes/ICDTLIT.md, docs/fuentes/README.md, docs/REGLAS_DASHBOARD.md.

- 2026-09-23
  - Solicitud de negocio: usar ICDTCAM directamente para la vista de Cobranza, sin crear una tercera tabla física.
  - Regla acordada: conservar la granularidad de recibo/movimiento y enriquecerla en memoria con atributos de contrato. Los KPIs de facturación usan la fecha de liquidación y los de cobro la fecha real de cobro.
  - Impacto: motor ICDTCAM y vista Cobranza.
  - Archivos actualizados: docs/REGLAS_DASHBOARD.md, notebooks/01_engines_conciliacion.ipynb.

- 2026-09-23
  - Solicitud de negocio: confirmar los valores posibles de `CONTRACT_RENEWAL_STATUS_TYPE`.
  - Regla acordada: los únicos estados permitidos son `ENV`, `NRE`, `REN`, `PRN`, `PRE`, `RZD` y `PNR`. `REN` identifica renovación efectiva y `NRE` rechazo explícito de renovación; los demás códigos se conservan visibles sin inferir una semántica adicional.
  - Impacto: motor contractual y vista Renovación (validación, KPI de no renovación y detalle).
  - Archivos actualizados: docs/REGLAS_DASHBOARD.md, notebooks/01_engines_conciliacion.ipynb.

- 2026-08-10
  - Solicitud de negocio: agregar en Alta un gráfico de altas por canal, un pie de top productos (top 3 + otros) y un pie de pendientes vs formalizadas, todo dependiente del filtro activo.
  - Regla acordada: en Alta, los gráficos de canal y distribución deben recalcularse al filtrar por producto/canal/frecuencia/estado/fechas; el pie de productos agrupa el resto en "Otros" y el pie de estado usa Pendientes vs Formalizadas.
  - Impacto: vista Alta (insights de distribución comercial y estado operativo).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: reforzar separación visual de filtros en Alta, mejorar subtítulos de bloques KPI, dejar gráfico ocupando todo el ancho y agregar columna de días pendientes RIMAC en tabla.
  - Regla acordada: en Alta dividir filtros por bloques de fecha y segmentación, usar títulos ejecutivos en métricas, mantener gráfico principal full-width y mostrar días transcurridos solo cuando el estado RIMAC sea PEN.
  - Impacto: vista Alta (UX de filtros, KPIs, gráfico y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: ajustar Dashboard de Alta con estados RIMAC válidos (BAJ, ERR, INC, FOR, PEN), separar métricas por dependencia de fecha, incluir filtro de canal y simplificar tabla.
  - Regla acordada: en Alta, las métricas fijas no dependen del rango de fechas pero sí del resto de filtros; las métricas variables sí dependen del rango. Se reemplazan gráficos por una línea de tiempo de altas por día y producto. En tabla, frecuencia sin código, sin fecha de inicio, y se agregan canal/subcanal.
  - Impacto: vista Alta (filtros, KPIs, gráfico y tabla) y enriquecimiento ICDTCAP para canal/subcanal.
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en todos los dashboards usar filtros de rango de fechas (inicio/fin), frecuencia de pago y producto; evaluar visualización por producto en Overview considerando más de 10 productos y crecimiento futuro.
  - Regla acordada: todos los tabs deben incluir filtros funcionales de fecha inicio/fin, producto y frecuencia (Mensual, Bimestral, Trimestral, Semestral, Anual); en Overview usar gráfico Top 10 productos y agrupar el resto en "Otros".
  - Impacto: Overview, Alta, Cancelación, Renovación y Cobranza (filtros); Overview (gráfico por producto).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en Overview retirar el texto "CONTROL OPERATIVO · ÚLTIMOS 12 MESES", eliminar filtros de entidad/sucursal/búsqueda y dejar el período funcional.
  - Regla acordada: Overview mantiene solo filtros operativos útiles (periodo y estado) y el período debe afectar el conjunto de datos mostrado.
  - Impacto: vista Overview (cabecera, panel de filtros y lógica de filtrado).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: separar métricas fijas y variables en Renovación, Cancelación y Cobranza; agregar filtros de producto y frecuencia de pago en las tres vistas.
  - Regla acordada: mantener dos bloques explícitos de métricas y filtros comunes por producto/frecuencia.
  - Impacto: vistas REN, CAN, INV; KPIs y filtros.
  - Archivos actualizados: src/App.tsx, src/App.css, README.md, .github/copilot-instructions.md.

- 2026-08-10
  - Solicitud de negocio: rediseñar Renovación con filtros en dos bloques, KPI de no renovación en bloque variable, gráfico de fallas por producto y tabla estrictamente a nivel conciliación.
  - Regla acordada: en Renovación, el rango de fechas debe ir primero; producto y frecuencia se mantienen en segmentación operativa; el resultado de no renovación por decisión RIMAC se calcula con estados NRE y RZD; la tabla de detalle usa siempre ID de conciliación, muestra confirmación/recibos en formato corto y el resultado de renovación se expresa con códigos ENV, NRE, REN, PRN, PRE y RZD.
  - Impacto: vista Renovación (filtros, KPIs, gráficos y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: en Cobranza aplicar filtros y bloques KPI con el mismo esquema visual, quitar el gráfico por estado, convertir resultado de información RIMAC a pie y simplificar columnas de tabla.
  - Regla acordada: en Cobranza los filtros se separan en rango de fechas y segmentación operativa; se elimina el gráfico de estado actual; el gráfico de información RIMAC se representa como pie con categorías "Cobrados en automático" y "No cobrados"; en la tabla se retiran columnas de movimientos y resultado y se agrega moneda.
  - Impacto: vista Cobranza (filtros, gráficos y detalle tabular).
  - Archivos actualizados: src/App.tsx, src/App.css.

- 2026-08-10
  - Solicitud de negocio: en Cobranza mover moneda a la derecha de ambos montos, quitar prefijo monetario en montos/diferencia, agregar días abierto; en Overview mostrar KPI fijos por cuatro procesos.
  - Regla acordada: en la tabla de Cobranza, la columna Moneda se muestra inmediatamente después de Monto operado; Monto informado, Monto operado y Diferencia se visualizan sin símbolo monetario; se agrega Días abierto al extremo derecho calculado como hoy menos fecha de creación. En Overview, el bloque KPI debe ser fijo para Alta, Cancelación, Renovación y Cobranza.
  - Impacto: vista Cobranza (tabla) y vista Overview (KPIs).
  - Archivos actualizados: src/App.tsx.

- 2026-08-10
  - Solicitud de negocio: en Cobranza quitar subtítulos de KPIs, eliminar KPI de monto informado y separar KPI monetarios por soles/dólares sin usar la palabra centavos.
  - Regla acordada: en Cobranza, los KPIs se muestran sin subtítulos; se elimina el KPI de monto informado; los KPIs monetarios quedan como monto operado en soles/dólares y diferencia en soles/dólares.
  - Impacto: vista Cobranza (bloques KPI fijo y variable).
  - Archivos actualizados: src/App.tsx.
