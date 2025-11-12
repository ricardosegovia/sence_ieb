---
layout: default
title: "Rasterizar"
description: "Aprende a realizar rasterización a partir de datos vectoriales y raster"
section: modelado
order: 34
---


# **Objetivo**

Aprender a generar capas continuas (raster) de **distancia a caminos**, **pendiente** y **exposición**, a partir de datos vectoriales y raster utilizando herramientas del paquete `terra`. Estas variables son frecuentemente empleadas como predictores en modelos de distribución de especies y análisis espaciales.

---

## **Paquetes requeridos**

```r
library(terra)    # Para manejo de datos raster
library(sf)       # Para lectura y manejo de datos vectoriales
library(ggplot2)  # Para visualización
library(viridis)  # Paleta de colores
```

---

## **1. Carga de la red vial y creación del raster base**

Se parte de un shapefile con la red vial del área de estudio (por ejemplo, `red_vial.shp`).

```r
# Cargar red vial
red_vial <- st_read("Datos/red_vial.shp")

# Transformar a proyección métrica (ejemplo: UTM zona 19 Sur)
red_vial <- st_transform(red_vial, 32719)

# Crear raster base (definir resolución en metros)
base <- rast(ext(red_vial), resolution = 30, crs = "EPSG:32719")

# Rasterizar la red vial (celdas con valor 1 representan caminos)
r_vial <- rasterize(vect(red_vial), base, field = 1, background = NA)

plot(r_vial, main = "Red vial rasterizada", col = c("lightgray", "red"))
```

---

## **2. Calcular la distancia euclidiana a caminos**

```r
# Calcular la distancia a caminos (en metros)
dist_caminos <- distance(r_vial)

# Visualizar el resultado
plot(dist_caminos, main = "Distancia a caminos (m)", col = viridis(50))
```

> 💡 **Nota:** Los valores bajos indican zonas cercanas a caminos, mientras que los altos representan áreas más aisladas.

---

## **3. Exportar la capa de distancia a caminos**

```r
writeRaster(dist_caminos, "Distancia_Caminos.tif", overwrite = TRUE)
cat("✅ Archivo 'Distancia_Caminos.tif' exportado correctamente.\n")
```

---

## **4. Carga del Modelo Digital de Elevación (DEM)**

```r
# Cargar DEM del área de estudio
dem <- rast("Datos/DEM.tif")

# Revisar propiedades
print(dem)

# Visualizar DEM
plot(dem, main = "Modelo Digital de Elevación", col = terrain.colors(50))
```

---

## **5. Calcular pendiente y exposición**

La función `terrain()` de `terra` permite derivar estas variables directamente desde el DEM.

```r
# Calcular pendiente (en grados)
pendiente <- terrain(dem, v = "slope", unit = "degrees", neighbors = 8)

# Calcular exposición (orientación de la pendiente)
exposicion <- terrain(dem, v = "aspect", unit = "degrees", neighbors = 8)

# Visualizar resultados
par(mfrow = c(1,2))
plot(pendiente, main = "Pendiente (grados)", col = viridis(50))
plot(exposicion, main = "Exposición (grados)", col = viridis(50))
par(mfrow = c(1,1))
```

---

## **6. Exportar las capas derivadas**

```r
writeRaster(pendiente, "Pendiente.tif", overwrite = TRUE)
writeRaster(exposicion, "Exposicion.tif", overwrite = TRUE)

cat("✅ Capas 'Pendiente.tif' y 'Exposicion.tif' exportadas correctamente.\n")
```

---

## **7. Visualización integrada con ggplot2**

```r
# Convertir raster a data frame para visualización
df_pend <- as.data.frame(pendiente, xy = TRUE)
colnames(df_pend) <- c("x", "y", "pendiente")

ggplot(df_pend) +
  geom_raster(aes(x, y, fill = pendiente)) +
  scale_fill_viridis_c(option = "C") +
  coord_equal() +
  labs(title = "Mapa de Pendiente", fill = "Grados") +
  theme_minimal()
```

---

## **8. Conclusiones**

- La distancia a caminos es una variable espacial clave para analizar **accesibilidad, disturbios o gradientes antrópicos**.  
- La pendiente y exposición son variables topográficas esenciales para estudios **ecológicos y climáticos**.  
- Estas tres capas pueden utilizarse como **predictores en modelos de distribución de especies o análisis de paisaje**.

---

### **Productos esperados**

- `Distancia_Caminos.tif`  — Mapa continuo de distancia a caminos.  
- `Pendiente.tif` — Mapa de pendiente en grados.  
- `Exposicion.tif` — Mapa de exposición (orientación de laderas).
  
    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025


