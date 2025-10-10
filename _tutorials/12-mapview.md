---
layout: default
title: "Ver las ocurrencia sobre un mapa"
description: "Aprende a visualizar las ocurrencias que descargaste del GBIF"
section: datos
order: 12
---



# Tutorial: Visualizar ocurrencias de GBIF sobre un mapa con `treemapview`

**Objetivo:**  
Aprender a cargar los datos descargados desde GBIF, transformarlos en objetos espaciales y visualizarlos sobre un mapa interactivo con el paquete `treemapview`.

---

## 🧩 1) Preparar el entorno

Instala y carga los paquetes necesarios:

```r
install.packages(c("readr", "dplyr", "sf", "treemapview"))
```

Luego cárgalos:

```r
library(readr)
library(dplyr)
library(sf)
library(treemapview)
```

> 💡 `treemapview` es un paquete versátil que combina gráficos de mapa interactivos con funcionalidades de `leaflet`.  
> Si no se instala correctamente, asegúrate de tener `leaflet` y `sf` instalados.

---

## 📥 2) Cargar los datos de ocurrencia

Supongamos que descargaste un archivo `occurrence.csv` desde GBIF (ver tutorial anterior).

```r
datos <- read_csv("occurrence.csv")

# Revisar las primeras columnas
head(datos[, 1:6])
```

Las columnas más importantes para la visualización son:
- `decimalLatitude`
- `decimalLongitude`
- `scientificName`
- `basisOfRecord`
- `eventDate`

---

## 🧹 3) Filtrar y limpiar los datos

Removemos filas sin coordenadas y con valores extremos (fuera de Chile, por ejemplo):

```r
datos_filtrados <- datos %>%
  filter(!is.na(decimalLatitude),
         !is.na(decimalLongitude),
         decimalLatitude > -60,
         decimalLatitude < -17,
         decimalLongitude > -80,
         decimalLongitude < -65)
```

---

## 🌍 4) Convertir a objeto espacial (`sf`)

Creamos un objeto espacial para visualizarlo:

```r
ocurrencias_sf <- st_as_sf(
  datos_filtrados,
  coords = c("decimalLongitude", "decimalLatitude"),
  crs = 4326  # EPSG:4326 = WGS84 (lat/lon)
)
```

Comprobamos el resultado:

```r
ocurrencias_sf
```

---

## 🗺️ 5) Visualizar en un mapa interactivo con `treemapview`

### Mapa básico

```r
tmap_mode("view")  # modo interactivo
tm_shape(ocurrencias_sf) +
  tm_dots(col = "blue", size = 0.05)
```

### Personalizar el mapa

```r
tm_shape(ocurrencias_sf) +
  tm_dots(col = "scientificName", size = 0.07, palette = "Dark2") +
  tm_basemap("Esri.WorldTopoMap") +
  tm_view(set.view = c(-71, -38, 5))  # centrar sobre Chile
```

---

## 🧭 6) Opcional: Mapear con capas de referencia

Puedes agregar límites de países o regiones con `rnaturalearth`:

```r
install.packages("rnaturalearth")
library(rnaturalearth)

chile <- ne_countries(country = "Chile", returnclass = "sf")

tm_shape(chile) +
  tm_polygons(col = "gray90", border.col = "gray60") +
  tm_shape(ocurrencias_sf) +
  tm_dots(col = "red", size = 0.07, alpha = 0.6)
```

---

## 🔎 7) Explorar registros individuales

El mapa interactivo permite hacer clic en los puntos para inspeccionar los registros (nombre científico, fecha, fuente).  
Si el archivo original incluye la columna `datasetName`, puedes mostrarla:

```r
tm_shape(ocurrencias_sf) +
  tm_dots(
    col = "basisOfRecord",
    size = 0.07,
    popup.vars = c("Nombre científico" = "scientificName",
                   "Dataset" = "datasetName",
                   "Fecha" = "eventDate")
  )
```

---

## 🧾 8) Guardar el mapa como archivo HTML

Puedes exportar el mapa interactivo:

```r
mapa <- tm_shape(ocurrencias_sf) +
  tm_dots(col = "scientificName", size = 0.05)

tmap_save(mapa, "ocurrencias_interactivas.html")
```

Esto generará un archivo que puedes abrir en cualquier navegador web.

---

## 🎯 Resumen

| Acción | Resultado |
|:--|:--|
| Cargar CSV de GBIF | Datos listos para análisis |
| Limpiar coordenadas | Eliminación de registros inválidos |
| Convertir a `sf` | Datos espaciales listos para mapear |
| Visualizar con `treemapview` | Mapa interactivo y personalizable |
| Exportar como HTML | Mapa reutilizable fuera de R |

---

📘 **Autor:** Ricardo Segovia  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025