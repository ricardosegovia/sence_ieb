---
layout: default
title: "Ver las ocurrencias sobre un mapa"
description: "Aprende a visualizar las ocurrencias que descargaste del GBIF"
section: modelado
order: 31
---



# 🗺️ Tutorial: Convertir un Excel a Shapefile (EPSG:4326) en R

## 1️⃣ Instalar y cargar paquetes necesarios

```r
# Instalar packages
install.packages(c("readxl", "sf", "dplyr"))

# Cargar librerías
library(readxl)   # para leer Excel
library(sf)       # para manejar shapefiles y proyecciones
library(dplyr)    # para manipular datos
```

---

## 2️⃣ Importar el archivo Excel

Tu archivo Excel debe tener **al menos las columnas con coordenadas**, por ejemplo `lon` y `lat`.

```r
# Cargar el archivo Excel (ajusta la ruta y nombre del archivo)
data_excel <- read_excel("datos_puntos.xlsx")

# Verifica las primeras filas
head(data_excel)
```

Asegúrate de que las columnas de coordenadas estén correctamente nombradas y en formato numérico:

```r
# Cambiar nombres si es necesario
data_excel <- data_excel %>%
  rename(Longitud = lon, Latitud = lat)
```

---

## 3️⃣ Convertir a objeto espacial (sf)

Transforma los datos en un objeto espacial `sf` con la proyección **EPSG:4326 (WGS84)**:

```r
# Crear objeto sf
puntos_sf <- st_as_sf(data_excel, 
                      coords = c("Longitud", "Latitud"), 
                      crs = 4326)  # EPSG:4326 = WGS84

# Verifica el resultado
print(puntos_sf)
```

Si tus coordenadas están en otro sistema (por ejemplo **UTM**), primero usa ese CRS y luego reproyecta:

```r
# Ejemplo con coordenadas UTM 19S
puntos_sf <- st_as_sf(data_excel, coords = c("x", "y"), crs = 32719)
puntos_sf <- st_transform(puntos_sf, 4326)
```

---

## 4️⃣ Exportar a Shapefile

Finalmente, guarda el archivo shapefile en una carpeta de salida:

```r
# Crear carpeta de salida si no existe
dir.create("shapefiles", showWarnings = FALSE)

# Exportar a shapefile
st_write(puntos_sf, "shapefiles/puntos_4326.shp", delete_layer = TRUE)
```

Esto generará varios archivos:

```
puntos_4326.shp  
puntos_4326.shx  
puntos_4326.dbf  
puntos_4326.prj
```

---

## 5️⃣ Comprobación de la proyección

```r
st_crs(puntos_sf)
```

Debe mostrar algo como:

```
EPSG: 4326 
WGS 84
```

📘 **Autor:** Eduardo Fuentes
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025