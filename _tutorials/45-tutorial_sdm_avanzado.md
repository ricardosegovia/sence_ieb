---
layout: default
title: "Fundamentos Avanzados de Modelos de Distribución de Especies (SDMs)"
description: "Umbrales — Algoritmos BIOMOD2 — Pseudoausencias — Ensambles"
section: SDM
order: 45
---
# Fundamentos Avanzados de Modelos de Distribución de Especies (SDMs)
### Umbrales — Algoritmos BIOMOD2 — Pseudoausencias — Ensambles

Los Modelos de Distribución de Especies (SDMs) son hoy uno de los pilares metodológicos centrales de la biogeografía, la ecología predictiva y la conservación. Su importancia radica en que permiten inferir relaciones entre el ambiente y la presencia de especies usando datos georreferenciados, y luego proyectar estas relaciones a otros espacios o a escenarios climáticos futuros. Sin embargo, detrás de esta aparente simplicidad existe un conjunto amplio y sofisticado de decisiones metodológicas que determinan la calidad y la credibilidad de los resultados. Entre ellas, destacan cuatro aspectos clave: el uso de umbrales para evaluar y binarizar modelos, la elección de algoritmos, el diseño de pseudoausencias y el uso de ensambles para sintetizar información a través de métodos. Cada uno posee fundamentos teóricos sólidos, respaldados por literatura exhaustiva como el libro de Guisan et al. (2017), el artículo fundador de BIOMOD de Thuiller (2003) y las comparaciones exhaustivas realizadas por Hao et al. (2019, 2020). A continuación se presenta una exposición en profundidad de estos fundamentos, orientada a investigadores que buscan construir SDMs rigurosos y reproducibles.

---

# 1. El fundamento ecológico y estadístico de usar umbrales ≥ 0.7 en SDMs

El uso de umbrales para transformar valores continuos de idoneidad en predicciones de presencia/ausencia constituye uno de los pasos más críticos en la implementación de SDMs. Aunque los modelos entregan probabilidades o índices continuos, muchos análisis ecológicos requieren clasificaciones binarias. Para ello, es necesario elegir un umbral. Una de las prácticas más comunes consiste en seleccionar modelos y binarizar predicciones usando métricas como el *True Skill Statistic* (TSS). Esta métrica combina sensibilidad y especificidad, proporcionando una medida equilibrada de capacidad discriminativa y, a diferencia de otras métricas como Kappa, no depende de la prevalencia, lo que la hace más estable y robusta en contextos ecológicos.

La elección de un umbral ≥ 0.7 no surge de una convención arbitraria, sino de un marco teórico desarrollado en el campo de la estadística aplicada y adoptado por la ecología predictiva debido a su coherencia interna. Landis y Koch (1977) establecieron categorías interpretativas para valores de concordancia que han sido ampliamente aceptadas: valores inferiores a 0.40 reflejan modelos pobres o con baja capacidad de predicción, valores entre 0.40 y 0.75 son considerados aceptables o buenos según el contexto, y valores por encima de 0.75 se interpretan como niveles “excelentes”. Por ello, exigir un TSS mínimo de 0.7 implica seleccionar únicamente aquellos modelos que se encuentran en el límite superior de desempeño, reduciendo el riesgo de incorporar modelos débiles en análisis posteriores.

Este umbral adquiere especial relevancia cuando se trabaja con proyecciones futuras bajo escenarios climáticos. Las incertidumbres inherentes a estos escenarios se acumulan a lo largo del proceso de modelación. Por lo tanto, es crucial partir desde modelos altamente robustos para evitar la propagación de errores. Además, estudios comparativos como los de Hao et al. (2019) han demostrado que los modelos con TSS inferior a este umbral tienden a mostrar un comportamiento inestable cuando se extrapolan, particularmente en áreas ambientalmente novedosas. De esta forma, el umbral ≥ 0.7 no solo filtra modelos en la etapa de evaluación, sino que protege la credibilidad ecológica de las inferencias espaciales.

---

# 2. Modelos incluidos en BIOMOD2: fundamentos, lógica y diferencias clave

BIOMOD2 se desarrolló como un marco unificado para facilitar la comparación entre múltiples algoritmos de modelación ecológica bajo condiciones estandarizadas. Su premisa es que distintos algoritmos representan hipótesis ecológicas diferentes sobre cómo responde una especie a los gradientes ambientales. En este sentido, cada método no es solamente una técnica estadística, sino una representación conceptual del nicho ecológico.

Los modelos paramétricos, como los GLM, se basan en formas funcionales que deben ser especificadas previamente. Esto significa que requieren que el investigador plantee supuestos sobre la forma de la respuesta ecológica. Su fortaleza radica en su interpretabilidad: es posible cuantificar el efecto de cada variable ambiental y evaluar estadísticamente su importancia. Esta capacidad explicativa convierte a GLM en una herramienta poderosa cuando el objetivo del estudio es la inferencia ecológica, más que la predicción.

Los GAM amplían ese enfoque permitiendo relaciones más flexibles mediante splines suavizados. Este método semiparamétrico logra capturar patrones complejos sin sobreajustar en exceso si se controla el número de grados de libertad. Esto permite detectar respuestas no lineales características de especies con tolerancias ambientales estrechas o rangos definidos por transiciones abruptas.

En el otro extremo se encuentran los métodos basados en árboles de decisión. Los CTA dividen el espacio ambiental en segmentos mediante reglas binarias, aunque su rendimiento es limitado en escenarios complejos. Random Forest mejora esto promediando cientos de árboles construidos con variabilidad aleatoria, siendo altamente robusto al ruido y evitando sobreajuste. Los Boosted Regression Trees (BRT) también destacan combinando árboles secuenciales donde cada uno corrige los errores del anterior, ofreciendo notable capacidad predictiva si se calibran adecuadamente.

Los métodos de presencia–solo, como Maxent, son pilares cuando no existen datos de ausencia. Maxent estima el nicho bajo el principio de máxima entropía, generando predicciones eficientes incluso con pocos registros. Aunque su flexibilidad lo hace poderoso, su interpretación ecológica requiere mayor cautela. En contraste, métodos como BIOCLIM y SRE describen el nicho como un sobre ambiental; aunque simples y limitados, siguen siendo útiles como líneas base o para enseñanza.

La coexistencia de estos algoritmos dentro de BIOMOD2 responde a la filosofía introducida por Thuiller (2003): ninguna metodología es universalmente superior; cada una captura distintas facetas del nicho y, al combinarse, generan predicciones más robustas.

---

# 3. Pseudoausencias: una pieza invisible pero crítica en los SDMs

Las pseudoausencias suelen determinar la calidad interna de los SDMs más que la elección del algoritmo. Como bases como GBIF no contienen ausencias reales, es necesario generar puntos donde se asume que la especie está ausente. Sin estas, modelos como GLM, RF o GAM no podrían calibrarse.

Generar pseudoausencias al azar puede funcionar cuando la especie ocupa un subconjunto claro del territorio, pero puede producir falsos negativos si se seleccionan áreas ambientalmente adecuadas sin registros por falta de muestreo. Para evitar esto, se emplean pseudoausencias con exclusión espacial que dejan un buffer alrededor de registros conocidos. También existen pseudoausencias corregidas por sesgo (target-group), que seleccionan puntos en áreas con esfuerzo de muestreo comparable utilizando registros de otras especies como referencia.

El número de pseudoausencias también es clave: Guisan recomienda usar entre dos y diez veces más pseudoausencias que presencias, además de generar múltiples conjuntos para capturar la incertidumbre asociada a su elección. Estas decisiones afectan directamente la forma del nicho estimado y la estabilidad del modelo.

---

# 4. Ensambles: estabilidad, ventajas y límites según la evidencia moderna

Los ensambles integran múltiples modelos individuales bajo la idea de que cada algoritmo captura distintas facetas del nicho. Estudios como Hao et al. (2020) demuestran que los ensambles reducen la variabilidad entre modelos y estabilizan predicciones, aunque no siempre superan al mejor modelo individual. Son especialmente útiles cuando los algoritmos producen desempeños heterogéneos o cuando se proyecta a escenarios futuros altamente inciertos.

Los ensambles ponderados asignan mayor peso a los modelos con mejor TSS o AUC y suelen ser más estables que los no ponderados. Sin embargo, cuando un algoritmo sobresale consistentemente, puede ser preferible analizarlo individualmente para obtener interpretaciones ecológicas más claras.

---

# Conclusión

Los SDMs combinan teoría ecológica, estadística y computación. Usar umbrales rigurosos como TSS ≥ 0.7, comprender los algoritmos detrás de BIOMOD2, diseñar pseudoausencias adecuadas y evaluar críticamente los ensambles permite construir modelos robustos y ecológicamente interpretables. Estas prácticas fortalecen la validez de las predicciones y facilitan aplicaciones confiables en conservación, manejo y evaluación de impacto bajo escenarios de cambio climático.

    📘 **Autor:** Eduardo Fuentes-Lillo  
🧩 **Proyecto:** Curso SENCE-IEB — Gestión y modelamiento de datos de biodiversidad  
📅 **Actualizado:** Octubre 2025
