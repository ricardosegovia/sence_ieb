---
layout: default
title: "Biomod2 actual y futuro"
description: "Modelamiento de distribución actual y futuro"
section: cambio-climático
order: 51
---
# 📘 Modelamiento de Distribución de Especies (SDM) con CHELSA + BIOMOD2   
---

Este documento es un **manual** que detalla **cada línea del script**, su propósito, fundamentos ecológicos y estadísticos, decisiones metodológicas (umbrales, PA ratio, métricas), y las mejores prácticas para reproducir un SDM.

---

# 🧭 **Índice**
1. Introducción  
2. Carga de librerías  
3. Función para cargar CHELSA (bio1–bio19)  
4. Importación de capas climáticas  
5. Descarga de ocurrencias desde GBIF  
6. Recorte espacial por región  
7. Selección de variables ambientales (VIF)  
8. Generación de pseudoausencias  
9. Formateo de datos para BIOMOD2  
10. Configuración de modelos  
11. Validación cruzada  
12. Modelamiento con BIOMOD2  
13. Ensamble de modelos (TSS ≥ 0.7)  
14. Proyección a escenarios futuros  
15. Exportación de mapas  
16. Generación de mapas binarios (umbral TSS)  
17. Cálculo de pérdida/ganancia/estabilidad  
18. Gráficos de cambio  
19. Cálculo de áreas en km²  
20. Importancia de variables  
21. Mapas comparativos finales  

---

# 🚀 **1. Introducción**

Este tutorial implementa un flujo **completo** para modelar la distribución de una especie usando:

- **Datos climáticos CHELSA** (actuales y futuros).
- **GBIF** para obtener datos de ocurrencia.
- **BIOMOD2** para modelamiento, ensamble y proyecciones.
- **VIF** para selección de variables.
- **Mapas de cambio** para pérdida, ganancia y estabilidad.

El objetivo es que cualquier usuario —independiente de su especie o región— pueda:

1. **Cargar datos climáticos**
2. **Seleccionar variables no colineales**
3. **Generar pseudoausencias**
4. **Entrenar modelos multialgoritmos**
5. **Validar, ensamblar y proyectar**
6. **Cuantificar cambios futuros**

Este script sigue estándares publicados en **SDM Best Practices (Araújo & Guisan 2006, Franklin 2010)**.

---

# 📦 **2. Carga de librerías**

```r
library(terra)
library(sf)
library(rgbif)
library(dplyr)
library(biomod2)
library(usdm)
library(writexl)
library(ggplot2)
library(viridis)
library(pROC)
library(rnaturalearth)
```

### ¿Por qué estas librerías?
- **terra** → base para trabajo raster moderno.
- **sf** → manejo robusto de vectores.
- **rgbif** → descendencia directa de datos GBIF vía API.
- **biomod2** → framework estándar para SDMs.
- **usdm** → selección de variables por colinealidad (VIF).
- **ggplot2/viridis** → visualización profesional.
- **pROC** → métricas adicionales.
- **rnaturalearth** → fronteras y capas administrativas.

---

# 📁 **3. Setear directorio de trabajo**

```r
setwd("D:/Licitación Cambio Climático/Licitación Cambio Climatico/")
```

**Explicación:**  
Toda la escritura/lectura será relativa a esta carpeta.

---

# 🧠 **4. Función para cargar CHELSA**

```r
load_chelsa <- function(path){

  files <- list.files(
    path = path,
    pattern = "\.(tif|tiff|TIF|TIFF)$",
    full.names = TRUE,
    recursive = TRUE
  )

  if(length(files) == 0){
    stop("❌ No se encontraron archivos .tif en: ", path)
  }

  bio_num <- as.numeric(sub(".*bio([0-9]+).*", "\1", basename(files)))
  files <- files[order(bio_num)]

  r <- rast(files)
  names(r) <- paste0("bio", seq_len(nlyr(r)))

  return(r)
}
```

### ¿Qué hace y por qué?
- Escanea la carpeta CHELSA.
- Ordena archivos por bio1, bio2…, bio19.
- Los carga como un **SpatRaster multibanda**.
- Estándar para cualquier usuario.

---

# 🌡️ **5. Cargar capas climáticas**

```r
chelsa_current <- load_chelsa(".../Chelsa actual/")
chelsa_2040_ssp126 <- load_chelsa(".../Chelsa 2040/")
chelsa_2100_ssp585 <- load_chelsa(".../Chelsa 2100/")
```

Cada conjunto contiene **bio1–bio19** para:

- Clima actual  
- SSP1-2.6 para 2040  
- SSP5-8.5 para 2100  

---

# 🌍 **6. Descarga de ocurrencias desde GBIF**

```r
gb <- occ_search(
  scientificName = "Araucaria araucana",
  limit = 5000,
  hasCoordinate = TRUE
)
```

### ¿Por qué estos filtros?
- **limit=5000** → captura adecuada sin saturar API.
- **hasCoordinate=TRUE** → elimina registros sin ubicación.

---

### Limpieza básica

```r
occ <- gb$data |> 
  select(decimalLongitude, decimalLatitude) |>
  filter(!is.na(decimalLongitude), !is.na(decimalLatitude)) |>
  distinct()
```

### Conversión a sf

```r
occ_sf <- st_as_sf(occ, coords=c("decimalLongitude","decimalLatitude"), crs=4326)
```

---

# 🗺️ **7. Recorte espacial por región**

```r
cl <- ne_states(country="Chile", returnclass="sf")
araucania <- cl |> filter(name == "La Araucanía")
ar_vec <- vect(araucania)
```

### ¿Para qué?
- Reduce el área de modelamiento.
- Evita ruido de otras regiones.
- Acelera el modelado.

Luego:

```r
chelsa_current_ar     <- mask(crop(chelsa_current, ar_vec), ar_vec)
```

---

# 🔍 **8. Selección de variables por VIF**

```r
vals <- na.omit(as.data.frame(chelsa_current_ar))
v <- vifstep(vals, th=10)
sel_vars <- v@results$Variables
```

### ¿Por qué VIF?
Evita **colinealidad**, problema clave en variables bioclimáticas.  
Umbral **VIF < 10** → recomendado en SDMs (Dormann et al. 2013).

---

# 🧪 **9. Generación de pseudoausencias**

### Calcular número de presencias

```r
n_pres <- nrow(occ_sf)
n_pa   <- n_pres * 2
```

### ¿Por qué razón PA = 2:1?

Fundamentos:
- Relación recomendada por **Barbet-Massin et al. (2012)**.
- Balance adecuado entre sensibilidad y especificidad.
- Evita sesgos en modelos logísticos y árboles.

### Muestreo aleatorio dentro del área

```r
set.seed(777)
pa <- spatSample(chelsa_current_sel[[1]], n_pa, method="random", as.points=TRUE)
```

---

# 🧱 **10. Formateo BIOMOD2**

```r
bm_data <- BIOMOD_FormatingData(
  resp.var  = resp,
  resp.xy   = resp_xy,
  resp.name = "Araucaria_araucana",
  expl.var  = chelsa_current_sel,
  PA.nb.rep = 0
)
```

### ¿Por qué PA.nb.rep=0?
Ya generamos PA manualmente.

---

# ⚙️ **11. Opciones de modelos**

### GLM

```r
glm_mod$type <- "quadratic"
glm_mod$test <- "AIC"
```

✔ La forma cuadrática captura curvaturas en respuestas climáticas.  
✔ AIC selecciona el modelo óptimo penalizando complejidad.

---

### GAM

```r
gam_mod$k <- 4
```

✔ `k=4` evita sobreajuste.  
✔ GAM puede sobreajustar si no se controla suavizado.

---

### GBM

```r
gbm_mod$n.trees <- 2000
gbm_mod$shrinkage <- 0.01
```

✔ 2000 árboles es estándar.  
✔ shrinkage bajo estabiliza el aprendizaje.

---

### ANN

```r
ann_mod$size <- 10
ann_mod$decay <- 0.05
```

✔ 10 neuronas → complejidad media.  
✔ decay controla regularización.

---

# 🔁 **12. Validación cruzada**

```r
cv <- bm_CrossValidation(
  strategy = "random",
  nb.rep = 5,
  perc = 0.7
)
```

### ¿Por qué 5 repeticiones?
Evita dependencia en una única partición.

---

# 🔮 **13. Modelamiento**

```r
modelOut <- BIOMOD_Modeling(
  models = c("GLM","GAM","GBM","ANN"),
  CV.strategy = "random",
  CV.nb.rep = 5,
  CV.perc = 0.7,
  OPT.strategy = "bigboss",
  metric.eval = c("TSS","ROC")
)
```

### ¿Por qué TSS y ROC?
- **ROC/AUC** mide ranking general.  
- **TSS** mide balance sensibilidad-especificidad, recomendado en ensambles.

---

# 🧬 **14. Ensamble**

```r
ens_out <- BIOMOD_EnsembleModeling(
  em.algo = c("EMmean","EMwmean"),
  metric.select = "TSS",
  metric.select.thresh = c(TSS=0.7)
)
```

### ¿Por qué TSS ≥ 0.7?
- Categoría **“bueno”** según Swets (1988).
- Evita modelos poco informativos.
- Estándar en BIOMOD2.

---

# 🌎 **15. Proyecciones futuras**

Se realizan para:

- Clima actual  
- SSP126 2040  
- SSP585 2100  

Incluyendo **clamping**, que identifica zonas extrapoladas.

---

# 🧱 **16. Mapas binarios**

```r
bin_current <- r_current > 0.7
```

### ¿Por qué 0.7?
Umbral basado en TSS, típicamente el valor que optimiza sensibilidad + especificidad en SDM binarios.

---

# 🔄 **17. Mapas de pérdida/ganancia**

Valores:

- **-1 = pérdida**
- ** 0 = ausencia estable**
- ** 1 = ganancia**
- ** 2 = estabilidad**

Reclasificación:

```r
reclass_num <- matrix(c(
  -1, 1,
  0, 2,
  1, 3,
  2, 4
), ncol = 2, byrow = TRUE)
```

---

# 📊 **18. Mapas con ggplot2**

Mapa facetado por escenario.  
Colores seleccionados por semántica ecológica:

- Rojo → pérdida  
- Azul → ganancia  
- Verde → estabilidad  

---

# 📐 **19. Cálculo de áreas (km²)**

CHELSA ≈ **1 km resolución**, por lo tanto:

```r
area_pixel <- 1
```

Total = suma de píxeles * 1 km².

---

# 🧪 **20. Importancia de variables**

```r
varimp <- as.data.frame(get_variables_importance(modelOut))
```

Permite evaluar las variables ambientales que más influyeron.

---


    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025


