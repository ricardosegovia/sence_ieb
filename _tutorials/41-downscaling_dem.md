---
layout: default
title: "Dowscaling estadístico"
description: "Aprende a realizar un dowscaling estadístico a partir de un DEM a menor resolución"
section: SDM
order: 41
---

# **Objetivo**

Aplicar un método de *downscaling estadístico* para refinar la resolución espacial de variables climáticas (por ejemplo, temperatura o precipitación) desde 1 km hasta 30 m, utilizando un **modelo digital de elevación (DEM)** como variable explicativa.

Este procedimiento permite generar capas ambientales de alta resolución, más adecuadas para modelar procesos ecológicos y distribuciones de especies a escala local.

---

## **Paquetes requeridos**

```r
library(terra)     # Análisis raster
library(ggplot2)   # Visualización
library(viridis)   # Paletas de color
```

---

## **1. Cargar capas climáticas y topográficas**

En este ejemplo, se utilizarán variables climáticas de baja resolución (1 km) y un DEM de alta resolución (30 m).

```r
# Directorio de trabajo
setwd("C:/Users/Usuario/Escritorio/Curso_Sence/")

# Capa climática (CHELSA, WorldClim, etc.) a 1 km
bio1 <- rast("Variables_Bioclimaticas/Chelsa_bio1_1km.tif")  # Temperatura media anual

# DEM a 30 m
DEM <- rast("Modelos/DEM_30m.tif")

# Revisar propiedades
bio1; DEM
```

---

## **2. Reproyectar capas para asegurar compatibilidad**

```r
# Asegurar que ambas capas tengan el mismo sistema de coordenadas
bio1 <- project(bio1, DEM)

# Visualización de comparación espacial
plot(bio1, main = "CHELSA Bio1 (1 km)")
plot(DEM, main = "DEM 30 m")
```

---

## **3. Crear una versión del DEM a resolución 1 km**

Para establecer la relación entre clima y elevación, se ajusta el DEM a la resolución del raster climático (1 km):

```r
DEM_1km <- resample(DEM, bio1, method = "average")
plot(DEM_1km, main = "DEM promedio (1 km)")
```

---

## **4. Ajustar modelo de regresión lineal clima ~ elevación**

```r
# Extraer valores de ambas capas como vectores numéricos
valores <- na.omit(data.frame(
  clima = values(bio1),
  elev  = values(DEM_1km)
))

# Modelo lineal simple
modelo <- lm(clima ~ elev, data = valores)
summary(modelo)
```

> 💡 El R² del modelo indica qué tan bien la elevación explica la variación climática.

---

## **5. Predicción climática a 30 m**

Usando el modelo lineal, se predice la variable climática a la resolución del DEM.

```r
# Predicción de la variable climática a 30 m
bio1_pred <- predict(DEM, modelo)
plot(bio1_pred, main = "Predicción climática a 30 m", col = viridis(50))
```

---

## **6. Calcular e interpolar residuos**

Los residuos representan las diferencias locales no explicadas por el modelo y permiten recuperar la variabilidad espacial.

```r
# Calcular residuos (1 km)
residuos <- bio1 - predict(DEM_1km, modelo)

# Reescalar residuos a 30 m mediante interpolación bilineal
residuos_30m <- resample(residuos, DEM, method = "bilinear")
```

---

## **7. Combinar predicción + residuales (downscaling final)**

```r
bio1_downscaled <- bio1_pred + residuos_30m

# Visualizar el resultado final
plot(bio1_downscaled, main = "Downscaling Bio1 a 30 m", col = viridis(50))
```

---

## **8. Exportar resultados**

```r
writeRaster(bio1_downscaled, "Bio1_Downscaled_30m.tif", overwrite = TRUE)
cat("✅ Archivo exportado: Bio1_Downscaled_30m.tif\n")
```

---

## **9. Comparación visual (1 km vs 30 m)**

```r
par(mfrow = c(1, 2))
plot(bio1, main = "Original (1 km)", col = viridis(50))
plot(bio1_downscaled, main = "Downscaled (30 m)", col = viridis(50))
par(mfrow = c(1, 1))
```

---

## **10. Extensión a múltiples variables climáticas**

El proceso puede automatizarse fácilmente para varias capas (ej. bio1, bio5, bio6):

```r
bio_stack <- rast(list.files("Variables_Bioclimaticas/", pattern = ".tif$", full.names = TRUE))

for (v in names(bio_stack)) {
  cat("Procesando variable:", v, "\n")
  bio <- bio_stack[[v]] |> project(DEM)
  DEM_1km <- resample(DEM, bio, method = "average")
  vals <- na.omit(data.frame(clima = values(bio), elev = values(DEM_1km)))
  mod <- lm(clima ~ elev, data = vals)
  pred <- predict(DEM, mod)
  res  <- bio - predict(DEM_1km, mod)
  res_30m <- resample(res, DEM, method = "bilinear")
  bio_down <- pred + res_30m
  writeRaster(bio_down, paste0(v, "_downscaled_30m.tif"), overwrite = TRUE)
  cat("  ✅", v, "procesada y guardada.\n")
}
```

---

## **Conclusiones**

- El *downscaling estadístico* permite aumentar la resolución espacial de capas climáticas aprovechando relaciones topográficas.
- Este método conserva patrones altitudinales y variabilidad local, cruciales para estudios de biodiversidad, restauración o modelación de especies.
- Es recomendable validar los resultados con sensores de temperatura o estaciones climáticas locales si se dispone de ellos.

    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025

