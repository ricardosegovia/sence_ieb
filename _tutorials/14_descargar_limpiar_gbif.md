---
layout: default
title: "Descargar y limpiar datos de GBIF para múltiples especies"
description: "Aprende a descargar datos desde GBIF, combinarlos, limpiar coordenadas"
section: datos
order: 15
---

# Tutorial: Descargar y limpiar datos de GBIF para múltiples especies 🌳

**Objetivo:**  
Aprender a descargar datos de ocurrencia desde GBIF para una o varias especies, combinarlos en un solo conjunto de datos, limpiar coordenadas con `CoordinateCleaner`, y eliminar registros que se encuentren dentro de áreas urbanas usando datos de *OpenStreetMap*.

---

## 🧩 1) Preparar el entorno

Instala y carga los paquetes necesarios:

```r
install.packages(c(
  "readxl", "tidyr", "dplyr", "rgbif", "sf",
  "rnaturalearth", "CoordinateCleaner", "osmdata", "mapview"
))
```

Luego cárgalos:

```r
library(readxl)
library(tidyr)
library(dplyr)
library(rgbif)
library(sf)
library(rnaturalearth)
library(CoordinateCleaner)
library(osmdata)
library(mapview)
```

---

## 🌱 2) Descargar datos de GBIF para una especie

Para hacer descargas autenticadas en GBIF necesitas un usuario y contraseña registrados en [gbif.org](https://www.gbif.org/).

```r
user <- "tu.usuario.gbif"
pwd <- "tu.contraseña.gbif"
email <- "tu.correo"
```

Ejemplo con una especie:

```r
taxon_info <- name_backbone("Nothofagus pumilio")
taxon_key <- taxon_info$usageKey

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

occ_download_wait(gbif_download)

data_downloaded <- occ_download_get(gbif_download) |>
  occ_download_import()

##Revisa la tabla descargada
str(data_downloaded)
head(as.data.frame(data_downloaded))
```

---

## 🌿 3) Descargar datos para varias especies

Antes de automatizar la descarga para varias especies, es útil entender qué son los loops (bucles) en R.
Un loop permite repetir un conjunto de instrucciones varias veces sin tener que escribirlas manualmente para cada elemento.
Por ejemplo, si quisieras descargar los datos de cinco especies distintas, podrías escribir el mismo código cinco veces… pero con un loop puedes hacerlo de forma automatizada, una vez por cada especie en una lista.

En R, los loops más comunes son for, while y repeat.
En este caso usaremos un bucle for, que recorre los elementos de una lista (por ejemplo, nombres de especies) y ejecuta el mismo bloque de código para cada uno.

```r
arboles_rev <- read.csv("./arboles_chile_revisado.csv")

species_list <- sample(unique(arboles_rev$species), 5)
species_list

datasets_list <- list()

for (species_name in species_list) {

  cat("Processing:", species_name, "\n")

  taxon_info <- name_backbone(species_name)
  taxon_key <- taxon_info$usageKey

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

  occ_download_wait(gbif_download)

  data_downloaded <- occ_download_get(gbif_download) |>
    occ_download_import()

  datasets_list[[species_name]] <- data_downloaded

  cat("Completed:", species_name, "\n")
}
```
## 🧠 4) Vamos a combinar los datos

```r
datasets_list
datos_juntos <- rbind(datasets_list)
```
Fijate que encontramos un error porque muchas veces las tablas descargadas no son iguales en sus carácteróisitcas
---

## 🧠 4) Crear una función para combinar los datos
PAra resolver este error, tenemos que estandarizar las columnas de las tablas. Para hacer esto, lo más eficiente crear una función de pegado estandarizado.

En R, una función es un conjunto de instrucciones que se agrupan bajo un mismo nombre para reutilizarlas fácilmente.
Por ejemplo, en lugar de copiar y pegar varias líneas de código cada vez que queremos combinar archivos, podemos definir una función que haga ese trabajo por nosotros.
Esto permite mantener el código más limpio, ordenado y reutilizable, además de facilitar la detección de errores.

```r
unificar_y_combinar_datasets <- function(lista_df) {
  todas_columnas <- unique(unlist(lapply(lista_df, names)))

  lista_df <- lapply(lista_df, function(df) {
    faltantes <- setdiff(todas_columnas, names(df))
    for (col in faltantes) df[[col]] <- NA
    df <- df[, todas_columnas]
    return(df)
  })

  tipos_por_columna <- lapply(lista_df, function(df) sapply(df, class))
  tipos_df <- bind_rows(tipos_por_columna)
  columnas_conflictivas <- names(tipos_df)[apply(tipos_df, 2, function(x) length(unique(x)) > 1)]

  lista_df_limpia <- lapply(lista_df, function(df) {
    for (col in columnas_conflictivas) df[[col]] <- as.character(df[[col]])
    return(df)
  })

  bind_rows(lista_df_limpia)
}


```
> 💡 *Recuerda:* los paquetes son conjuntos de funciones que amplían las capacidades de R.

---

## 🗺️ 5) Ahora podemos unir y combinar los datasets para guardarlos como una tabla
```r
combined_data <- unificar_y_combinar_datasets(datasets_list)
write.csv(combined_data, "./combined_gbif_data.csv", row.names = FALSE)
```
## 🗺️ 5) Visualizar ocurrencias en un mapa interactivo

```r
#primero convertimos el data.frame creado en un objeto espacial
ocurrencias_sf <- st_as_sf(
  combined_data,
  coords = c("decimalLongitude", "decimalLatitude"),
  crs = 4326
)

#Además creamos un polígono para chile
chile <- ne_countries(country = "Chile", returnclass = "sf")

mapviewOptions(basemaps = c("OpenStreetMap", "Esri.WorldTopoMap", "CartoDB.Positron"))

mapview(chile, alpha.regions = 0.1, layer.name = "Chile") +
  mapview(ocurrencias_sf, zcol = "species", cex = 5, alpha = 0.7)
```

---

## 🧹 6) Limpiar coordenadas con `CoordinateCleaner`
Si observamos los datos, podemos ver que hay ocurrencias que parecen tener errores.
Estos errores deben ser limpiados.
```r
clean_input <- combined_data %>%
  select(
    species = scientificName,
    decimalLatitude,
    decimalLongitude,
    year
  ) %>%
  mutate(iso_a2 = "CL")

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

summary(cc_flags)

occs_limpias <- combined_data[cc_flags, ]

occs_limpias_sf <- st_as_sf(
  occs_limpias,
  coords = c("decimalLongitude", "decimalLatitude"),
  crs = 4326
)
```

Visualización rápida:

```r
mapview(chile, alpha.regions = 0.1, layer.name = "Chile") +
  mapview(occs_limpias_sf, zcol = "species", cex = 5, alpha = 0.7)
```

---

## 🏙️ 7) Excluir ocurrencias dentro de áreas urbanas (OpenStreetMap)
Parece razonable excluir arboles que puedan estar siendo cultivadas dentro de ciudades fuera del rango de distribución de las especies.


```r
chile_bb <- getbb("Chile")

urb_osm <- opq(chile_bb) %>%
  add_osm_feature(key = "landuse", value = "residential") %>%
  osmdata_sf()

urb_osm_sf <- urb_osm$osm_polygons |> st_make_valid()

occs_limpias_sf$in_urban <- lengths(st_intersects(occs_limpias_sf, urb_osm_sf)) > 0
table(occs_limpias_sf$in_urban)

occ_sin_urb <- occs_limpias_sf |> filter(!in_urban)
```

---

## 🗺️ 8) Visualizar datos limpios y no urbanos

```r
m_chile <- mapview(
  chile,
  alpha.regions = 0.1,
  color = "gray30",
  layer.name = "Chile"
)

m_urb <- mapview(
  urb_osm_sf,
  col.regions = "red",
  alpha.regions = 0.3,
  lwd = 0.3,
  layer.name = "Áreas urbanas"
)

m_occ <- mapview(
  occ_sin_urb,
  zcol = "species",
  cex = 5,
  alpha = 0.7,
  layer.name = "Ocurrencias sin urbanas"
)

m_chile + m_urb + m_occ
```

> 💡 Puedes activar o desactivar cada capa en la esquina superior derecha del mapa interactivo.

---

📘 **Autor:** Ricardo Segovia  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025
