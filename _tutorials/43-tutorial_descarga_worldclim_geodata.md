---
layout: default
title: "Descarga de Datos WorldClim "
description: " descargar datos bioclimáticos y climáticos actuales y futuros"
section: SDM
order: 43
---
# Descarga de Datos WorldClim Usando `geodata` + `terra`
Este documento explica paso a paso cómo descargar datos bioclimáticos y climáticos actuales y futuros de **WorldClim** directamente desde R utilizando los paquetes **`geodata`** y **`terra`**.

---

# 📦 1. Instalación y carga de librerías

```r
install.packages("geodata")
install.packages("terra")

library(geodata)
library(terra)
```

---

# 🌡️ 2. Descargar WorldClim Actual (BIO1–BIO19)

WorldClim actual (v2.1) ofrece bioclimáticas en resoluciones:

- 10 minutos (≈18 km)
- 5 minutos  (≈9 km)
- 2.5 minutos (≈4–5 km)
- 0.5 minutos (≈1 km)  **→ Recomendado para SDMs**

### ✔ Descargar bioclimáticas actuales

```r
wc_current <- geodata::worldclim_global(
  var = "bio",   # BIO1–BIO19
  res = 0.5      # resolución 0.5' ≈ 1 km
)
```

### Visualizar BIO1

```r
plot(wc_current$bio1)
```

---

# 🛰️ 3. Descargar variables climáticas mensuales

### Temperatura media mensual

```r
tmean <- geodata::worldclim_global(var="tmean", res=0.5)
```

### Temperatura mínima mensual

```r
tmin <- geodata::worldclim_global(var="tmin", res=0.5)
```

### Temperatura máxima mensual

```r
tmax <- geodata::worldclim_global(var="tmax", res=0.5)
```

### Precipitación mensual

```r
prec <- geodata::worldclim_global(var="prec", res=0.5)
```

---

# 🌍 4. Descargar WorldClim Futuro (CMIP6)

WorldClim provee proyecciones climáticas CMIP6 combinando:

- 👨‍🔬 Modelos climáticos (GCM)
- ☀ Escenarios SSP
- 📆 Periodos temporales

### Formato general

```r
wc_future <- geodata::cmip6_worldclim(
  var = "bio",
  res = 0.5,
  ssp = "585",
  model = "GFDL-ESM4",
  period = "2061-2080"
)
```

### Ejemplo práctico

```r
wc_future <- geodata::cmip6_worldclim(
  var = "bio",
  res = 0.5,
  ssp = "585",
  model = "IPSL-CM6A-LR",
  period = "2081-2100"
)

plot(wc_future$bio12)
```

---

# 🔍 5. Recortar datos a una región

Si tienes un shapefile de tu área de estudio:

```r
region <- vect("mi_region.shp")

wc_current_crop <- mask(crop(wc_current, region), region)
wc_future_crop  <- mask(crop(wc_future, region), region)
```

---

# 💾 6. Guardar los datos en disco

```r
writeRaster(wc_current_crop, "bioclim_actual.tif", overwrite=TRUE)
writeRaster(wc_future_crop,  "bioclim_futuro_ssp585_2100.tif", overwrite=TRUE)
```

---

# 📑 7. Tabla resumen de funciones importantes de `geodata`

| Tipo de datos | Función |
|---------------|---------|
| WorldClim actual BIOs | `worldclim_global(var="bio")` |
| Temperaturas | `worldclim_global(var="tmean")` |
| Precipitación | `worldclim_global(var="prec")` |
| Clima futuro CMIP6 | `cmip6_worldclim()` |
| Elevación | `elevation_global()` |
| Uso de suelo | `landcover()` |
| Límites administrativos | `gadm()` |

---

# 🚀 8. Script completo listo para copiar

```r
library(geodata)
library(terra)

# 1. WorldClim actual (1 km)
wc <- worldclim_global(var="bio", res=0.5)

# 2. Futuro CMIP6 (GFDL – SSP126 – 2041–2060)
wc_fut <- cmip6_worldclim(
  var="bio",
  res=0.5,
  ssp="126",
  model="GFDL-ESM4",
  period="2041-2060"
)

# 3. Recorte
roi <- vect("region.shp")
wc_crop <- mask(crop(wc, roi), roi)
wc_fut_crop <- mask(crop(wc_fut, roi), roi)

# 4. Guardar
writeRaster(wc_crop, "bioclim_actual_1km.tif", overwrite=TRUE)
writeRaster(wc_fut_crop, "bioclim_futuro_2040_SSP126.tif", overwrite=TRUE)
```

---

    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025

