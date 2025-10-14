---
layout: default
title: "Cargar raster"
description: "Cargar un archivo raster con terra"
section: modelado
order: 32
---

# 🌍 Tutorial: Abrir un archivo Raster con el paquete `terra` en R

## 🧩 1️⃣ Instalar y cargar el paquete `terra`

El paquete **terra** es la evolución del paquete `raster` y permite trabajar con datos espaciales (raster y vectoriales) de forma eficiente.

```r
# Instalar el paquete (solo la primera vez)
install.packages("terra")

# Cargar la librería
library(terra)
```

---

## 📂 2️⃣ Cargar un archivo Raster

Para abrir un archivo raster (por ejemplo un GeoTIFF `.tif`), usa la función `rast()`.

```r
# Definir la ruta al archivo
ruta <- "datos/mi_raster.tif"

# Cargar el raster
r <- rast(ruta)

# Ver las propiedades básicas
r
```

Esto mostrará información como el número de capas, resolución, extensión, CRS (sistema de referencia) y tipo de datos.

---

## 🧭 3️⃣ Visualizar el raster

Puedes visualizar el raster directamente en R:

```r
# Visualización básica
plot(r, main = "Mapa Raster")

# Si tiene varias bandas (por ejemplo imágenes satelitales)
plotRGB(r, r = 3, g = 2, b = 1, stretch = "lin")
```

---

## 🧠 4️⃣ Obtener información del raster

```r
# Ver el CRS (sistema de coordenadas)
crs(r)

# Extensión geográfica
ext(r)

# Resolución espacial
res(r)

# Número de capas
nlyr(r)

# Estadísticas básicas
global(r, mean, na.rm = TRUE)
```

---

## 🧮 5️⃣ Acceder y manipular valores

```r
# Extraer valores de una celda específica
extract(r, cbind(-71.5, -36.8))  # coordenadas (lon, lat)

# Convertir el raster a un data frame
r_df <- as.data.frame(r, xy = TRUE)

# Mostrar las primeras filas
head(r_df)
```

---

## 💾 6️⃣ Guardar un raster nuevo

Puedes guardar un raster modificado o recortado fácilmente:

```r
# Ejemplo: guardar el mismo raster con otro nombre
writeRaster(r, "salidas/mi_raster_guardado.tif", overwrite = TRUE)
```

---

## ✅ Recomendaciones

- Usa siempre `terra` en lugar de `raster` para proyectos nuevos.
- Asegúrate de que todas las capas trabajen con el mismo CRS (`st_crs()` o `crs()`).
- Usa rutas relativas dentro de tu proyecto (`datos/`, `salidas/`, etc.) para mantener la portabilidad.

---

> 📘 **Referencia:**  
> Paquete `terra`: [https://rspatial.org/terra/](https://rspatial.org/terra/)

📘 **Autor:** Eduardo Fuentes
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025 