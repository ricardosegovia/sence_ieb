---
layout: default
title: "Visualizar jerarquías taxonómicas con un gráfico Sunburst"
description: "Aprende a usar datos de GBIF para construir un gráfico circular jerárquico (Orden → Familia → Especie) con Plotly"
section: datos
order: 13
---

# Tutorial: Visualizar jerarquías taxonómicas con un gráfico Sunburst 🌳

**Objetivo:**  
Aprender a obtener información taxonómica desde GBIF y visualizarla de forma jerárquica mediante un gráfico circular interactivo tipo *Sunburst*.

---

## 🧩 1) Preparar el entorno

Instala y carga los paquetes necesarios:

<div class="language-r highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">install.packages</span><span class="p">(</span><span class="s2">"rgbif"</span><span class="p">)</span>
<span class="n">install.packages</span><span class="p">(</span><span class="s2">"plotly"</span><span class="p">)</span>
<span class="n">install.packages</span><span class="p">(</span><span class="s2">"dplyr"</span><span class="p">)</span>
</code></pre></div></div>

Luego cárgalos:

```r
library(rgbif)
library(plotly)
library(dplyr)
```

> 💡 Si `plotly` no se instala correctamente, asegúrate de tener actualizado R y Rtools.  
> `plotly` permite generar visualizaciones interactivas en HTML directamente desde R.

---

## 🌱 2) Cargar los datos

Asegúrate de tener tu archivo `arboles_chile.csv` en el mismo directorio del script.  
Debe contener al menos una columna con los nombres científicos de las especies.

```r
arboles <- read.csv("./arboles_chile.csv")
colnames(arboles) <- c("num", "scientificName")
```

---

## 🔎 3) Obtener la taxonomía superior desde GBIF

Con `name_backbone_checklist()` puedes consultar la **taxonomía backbone de GBIF**, obteniendo órdenes, familias y especies aceptadas.

```r
tax_completa <- name_backbone_checklist(unique(arboles$scientificName))
dim(tax_completa)
head(as.data.frame(tax_completa))
```

Seleccionamos las columnas relevantes:

```r
arboles_tax <- tax_completa[, c("order", "family", "scientificName", "status", "species")]
```

Visualiza los estados detectados (Accepted, Synonym, etc.):


```r
unique(arboles_tax$status)
print(arboles_tax[!arboles_tax$status == "ACCEPTED", ])
```

---

## 🌿 4) Filtrar solo los nombres aceptados

Creamos una versión del conjunto de datos solo con nombres aceptados:

```r
arboles_revisado <- arboles_tax[arboles_tax$status == "ACCEPTED", ]
```

---

## 🍃 5) Preparar los datos para el gráfico Sunburst

Creamos una tabla limpia con el orden, familia y especie:

```r
arboles_sunburst <- arboles_revisado[, c("order", "family", "scientificName")]
colnames(arboles_sunburst) <- c("Order", "Family", "Species")

arboles_sunburst <- arboles_sunburst |>
  mutate(
    Order  = trimws(as.character(Order)),
    Family = trimws(as.character(Family)),
    Species= trimws(as.character(Species))
  ) |>
  filter(
    !is.na(Order),  Order  != "",
    !is.na(Family), Family != "",
    !is.na(Species),Species!= ""
  ) |>
  distinct()
```

---

## 🌸 6) Construir la jerarquía de nodos

Definimos los niveles jerárquicos (Orden → Familia → Especie) y un nodo raíz:

```r
root_id <- "Arboles_de_Chile"

ordenes <- arboles_sunburst %>%
  distinct(Order) %>%
  mutate(id = Order, label = Order, parent = root_id)

familias <- arboles_sunburst %>%
  distinct(Order, Family) %>%
  mutate(id = paste(Order, Family, sep = "-"),
         label = Family,
         parent = Order)

especies <- arboles_sunburst %>%
  mutate(id = paste(Order, Family, Species, sep = "-"),
         label = Species,
         parent = paste(Order, Family, sep = "-"))

root <- data.frame(id = root_id, label = "Árboles de Chile", parent = NA_character_, stringsAsFactors = FALSE)

sunburst_data <- bind_rows(
  root,
  ordenes %>% select(id, label, parent),
  familias %>% select(id, label, parent),
  especies %>% select(id, label, parent)
)
```

---

## 🌞 7) Crear el gráfico Sunburst interactivo

Finalmente, usamos `plotly` para generar el gráfico circular jerárquico:

```r
fig <- plot_ly(
  data = sunburst_data,
  type = "sunburst",
  ids = ~id,
  labels = ~label,
  parents = ~parent,
  maxdepth = 3
) %>%
  layout(title = "Sunburst: Orden → Familia → Especie (Árboles de Chile)")

fig
```

---

## 🌳 Resultado

El gráfico resultante muestra la estructura jerárquica de las especies de árboles de Chile, desde el **orden** hasta las **especies**.

> 🌐 Este tipo de visualización permite explorar la composición taxonómica de conjuntos de datos biológicos y detectar rápidamente qué grupos dominan o están más representados.

---

<div align="center">
  <img src="/assets/img/E_Canelo.png" alt="Canelo" width="120"/>
  <img src="/assets/img/E_Coihue.png" alt="Coihue" width="120"/>
  <img src="/assets/img/E_Chinita.png" alt="Chinita" width="120"/>
  <img src="/assets/img/E_Blechnum.png" alt="Helecho" width="120"/>
  <img src="/assets/img/E_Tineo.png" alt="Tineo" width="120"/>
</div>

---

📘 **Autor:** Ricardo Segovia  
🧩 **Proyecto:** Curso SENCE-IEB — *Gestión y modelamiento de datos de biodiversidad*  
📅 **Actualizado:** Octubre 2025
