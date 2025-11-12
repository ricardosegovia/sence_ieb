---
layout: default
title: "Modelamiento de distribución de especies"
description: "Aprende a realizar modelamiento de distribución de especies (GLM, GAM, RF)"
section: SDM
order: 42
---


# **Objetivo**

Ajustar, evaluar y proyectar modelos de distribución de especies usando tres enfoques estadísticos:  
- **GLM (Generalized Linear Model)**  
- **GAM (Generalized Additive Model)**  
- **Random Forest (RF)**  

El tutorial incluye el análisis de colinealidad (VIF), comparación de ajuste (AIC), desempeño predictivo (ROC–AUC) y la generación de mapas espaciales de probabilidad y presencia binaria.

---

## **Paquetes requeridos**

```r
library(terra)
library(sf)
library(dplyr)
library(mgcv)
library(randomForest)
library(car)
library(pROC)
library(ggplot2)
```

---

## **1. Cargar capas ambientales y de topografía**

```r
setwd("C:/Users/Usuario/Escritorio/Curso_Sence/")

bio1 <- rast("Chelsa_bio1_downscaled_30m.tif")
bio5 <- rast("Chelsa_bio5_downscaled_30m.tif")
bio6 <- rast("Chelsa_bio6_downscaled_30m.tif")
DEM  <- rast("Modelos/DEM_30m.tif")
pendiente <- rast("Pendiente.tif")
exposicion <- rast("Exposicion.tif")

predictors <- c(bio1, bio5, bio6, DEM, pendiente, exposicion)
names(predictors) <- c("bio1", "bio5", "bio6", "elev", "slope", "aspect")
```

---

## **2. Cargar datos de presencia y generar pseudoausencias**

```r
pres <- vect("Citronella_mucronata_Nuble_2000.shp")
pres <- project(pres, predictors)

# Extraer valores de presencia
pres_vals <- extract(predictors, pres)
pres_df <- as.data.frame(pres_vals)
pres_df$presence <- 1

# Generar pseudoausencias aleatorias
set.seed(123)
n_aus <- nrow(pres_df)
aus_points <- spatSample(predictors, size = n_aus, method = "random", as.points = TRUE)
aus_vals <- extract(predictors, aus_points)
aus_df <- as.data.frame(aus_vals)
aus_df$presence <- 0

# Combinar datos
df <- na.omit(rbind(pres_df, aus_df))
```

---

## **3. Diagnóstico de multicolinealidad (VIF)**

```r
vif_mod <- lm(bio1 ~ bio5 + bio6 + elev + slope + aspect, data = df)
vif(vif_mod)
```

> Variables con **VIF > 10** deben eliminarse o combinarse.

---

## **4. Ajuste de modelos de distribución**

### **GLM (binomial logit)**
```r
glm_mod <- glm(presence ~ bio1 + bio5 + bio6 + elev + slope + aspect,
               data = df, family = binomial)
summary(glm_mod)
```

### **GAM (no lineal)**
```r
gam_mod <- gam(presence ~ s(bio1) + s(bio5) + s(bio6) + s(elev) + s(slope) + s(aspect),
               data = df, family = binomial)
summary(gam_mod)
```

### **Random Forest (no paramétrico)**
```r
rf_mod <- randomForest(as.factor(presence) ~ bio1 + bio5 + bio6 + elev + slope + aspect,
                       data = df, ntree = 500, importance = TRUE)
print(rf_mod)
```

---

## **5. Evaluación del rendimiento (AIC y ROC–AUC)**

```r
# AIC (para GLM y GAM)
AIC(glm_mod, gam_mod)

# ROC–AUC
roc_glm <- roc(df$presence, predict(glm_mod, type = "response"))
roc_gam <- roc(df$presence, predict(gam_mod, type = "response"))
roc_rf  <- roc(df$presence, as.numeric(predict(rf_mod, type = "prob")[,2]))

data.frame(
  Modelo = c("GLM", "GAM", "Random Forest"),
  AUC = round(c(auc(roc_glm), auc(roc_gam), auc(roc_rf)), 3)
)
```

> El modelo con **AIC menor** y **AUC mayor** presenta el mejor balance entre ajuste y capacidad predictiva.

---

## **6. Proyección espacial de los modelos**

### **6.1 GLM**
```r
pred_glm <- predict(predictors, glm_mod, type = "response")
plot(pred_glm, main = "Probabilidad de presencia - GLM",
     col = hcl.colors(20, "YlGn", rev = TRUE))
points(pres, pch = 21, bg = "red")
```

### **6.2 GAM**
```r
pred_gam <- predict(predictors, gam_mod, type = "response")
plot(pred_gam, main = "Probabilidad de presencia - GAM",
     col = hcl.colors(20, "YlGn", rev = TRUE))
points(pres, pch = 21, bg = "red")
```

### **6.3 Random Forest**
```r
pred_rf <- predict(predictors, rf_mod, type = "prob", index = 2)
plot(pred_rf, main = "Probabilidad de presencia - Random Forest",
     col = hcl.colors(20, "YlGn", rev = TRUE))
points(pres, pch = 21, bg = "red")
```

---

## **7. Comparación visual entre modelos**

```r
par(mfrow = c(1, 3))
plot(pred_glm, main = "GLM", col = hcl.colors(20, "YlGn", rev = TRUE))
plot(pred_gam, main = "GAM", col = hcl.colors(20, "YlGn", rev = TRUE))
plot(pred_rf, main = "RF", col = hcl.colors(20, "YlGn", rev = TRUE))
par(mfrow = c(1, 1))
```

---

## **8. Binarización y cálculo de superficie**

```r
# Clasificar presencias con umbral de 0.7
presence_glm <- pred_glm > 0.7
presence_gam <- pred_gam > 0.7
presence_rf  <- pred_rf  > 0.7

# Calcular área de presencia (km²)
cell_area <- prod(res(pred_glm)) / 1e6
area_glm <- global(presence_glm, "sum", na.rm = TRUE)$sum * cell_area
area_gam <- global(presence_gam, "sum", na.rm = TRUE)$sum * cell_area
area_rf  <- global(presence_rf,  "sum", na.rm = TRUE)$sum * cell_area

data.frame(
  Modelo = c("GLM", "GAM", "RF"),
  Area_km2 = round(c(area_glm, area_gam, area_rf), 2)
)
```

---

## **9. Exportar resultados**

```r
writeRaster(pred_glm, "Pred_GLM_30m.tif", overwrite = TRUE)
writeRaster(pred_gam, "Pred_GAM_30m.tif", overwrite = TRUE)
writeRaster(pred_rf,  "Pred_RF_30m.tif",  overwrite = TRUE)
```

---

## **10. Conclusiones**

- **GLM**: Modelo lineal interpretativo, adecuado para relaciones simples.  
- **GAM**: Captura respuestas no lineales y complejas.  
- **Random Forest**: Alta precisión, robusto ante ruido, pero menos interpretable.  
- La proyección espacial permite visualizar áreas de alta probabilidad de presencia.  
- Se recomienda combinar modelos (ensamble) o aplicar validaciones cruzadas para mejorar robustez.

    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025

