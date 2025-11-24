---
layout: default
title: "Downscaling geográfico ponderado (GWR) "
description: " Downscaling geográfico ponderado (GWR)"
section: SDM
order: 44
---
# Tutorial completo: Downscaling geográfico ponderado (GWR) para una variable bioclimática

Este tutorial describe paso a paso cómo realizar **downscaling geográfico** utilizando **Geographically Weighted Regression (GWR)** para una variable bioclimática (por ejemplo BIO1). Está orientado a usuarios que trabajan con datos climáticos y desean obtener capas refinadas a escala fina (30 m) a partir de capas gruesas (~1 km).

---

## 1. Introducción al GWR para Downscaling Climático

El **downscaling estadístico** permite refinar la resolución espacial de variables climáticas utilizando predictores locales (topografía, pendiente, radiación, etc.).  
El método **GWR (Geographically Weighted Regression)** modela la relación entre clima y topografía permitiendo que los coeficientes varíen espacialmente:

\[
Y_i = \beta_0(u_i,v_i) + \beta_1(u_i,v_i) X_{1,i} + \beta_2(u_i,v_i) X_{2,i} + \ldots + \varepsilon_i
\]

Esto lo convierte en una de las mejores técnicas para zonas montañosas.

---

## 2. Librerías necesarias

```r
library(terra)
library(sf)
library(spgwr)
library(dplyr)
library(ggplot2)
```

---

## 3. Datos necesarios

- Variable bioclimática coarse (ej.: BIO1).
- Modelo de elevación digital (DEM) a 30 m.
- Predictores derivados: pendiente, aspecto, etc.

---

## 4. Cargar datos raster

```r
bio_coarse <- rast("bio1_coarse.tif")
dem        <- rast("dem_30m.tif")

# Asegurar mismo CRS
dem <- project(dem, bio_coarse)
```

---

## 5. Crear predictores topográficos

```r
slope  <- terrain(dem, opt="slope", unit="degrees")
aspect <- terrain(dem, opt="aspect", unit="degrees")
elev   <- dem
```

---

## 6. Convertir la variable coarse a puntos

```r
bio_pts <- as.points(bio_coarse)
names(bio_pts) <- "bio"
```

Extraer predictores:

```r
bio_df <- extract(c(elev, slope, aspect), bio_pts, bind=TRUE)
```

---

## 7. Selección óptima del ancho de banda

```r
bw <- gwr.sel(bio ~ elev + slope + aspect,
              data = bio_df,
              coords = st_coordinates(bio_df))
bw
```

---

## 8. Ajuste del modelo GWR

```r
gwr_mod <- gwr(bio ~ elev + slope + aspect,
               data = bio_df,
               coords = st_coordinates(bio_df),
               bandwidth = bw,
               hatmatrix = TRUE)
```

---

## 9. Predicción a resolución fina (30 m)

Crear stack de predictores:

```r
pred_stack <- c(elev, slope, aspect)
```

Convertir raster a puntos:

```r
pred_pts <- as.points(pred_stack)
pred_df  <- as.data.frame(pred_pts)
```

Extraer coeficientes del GWR:

```r
coefs <- gwr_mod$SDF

b0 <- coefs$`(Intercept)`
b1 <- coefs$elev
b2 <- coefs$slope
b3 <- coefs$aspect
```

Predicción:

```r
pred_df$bio_pred <- b0 +
                    b1 * pred_df$elev +
                    b2 * pred_df$slope +
                    b3 * pred_df$aspect
```

Volver a raster:

```r
bio_30m <- rast(pred_df, type="xyz",
                crs = crs(dem),
                extent = ext(dem))
```

---

## 10. Guardar resultados

```r
writeRaster(bio_30m, "bio1_30m_gwr.tif", overwrite=TRUE)
```

---

## 11. Evaluación del desempeño

Comparación visual:

```r
plot(c(bio_coarse, bio_30m))
```

Comparación punto a punto:

```r
vals <- extract(bio_30m, bio_pts)

plot(vals$bio_30m, bio_df$bio,
     xlab="BIO1 downscaled",
     ylab="BIO1 original coarse")
abline(0,1,col="red")
```

---

## 12. Advertencias importantes

- No extrapolar fuera del rango altitudinal.
- Evitar multicolinealidad en predictores (VIF < 5).
- El bandwidth controla suavidad vs. sobreajuste.
- Aspecto puede ser circular → usar seno/coseno si es necesario.

---

## 13. Extensiones opcionales

Agregar predictores como:
- Curvatura
- Radiación solar
- Rugosidad
- TWI, TRI

Ejemplo:

```r
curv <- terrain(dem, "flowdir")
rug  <- terrain(dem, "roughness")
```

---

    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025

