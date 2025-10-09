---
layout: default
title: "Descarga y limpieza de datos de ocurrencia desde GBIF"
description: "Flujo de trabajo en R para descargar, combinar y limpiar registros de ocurrencia usando datos de GBIF."
section: datos
order: 30
---

# Descarga y limpieza de datos de ocurrencia desde GBIF

Este tutorial muestra cómo automatizar la descarga de registros de ocurrencia desde **GBIF**, combinarlos y realizar una limpieza básica de coordenadas utilizando el paquete **CoordinateCleaner**.  
El flujo está diseñado para obtener datos de especies **nativas o endémicas arbóreas de Chile**, recortar el conjunto al territorio continental y eliminar coordenadas erróneas.

---

## 🔹 1. Cargar librerías necesarias

```r
library(readxl)
library(tidyr)
library(dplyr)
library(rgbif)
source("R/combina_gbif_data.r")
library(sf)
library(rnaturalearth)
library(CoordinateCleaner)
```

> 💡 Asegúrate de que el script `combina_gbif_data.r` contenga la función `unificar_y_combinar_datasets()` que combina los archivos descargados.

---

## 🔹 2. Configurar credenciales y cargar el catálogo

```r
# user <- "tu.usuario.gbif"      # Reemplaza con tu usuario GBIF
# pwd  <- "tu.contraseña.gbif"   # Reemplaza con tu contraseña GBIF
# email <- "tu.correo"

# 1. Cargar el catálogo local de especies
cat <- read_excel("/ruta/a/Catalogo.xlsx")

# 2. Filtrar especies válidas, determinadas y de hábito arbóreo
species_list <- cat %>%
  filter(determined == TRUE) %>%
  filter(status %in% c("Endémica", "Nativa") | is.na(status)) %>%
  filter(plant_habit_1 == "Árbol") %>%
  pull(scientific_name) %>%
  unique()
```

---

## 🔹 3. Descargar datos de GBIF por especie

```r
datasets_list <- list()

for (species_name in species_list) {
  cat("Procesando:", species_name, "\n")

  # Obtener taxonKey
  taxon_info <- name_backbone(species_name)
  taxon_key <- taxon_info$usageKey

  # Definir descarga desde GBIF
  gbif_download <- occ_download(
    pred("taxonKey", taxon_key),
    pred("country", "CL"),
    pred("hasGeospatialIssue", FALSE),
    pred("hasCoordinate", TRUE),
    pred("occurrenceStatus", "PRESENT"),
    pred_gte("year", 2000),
    user = user, pwd = pwd, email = email,
    format = "SIMPLE_CSV"
  )

  # Esperar y descargar resultados
  occ_download_wait(gbif_download)
  data_downloaded <- occ_download_get(gbif_download) |> occ_download_import()

  # Almacenar
  datasets_list[[species_name]] <- data_downloaded
  cat("Completado:", species_name, "\n")
}
```

---

## 🔹 4. Combinar y exportar los datos

```r
# Estandarizar columnas antes de combinar
datasets_list_clean <- lapply(datasets_list, function(df) {
  df %>%
    mutate(
      catalogNumber = as.character(catalogNumber),
      institutionCode = as.character(institutionCode)
    )
})

# Combinar datasets
combined_data <- unificar_y_combinar_datasets(datasets_list_clean)

# Exportar
write.csv(combined_data, "data/combined_gbif_data.csv", row.names = FALSE)
```

---

## 🔹 5. Limpieza y recorte espacial

```r
combined_data <- read.csv("data/combined_gbif_data.csv") %>%
  select(
    scientificName, catalogNumber, institutionCode,
    decimalLatitude, decimalLongitude, year, month, day
  ) %>%
  filter(!is.na(decimalLatitude) & !is.na(decimalLongitude)) %>%
  distinct()

# Convertir a objeto espacial
occs_sf <- st_as_sf(combined_data, coords = c("decimalLongitude", "decimalLatitude"), crs = 4326)

# Descargar y recortar capa de Chile
chile <- ne_countries(scale = "medium", country = "Chile", returnclass = "sf")
chile_continental <- st_crop(chile, xmin = -76, xmax = -66, ymin = -56, ymax = -17)

# Intersección espacial
occs_crop <- st_filter(occs_sf, chile_continental)

# Extraer coordenadas de vuelta al data.frame
occs_crop_df <- occs_crop %>%
  mutate(
    decimalLongitude = st_coordinates(geometry)[, 1],
    decimalLatitude  = st_coordinates(geometry)[, 2]
  ) %>%
  st_drop_geometry()
```

---

## 🔹 6. Limpieza de coordenadas con *CoordinateCleaner*

```r
# Seleccionar columnas mínimas requeridas
clean_input <- occs_crop_df %>%
  select(
    species = scientificName,
    decimalLatitude,
    decimalLongitude,
    year
  ) %>%
  mutate(iso_a2 = "CL")

# Aplicar filtros sugeridos por Zizka et al. (2019)
cc_flags <- clean_coordinates(
  x = clean_input,
  lon = "decimalLongitude",
  lat = "decimalLatitude",
  species = "species",
  countries = "iso_a2",
  tests = c("capitals", "centroids", "equal", "gbif", "institutions",
            "seas", "zeros", "urban"),
  value = "flagged"
)

# Conservar solo los registros válidos
occs_limpias <- occs_crop_df[cc_flags, ]

# Guardar resultados
write.csv(occs_limpias, "data/occs_limpias.csv", row.names = FALSE)
```

---

## 🔹 7. Resumen del flujo de trabajo

1. Cargar y filtrar especies válidas desde un catálogo local.  
2. Descargar registros de ocurrencia desde GBIF usando `rgbif`.  
3. Combinar y estandarizar los datasets.  
4. Recortar espacialmente al territorio continental chileno.  
5. Aplicar controles de calidad geográfica con `CoordinateCleaner`.  
6. Exportar el conjunto final de datos limpios.

---

## 🔹 8. Referencias

- Zizka, A., Silvestro, D., Andermann, T. *et al.* (2019). **CoordinateCleaner: Standardized cleaning of occurrence records from biological collection databases.** *Methods in Ecology and Evolution*, 10, 744–751.  
- [GBIF API Documentation](https://www.gbif.org/developer/occurrence)  
- [rgbif R package](https://cran.r-project.org/package=rgbif)