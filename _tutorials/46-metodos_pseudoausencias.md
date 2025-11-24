---
layout: default
title: "Métodos para Generar Pseudoausencias en Modelamiento de Distribución de Especies"
description: "Principales estrategias para generar pseudoausencias (PA)"
section: SDM
order: 46
---
# Métodos para Generar Pseudoausencias en Modelamiento de Distribución de Especies (SDMs)

Este documento describe de forma clara, completa y práctica las principales estrategias para generar pseudoausencias (PA) en modelos de distribución de especies. Incluye fundamentos, ventajas, limitaciones y ejemplos en R para que puedan aplicarse en cualquier análisis.


# 1. Pseudoausencias aleatorias (Random PA)

Método más simple: selecciona puntos al azar dentro del área de estudio.

### Uso recomendado
- Cuando no existe evidencia de sesgo espacial fuerte.
- Área accesible bien definida.

### Código en R
```r
pa <- spatSample(raster_template, n = N, method="random", as.points=TRUE)
```

### Pros
- Rápido y robusto.
- Ampliamente utilizado en literatura.

### Contras
- Puede generar puntos muy cercanos a presencias.
- Puede seleccionar ambientes muy similares.

---

# 2. Pseudoausencias restringidas por accesibilidad (M-area)

Basado en el marco BAM de Soberón: solo se generan PA dentro del área que la especie ha podido colonizar.

### Código
```r
pa <- spatSample(mask(raster_template, M_polygon), n = N, method="random")
```

### Pros
- Evita extrapolación ecológicamente no realista.
- Considera dispersión histórica.

### Contras
- Requiere definir M adecuadamente.

---

# 3. Estratificación ambiental

Divide el espacio ambiental en grupos y toma PA representando esa diversidad.

### Código
```r
env <- na.omit(as.data.frame(stack_env))
k <- 50
km <- kmeans(env, centers = k)

pa <- env %>%
  mutate(cluster = km$cluster) %>%
  group_by(cluster) %>%
  sample_n(1)
```

### Pros
- Cobertura ambiental uniforme.
- Evita redundancia.

### Contras
- Decidir número de clusters (k).

---

# 4. Pseudoausencias con buffer

Impide seleccionar PA muy cerca de presencias reales.

### Código
```r
buffer_m <- 10000 # distancia en metros
pres_buf <- buffer(occ_sf, buffer_m)
pa_area <- erase(M_polygon, pres_buf)
pa <- spatSample(pa_area, n=N)
```

### Pros
- Minimiza confusión entre presencia/ausencia.
- Reduce sobreajuste.

### Contras
- Elegir tamaño del buffer requiere criterio ecológico.

---

# 5. Bias grid (pseudoausencias ponderadas por esfuerzo)

Imita el sesgo espacial de muestreo real (ej., cerca de caminos, ciudades o senderos).

### Código
```r
pa <- spatSample(bias_raster, n=N, method="probability")
```

### Pros
- Corrige sesgo de muestreo.
- Ideal en herbarios y colecciones con sesgo espacial fuerte.

### Contras
- Requiere una capa de esfuerzo (difícil de obtener).

---

# 6. Target-group background (TGBG)

Se generan PA usando registros de todas las especies colectadas bajo el mismo método/grupo taxonómico.

### Código
```r
tg <- read.csv("grupo_taxonomico.csv")
pa <- tg %>% select(lon,lat) %>% sample_n(N)
```

### Pros
- Representa esfuerzo de muestreo real.
- Muy robusto en estudios macroecológicos.

### Contras
- Necesita una gran base de datos taxonómica.

---

# 7. Pseudoausencias basadas en clustering ambiental

Divide el ambiente total en grupos homogéneos para seleccionar PA representativas.

### Código
```r
km <- kmeans(env, centers = 40)
# PA por cluster
```

### Pros
- Garantiza cobertura ambiental amplia.

### Contras
- Requiere preprocesamiento.

---

# 8. Máxima dispersión espacial (MaxDist / Maximin)

Genera PA lo más separadas posible y lejos de presencias.

### Código
```r
library(spatstat)
pp <- as.ppp(pres_xy, W=window)
pa <- rSSI(n=N, r=dist_min)
```

### Pros
- Reduce redundancia espacial.
- Útil para áreas extensas.

### Contras
- Computacionalmente costoso.

---

# 9. PA fuera del nicho ecológico (Envelope / Convex Hull)

Solo se generan PA fuera del espacio ambiental ocupado por las presencias.

### Código
```r
hull <- chull(env_pres)
pa <- sample_outside_hull(env_all, hull)
```

### Pros
- Evita puntos ambientalmente ambiguos.
- Reduce sobreajuste.

### Contras
- El nicho puede estar submuestreado.

---

# 10. Pseudoausencias iterativas (dos pasos)

1. Modelo inicial simple (SRE, GLM).  
2. PA generadas donde el modelo predice baja probabilidad.

### Pros
- Genera PA más informadas.
- Muy útil para especies mal muestreadas.

### Contras
- Depende del primer modelo.

---

# 11. Métodos de una sola clase (One-Class ML)

Ejemplo: SVM de una sola clase (OC-SVM).

### Uso
Define la región probable del nicho → PA fuera de ella.

### Pros
- Ideal para datos de presencia solamente.

### Contras
- Más complejo y menos difundido.

---

# 📊 Resumen Comparativo

| Método | Ventajas | Desventajas | Ideal para |
|-------|----------|-------------|------------|
| Aleatorio | Simple y reproducible | Ambiguo cerca de presencias | Áreas bien muestreadas |
| M-area | Ecológicamente realista | Requiere delimitar M | Estudios biogeográficos |
| Estratificado | Cubre ambiente completo | Requiere clustering | Regiones muy heterogéneas |
| Buffer | Reduce ambigüedad | Elegir buffer es crítico | Especies móviles o muestreo denso |
| Bias grid | Corrige sesgo | Requiere capa de esfuerzo | Herbarios, museos |
| TGBG | Representa esfuerzo real | Requiere base grande | Macroecología |
| MaxDist | PA muy diversas | Computo intensivo | Paisajes grandes |
| Envelope | Evita PA dentro del nicho | Nicho mal definido puede fallar | Nichos estrechos |
| Iterativas | PA más inteligentes | Depende del modelo inicial | Especies raras |
| One-class | Útil con pocos datos | Complejo | Casos críticos |

---
    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025
