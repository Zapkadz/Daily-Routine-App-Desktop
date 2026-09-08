---
version: alpha
name: Daily Routine
description: A quiet working planner with a time-led daily schedule.
colors:
  primary: '#286548'
  background: '#f5f7f6'
  surface: '#ffffff'
  text: '#243a32'
  muted: '#61736b'
  border: '#dce5df'
typography:
  body:
    fontFamily: 'Segoe UI, sans-serif'
  time:
    fontFamily: 'Cascadia Mono, Consolas, monospace'
rounded:
  control: '7px'
  panel: '12px'
spacing:
  page: '40px'
  panel: '24px'
components:
  button:
    rounded: '7px'
  panel:
    rounded: '12px'
---

# Daily Routine Design System

## Overview

Product register: a personal Windows planner, English UI, local data. Sources: docs/MVP.md, docs/RULES.md, and the user's schedule-table references. Not a Japan-market product; Japanese study can appear as user content.

North star: an open weekly appointment book. The signature is a restrained green index marker in navigation paired with a monospaced time column. Work occupies the canvas; statistics stay compact. Avoid marketing headlines, motivational filler, oversized numbers, tinted text fields, and tiny calendar text.

## Colors

Runtime canonical source (Model B): src/styles/planner.css, imported after legacy global.css. Above values mirror --green, --bg, --surface, --text, --text-muted, --border respectively. Existing components consume these shared aliases. Dark theme remaps semantic roles in .app-frame.dark. No data or business-layer change accompanies this restyle.

## Typography

Segoe UI for headings, fields, and prose supports Windows and Vietnamese content offline. Headings 32px, section headings 19px, body 14px. Time uses Cascadia Mono/Consolas at 12px. Numeric values use tabular figures. Smaller calendar labels are reserved for secondary metadata.

## Layout

218px sidebar; 40px page insets; 24px panel padding. Today has three compact metrics followed by Tasks and Schedule. Below 1200px panels stack; below 800px sidebar reduces to icon navigation. Forms remain document-height inside a bounded dialog; tables own horizontal overflow.

## Elevation & Depth

White panels with fine green-grey rules and nearly flat shadows. Strong elevation only for modal dialogs. No decorative gradients or remote imagery.

## Shapes

7px controls, 12px panels. Book-spine mark on the brand and active navigation provides identity without additional decoration.

## Components

Daily Routine keeps the same Schedule and Last 7 days card locations. RoutineHistory owns a compact seven-day selector and read-only Time/Event/Status table, with By routine as an optional comparison view. RoutineLibrary is a disclosure beneath schedules, reusing RoutineIcon and shared button typography; no sidebar entry or new palette is introduced. History tables own bounded overflow; the surrounding page and forms retain natural scrolling.

Plan tomorrow reuses Today card geometry and shared task/schedule components. The entry is a secondary header link, with no extra sidebar navigation. Three compact planning metrics replace streak/progress metrics on this route. Static Planned/Flexible labels replace completion controls. Typography, semantic colors and responsive stacking inherit the existing runtime styles.

Button, Modal, TaskForm, RoutineForm, RoutineSchedule and CalendarTaskCard remain shared owners. Native Windows select and date/time popups are intentionally retained; OS popup geometry and locale are accepted. Modal uses native HTML dialog showModal for top-layer isolation, Escape, keyboard containment and restored focus. Labels remain English.

Global scrollbars are visible, tokenized and include forced-colors fallback. Focus rings are 3px; disabled controls are distinct; reduced motion disables decorative transitions. Task names wrap rather than disappear. Error messages remain inline and retriable where supported.

## Do's and Don'ts

- Do preserve time ordering, calendar Monday start and all existing data contracts.
- Do change shared theme roles consistently across routes.
- Don't introduce backend changes for visual work.
- Don't show buttons for unimplemented dashboard intentions or day navigation.
