---
layout: default
title: Tutoriales SENCE-IEB
permalink: /tutorials/
---

# Tutoriales

{%- comment -%}
Si hay un archivo de datos con el orden deseado, úsalo.
De lo contrario, deriva las secciones desde los tutoriales.
{%- endcomment -%}
{% if site.data.tutorial_sections and site.data.tutorial_sections.order %}
  {% assign sections = site.data.tutorial_sections.order %}
  {% assign labels = site.data.tutorial_sections.labels %}
{% else %}
  {% assign sections = site.tutorials | map: 'section' | uniq | sort %}
{% endif %}

{%- for s in sections -%}
  {% assign items = site.tutorials | where: "section", s | sort: "order" %}
  {% if items.size > 0 %}
  {% assign label = labels[s] | default: s %}
  ## {{ label }}

  <ul>
    {%- for t in items -%}
      <li>
        <a href="{{ t.url | relative_url }}">{{ t.title }}</a>
        {% if t.description %} — {{ t.description }}{% endif %}
      </li>
    {%- endfor -%}
  </ul>
  {% endif %}
{%- endfor -%}
