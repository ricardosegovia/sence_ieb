---
layout: default
title: "Análisis de Kernel"
description: "Aprende a realizar un análisis de kernel y calcular métricas descriptivas del patrón espacial."
section: modelado
order: 33
---

# **Objetivo**

Aplicar herramientas de R para estimar y visualizar la **densidad espacial de ocurrencias de una especie** mediante el análisis Kernel, identificando zonas de alta concentración (*hotspots*) y calculando métricas descriptivas del patrón espacial.

---

## **Paquetes requeridos**

```r
library(sf)        # Para manejar datos espaciales vectoriales (shapefiles)
library(terra)     # Para operaciones con datos raster
library(spatstat)  # Para análisis de patrones de puntos
library(ggplot2)   # Para visualización de resultados
library(viridis)   # Paletas de color
```

---

## **1. Carga de los datos**

En este ejercicio se parte de un shapefile con registros de ocurrencia de una especie (por ejemplo, *Citronella mucronata*) previamente limpiado.

```r
# Cargar archivo shapefile de puntos
ocurrencias <- st_read("Datos/Ocurrencias_especie.shp")

# Verificar sistema de referencia
st_crs(ocurrencias)

# Transformar a proyección UTM (ejemplo: EPSG:32719 – WGS84 / UTM zona 19S)
ocurrencias <- st_transform(ocurrencias, 32719)

# Visualización rápida
plot(ocurrencias["geometry"], main = "Ocurrencias de la especie", col = "darkgreen", pch = 19)
```

---

## **2. Preparación de coordenadas**

```r
# Extraer coordenadas (x, y)
coords <- st_coordinates(ocurrencias)

# Crear data.frame con coordenadas
df_coords <- data.frame(x = coords[,1], y = coords[,2])

# Revisar las primeras filas
head(df_coords)
```

---

## **3. Definir la ventana de observación**

Para limitar el análisis a la extensión espacial de los datos:

```r
# Crear una ventana de observación a partir de la envolvente convexa
win <- as.owin(st_union(ocurrencias))

# Crear objeto de patrón de puntos
ppp_obj <- ppp(x = df_coords$x, y = df_coords$y, window = win)

# Visualizar patrón de puntos
plot(ppp_obj, main = "Patrón de puntos de ocurrencia")
```

---

## **4. Calcular la densidad Kernel**

El parámetro `sigma` controla el grado de suavizamiento (radio de influencia).  

```r
# Calcular densidad Kernel
densidad <- density(ppp_obj, sigma = 1500)  # 1500 m como ejemplo

# Convertir el resultado a objeto raster
r_dens <- rast(densidad)
crs(r_dens) <- "EPSG:32719"

# Visualizar mapa de densidad
plot(r_dens, main = "Mapa de Densidad Kernel", col = viridis(50))
plot(st_geometry(ocurrencias), add = TRUE, col = "red", pch = 19)
```

---

## **5. Calcular estadísticas básicas**

```r
# Extraer valores de densidad
vals <- values(r_dens)
vals <- vals[!is.na(vals)]

# Calcular métricas descriptivas
mean_dens <- mean(vals)
median_dens <- median(vals)
max_dens <- max(vals)
sd_dens <- sd(vals)

cat("Media:", round(mean_dens, 3),
    "| Mediana:", round(median_dens, 3),
    "| Máximo:", round(max_dens, 3),
    "| SD:", round(sd_dens, 3), "\n")
```

---

## **6. Identificar zonas de alta densidad**

Usando el percentil 99 de la distribución de valores.

```r
# Calcular umbral (percentil 99)
umbral <- quantile(vals, 0.99)

# Crear mapa binario de alta densidad
alta_dens <- r_dens > umbral

# Calcular área de zonas con alta densidad (en hectáreas)
area_alta <- sum(expanse(alta_dens, unit = "ha"), na.rm = TRUE)

cat("Área de alta densidad (percentil 99):", round(area_alta, 2), "ha\n")

# Visualización
plot(r_dens, main = "Densidad Kernel y Zonas de Alta Densidad")
plot(alta_dens, add = TRUE, col = "red", legend = FALSE)
plot(st_geometry(ocurrencias), add = TRUE, col = "black", pch = 19)
```

---

## **7. Comparación de distintos valores de suavizamiento**

El parámetro `h` (o `sigma`) afecta el nivel de detalle.  
Probamos diferentes valores para observar el efecto.

```r
cit_coords <- st_coordinates(ocurrencias)
pts <- data.frame(x = cit_coords[,1], y = cit_coords[,2])

par(mfrow = c(1,3))
for (h in c(200, 1000, 3000)) {
  dens <- kde2d(pts$x, pts$y, h = h, n = 100)
  image(dens, col = viridis(50),
        main = paste("h =", h), xlab = "X", ylab = "Y")
  points(pts$x, pts$y, col = "red", pch = 19, cex = 0.4)
}
par(mfrow = c(1,1))
```

---

## **8. Exportar resultados**

```r
# Exportar raster de densidad y mapa binario
writeRaster(r_dens, "Densidad_Kernel.tif", overwrite = TRUE)
writeRaster(alta_dens, "Zonas_Alta_Densidad.tif", overwrite = TRUE)

cat("✅ Archivos exportados correctamente al directorio de trabajo.\n")
```

---

## **9. Conclusiones**

- El análisis Kernel permite **visualizar áreas de concentración de registros**.  
- El parámetro `sigma` controla el grado de suavizamiento espacial.  
- Las zonas de alta densidad pueden interpretarse como **potenciales hotspots ecológicos** o áreas prioritarias de muestreo.

---

### **Productos esperados**

- `Densidad_Kernel.tif` — mapa continuo de densidad.  
- `Zonas_Alta_Densidad.tif` — mapa binario de alta densidad.  
- Gráficos de densidad y curvas de suavizamiento.  
- Resumen estadístico en consola.
  
  📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025
