# Catálogo de fuentes

Este directorio conserva un archivo independiente por fuente con el nombre del campo, su descripción, tipo y longitud.

El uso transversal de estos campos en KPI, gráficos, filtros, cruces y deduplicaciones está documentado en [Inventario de campos utilizados en métricas](../CAMPOS_METRICAS.md).

| Fuente | Diccionario | Cantidad de campos |
|---|---|---:|
| `MAESTRA_CONTRATOS` | [MAESTRA_CONTRATOS.md](MAESTRA_CONTRATOS.md) | 35 |
| `ICDTCAP` | [ICDTCAP.md](ICDTCAP.md) | 90 |
| `ICDTCAM` | [ICDTCAM.md](ICDTCAM.md) | 95 |
| `T_PISD_INSURANCE_CONCILIATION` | [T_PISD_INSURANCE_CONCILIATION.md](T_PISD_INSURANCE_CONCILIATION.md) | 14 |
| `T_PISD_INSR_CONCILIATION_MOV` | [T_PISD_INSR_CONCILIATION_MOV.md](T_PISD_INSR_CONCILIATION_MOV.md) | 14 |

## Criterio de mantenimiento

- Cada nueva fuente debe tener su propio archivo en este directorio.
- No se debe inventar una longitud o descripción ausente: debe solicitarse nuevamente a negocio.
- Los tipos y longitudes se conservan como fueron suministrados.
- Las reglas de transformación o cruce pueden documentarse al final del archivo, sin alterar el catálogo original.
- [ICDTCAP.md](../ICDTCAP.md) mantiene adicionalmente el contrato de integración y las reglas del join para Alta.
- `ICDTCAM` conserva granularidad de movimiento y no debe deduplicarse a nivel de contrato.
