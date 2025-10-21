---
layout: default
title: "Cargar un raster y superponer un shapefile"
description: "Aprende a cargar archivos raster y shapefiles, verificar proyecciones y graficarlos juntos usando el paquete terra."
section: datos
order: 32
---


# 🗺️ Tutorial: Cargar un Raster y Plotear un Shapefile en R

En este tutorial aprenderás a cargar un archivo raster (por ejemplo, un mapa de elevación o cobertura) y un shapefile con puntos o polígonos, para visualizarlos juntos en un mismo mapa utilizando el paquete `terra`.

---

## 🧩 1️⃣ Instalar y cargar los paquetes necesarios

```r
# Instalar paquetes (solo la primera vez)
install.packages(c("terra", "sf"))

# Cargar librerías
library(terra)  # para rasters y operaciones espaciales
library(sf)     # para leer y manejar shapefiles vectoriales
```

---

## 🌄 2️⃣ Cargar un archivo raster

Supongamos que tienes un archivo raster en formato `.tif` (por ejemplo, un DEM o un mapa climático).

```r
# Definir la ruta al archivo
ruta_raster <- "datos/mi_raster.tif"

# Cargar el raster
r <- rast(ruta_raster)

# Revisar sus propiedades
r
```

Esto mostrará información como el número de capas, extensión, resolución, sistema de referencia y tipo de datos.

---

## 🗂️ 3️⃣ Cargar el shapefile generado en el tutorial anterior

En el tutorial anterior guardaste los puntos o polígonos reproyectados en EPSG:4326, por ejemplo en `shapefiles/puntos_4326.shp`.

```r
# Definir la ruta al shapefile
ruta_shp <- "shapefiles/puntos_4326.shp"

# Cargar el shapefile
puntos_sf <- st_read(ruta_shp)

# Convertir a formato SpatVector (terra)
puntos_vect <- vect(puntos_sf)
```

---

## 🧭 4️⃣ Verificar que ambos tengan la misma proyección

Antes de graficar, confirma que el raster y el shapefile usan el mismo CRS (sistema de referencia espacial):

```r
crs(r)
crs(puntos_vect)
```

Si son distintos, reproyecta uno para que coincidan (normalmente el shapefile a la proyección del raster):

```r
puntos_vect <- project(puntos_vect, crs(r))
```

---

## 🖼️ 5️⃣ Plotear ambos en el mismo mapa

```r
# Graficar el raster
plot(r, main = "Raster con shapefile superpuesto")

# Agregar los puntos o polígonos
plot(puntos_vect, add = TRUE, col = "red", pch = 19)
```

👉 Si tus datos son polígonos, puedes usar `border = "black"` en lugar de `pch`.

---

## 💾 6️⃣ (Opcional) Exportar un mapa como imagen

Puedes guardar la visualización en un archivo `.png` o `.jpg`:

```r
png("salidas/mapa_con_shapefile.png", width = 1200, height = 900, res = 150)
plot(r, main = "Raster con shapefile superpuesto")
plot(puntos_vect, add = TRUE, col = "red", pch = 19)
dev.off()
```

---

## ✅ Recomendaciones

- Asegúrate de que ambos archivos (raster y shapefile) estén en la misma proyección antes de analizarlos.  
- Usa `plotRGB()` si el raster tiene varias bandas (por ejemplo, imágenes satelitales).  
- Si el shapefile no se ve, revisa su CRS y extensión con `st_bbox()` o `ext()`.

---

> 📘 **Referencias útiles:**  
> - Paquete `terra`: [https://rspatial.org/terra/](https://rspatial.org/terra/)  
> - Paquete `sf`: [https://r-spatial.github.io/sf/](https://r-spatial.github.io/sf/)

📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025
