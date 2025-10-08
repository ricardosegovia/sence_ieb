---
layout: default
title: "Inicio"
---

# Bienvenido/a

Este sitio reúne los **tutoriales del curso SENCE-IEB**.  
Para comenzar, explora la lista de tutoriales más abajo.

## Tutoriales
<ul>
{% assign sorted = site.tutorials | sort: 'order' %}
{% for t in sorted %}
  <li>
    <a href="{{ t.url | relative_url }}">{{ t.title }}</a>
    {% if t.summary %} — {{ t.summary }}{% endif %}
  </li>
{% endfor %}
</ul>
