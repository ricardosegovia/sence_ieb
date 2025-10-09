---
layout: default
title: Tutoriales SENCE-IEB
permalink: /tutorials/
---

# Tutoriales

<ul>
  {% for t in site.tutorials %}
    <li>
      <a href="{{ t.url | relative_url }}">{{ t.title }}</a>
      {% if t.description %} — {{ t.description }}{% endif %}
    </li>
  {% endfor %}
</ul>
