# 📘 Tutorial: Cargar un archivo Excel o CSV y convertirlo a proyección EPSG:4326 (WGS84) en R

Este tutorial muestra cómo cargar datos desde un archivo **Excel (.xlsx)** o **CSV (.csv)** con coordenadas, y luego convertirlos en un objeto espacial con la proyección geográfica **EPSG:4326** utilizando el paquete `sf`.

---

## 🧩 1️⃣ Instalar y cargar los paquetes necesarios

```r
# Instalar paquetes (solo la primera vez)
install.packages(c("readxl", "sf", "dplyr"))

# Cargar las librerías
library(readxl)   # Para leer archivos Excel (.xlsx)
library(sf)       # Para manejar datos espaciales y proyecciones
library(dplyr)    # Para manipular datos
```

---

## 📂 2️⃣ Cargar el archivo Excel

Tu archivo Excel debe tener columnas con las coordenadas, por ejemplo `lon` y `lat`.

```r
# Cargar archivo Excel
data_excel <- read_excel("datos/puntos.xlsx")

# Revisar las primeras filas
head(data_excel)

# Cambiar nombres de columnas si es necesario
data_excel <- data_excel %>%
  rename(Longitud = lon, Latitud = lat)
```

---

## 📄 3️⃣ Cargar el archivo CSV (alternativa)

Si tus datos están en formato CSV:

```r
# Cargar archivo CSV
data_csv <- read.csv("datos/puntos.csv", sep = ",", dec = ".", header = TRUE)

# Revisar las primeras filas
head(data_csv)

# Cambiar nombres si es necesario
data_csv <- data_csv %>%
  rename(Longitud = lon, Latitud = lat)
```

---

## 🌍 4️⃣ Convertir los datos a objeto espacial (sf)

Tanto `data_excel` como `data_csv` pueden convertirse en un objeto espacial `sf`.  
Si tus coordenadas están en grados decimales, usa directamente EPSG:4326.

```r
# Para datos del Excel
puntos_excel_sf <- st_as_sf(data_excel, coords = c("Longitud", "Latitud"), crs = 4326)

# Para datos del CSV
puntos_csv_sf <- st_as_sf(data_csv, coords = c("Longitud", "Latitud"), crs = 4326)
```

Si tus coordenadas están en otro sistema (por ejemplo UTM), primero asigna ese CRS y luego reproyecta a 4326:

```r
# Ejemplo: tus datos están en UTM zona 19S (EPSG:32719)
puntos_excel_sf <- st_as_sf(data_excel, coords = c("x", "y"), crs = 32719)

# Reproyectar a WGS84
puntos_excel_sf <- st_transform(puntos_excel_sf, 4326)
```

---

## 🗺️ 5️⃣ Verificar la proyección

```r
st_crs(puntos_excel_sf)
```

Debe mostrar algo como:

```
Coordinate Reference System:
  EPSG: 4326 
  WGS 84
```

---

## 💾 6️⃣ Exportar a Shapefile o GeoPackage

Puedes guardar tu capa espacial en formato shapefile o geopackage:

```r
# Crear carpeta de salida si no existe
dir.create("shapefiles", showWarnings = FALSE)

# Guardar como shapefile
st_write(puntos_excel_sf, "shapefiles/puntos_4326.shp", delete_layer = TRUE)

# Guardar como GeoPackage (opcional)
st_write(puntos_excel_sf, "shapefiles/puntos_4326.gpkg", delete_layer = TRUE)
```

---

## ✅ Recomendaciones

- Verifica siempre que las columnas de coordenadas estén en formato numérico.  
- Si usas `read_excel()`, asegúrate de que la hoja tenga encabezados claros (`lon`, `lat`, etc.).  
- EPSG:4326 es el sistema estándar de coordenadas geográficas (lat/long) compatible con Google Earth, QGIS y la mayoría de los SIG.

---

> 📘 **Referencias útiles:**  
> - Paquete `sf`: [https://r-spatial.github.io/sf/](https://r-spatial.github.io/sf/)  
> - EPSG codes: [https://epsg.io/](https://epsg.io/)
