(function () {
  "use strict";

  var C = window.RC_CONTENT;
  var OUTLINE = window.RC_OUTLINE;

  // ---------- Data ----------
  var regionsById = indexBy(C.regions);
  var programsById = indexBy(C.programs);
  var storiesById = {};
  C.stories.forEach(function (s) { storiesById[s.community] = s; });

  // Real works where the sample data has them; otherwise two or three placeholder works picked from the id, so every
  // community shows something completed or planned (client edit). Placeholders until HP supplies the real works.
  function worksFor(id) {
    var own = C.works.filter(function (w) { return w.community === id; });
    if (own.length) return own;
    var sum = 0;
    for (var i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    var pool = C.placeholderWorks, n = 2 + (sum % 2), out = [];
    for (var j = 0; j < n; j++) out.push(Object.assign({ community: id }, pool[(sum + j * 2) % pool.length]));
    return out;
  }

  var communities = window.RC_COMMUNITIES.map(function (c) {
    var p = window.projectWA(c.lat, c.lng);
    return Object.assign({}, c, {
      x: p.x,
      y: p.y,
      story: storiesById[c.id] || null,
      // A story can add names the spreadsheet doesn't have (e.g. Cockatoo Springs is also Ngunulum).
      otherNames: c.otherNames.concat((storiesById[c.id] && storiesById[c.id].otherNames) || []),
      works: worksFor(c.id),
    });
  });
  var byId = indexBy(communities);

  // ---------- State ----------
  var state = {
    view: "home",          // home | filters | profile
    selected: null,
    query: "",
    resultsOpen: false, // whether the search results dropdown is showing
    filters: { region: new Set(), program: new Set(), type: new Set(), status: new Set() },
    showAllTypes: false,
    expanded: false,       // mobile sheet
  };

  var el = {
    panel: document.getElementById("panel"),
    body: document.getElementById("panel-body"),
    map: document.getElementById("map"),
    viewport: document.getElementById("map-viewport"),
    stage: document.getElementById("map-stage"),
    markers: document.getElementById("markers"),
    toast: document.getElementById("toast"),
  };

  // ---------- Helpers ----------
  function indexBy(list) {
    var out = {};
    list.forEach(function (item) { out[item.id] = item; });
    return out;
  }
  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function isMobile() { return window.matchMedia("(max-width: 900px)").matches; }
  function displayName(c) {
    return c.otherNames.length ? c.name + " (" + c.otherNames[0] + ")" : c.name;
  }
  function distanceKm(a, b) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * toRad, dLng = (b.lng - a.lng) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function toast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.toast.hidden = true; }, 2400);
  }

  // ---------- Filtering ----------
  function activeFilterCount() {
    var f = state.filters;
    return f.region.size + f.program.size + f.type.size + f.status.size;
  }
  function matches(c) {
    var f = state.filters;
    if (f.region.size && !f.region.has(c.region)) return false;
    if (!f.program.size && !f.type.size && !f.status.size) return true;
    return c.works.some(function (w) {
      return (!f.program.size || f.program.has(w.program)) &&
        (!f.type.size || f.type.has(w.type)) &&
        (!f.status.size || f.status.has(w.status));
    });
  }
  function matchingCount() { return communities.filter(matches).length; }

  function search(query) {
    var q = query.trim().toLowerCase();
    if (!q) return [];
    return communities.filter(function (c) {
      return [c.name].concat(c.otherNames, regionsById[c.region].name)
        .some(function (n) { return n.toLowerCase().indexOf(q) !== -1; });
    }).sort(function (a, b) {
      return (b.name.toLowerCase().indexOf(q) === 0) - (a.name.toLowerCase().indexOf(q) === 0);
    }).slice(0, 8);
  }

  // ---------- Map: view transform ----------
  // The outline lives in a 600 x 820 space; view.k is pixels per unit and view.x / view.y the offset.
  var view = { k: 1, x: 0, y: 0 };
  var baseK = 1;
  // Relative to the whole-state view. Deep enough to pull apart the closest communities (Embulgun and
  // Munget are about 700 m apart); there is no street basemap, so this never shows anything finer.
  var MAX_ZOOM = 80;
  var LABEL_ZOOM = 3.5;
  var CLUSTER_RADIUS = 34;
  var STORY_SOLO_ZOOM = 2.5;

  function mapSize() {
    return { w: el.viewport.clientWidth, h: el.viewport.clientHeight };
  }
  // The part of the map not covered by the mobile bottom sheet.
  function visibleArea() {
    var s = mapSize();
    if (!isMobile()) return { x: 0, y: 0, w: s.w, h: s.h };
    // Matches the sheet heights in styles.css.
    var sheet = state.view === "profile" ? 0.71 : 0.4;
    return { x: 0, y: 0, w: s.w, h: Math.max(160, s.h * (1 - sheet)) };
  }
  // The opening, whole-of-WA view. Pass animate to glide there (e.g. when a profile is closed).
  function fitState(animate) {
    var a = visibleArea();
    var pad = isMobile() ? 24 : 40;
    baseK = Math.min((a.w - pad * 2) / OUTLINE.width, (a.h - pad * 2) / OUTLINE.height);
    var target = { k: baseK, x: a.x + (a.w - OUTLINE.width * baseK) / 2, y: a.y + (a.h - OUTLINE.height * baseK) / 2 };
    moveTo(target, animate);
  }
  function zoomLevel() { return view.k / baseK; }
  function clampView() {
    var s = mapSize();
    var margin = 80;
    var w = OUTLINE.width * view.k, h = OUTLINE.height * view.k;
    view.x = Math.min(s.w - margin, Math.max(margin - w, view.x));
    view.y = Math.min(s.h - margin, Math.max(margin - h, view.y));
  }
  function zoomAt(factor, px, py) {
    var next = Math.min(baseK * MAX_ZOOM, Math.max(baseK * 0.8, view.k * factor));
    factor = next / view.k;
    view.x = px - (px - view.x) * factor;
    view.y = py - (py - view.y) * factor;
    view.k = next;
    applyView();
  }
  // Centre a point (in outline units) in the visible part of the map, at a given zoom level.
  function centreOn(ux, uy, zoom, animate) {
    var a = visibleArea();
    var target = {
      k: baseK * Math.min(MAX_ZOOM, zoom),
      x: 0, y: 0,
    };
    target.x = a.x + a.w / 2 - ux * target.k;
    target.y = a.y + a.h / 2 - uy * target.k;
    moveTo(target, animate);
  }
  function moveTo(target, animate) {
    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Object.assign(view, target);
      applyView();
      return;
    }
    var from = Object.assign({}, view), start = null;
    function step(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / 350);
      var e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      view.k = from.k + (target.k - from.k) * e;
      view.x = from.x + (target.x - from.x) * e;
      view.y = from.y + (target.y - from.y) * e;
      if (p === 1) Object.assign(view, target); // land exactly, free of rounding
      applyView(p < 1);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // The creative's map rounds every service-area corner by 4px at the whole-of-WA view (the corner radius in the creative's Figma).
  // That's 4.8 units in the outline's space, as the creative's map draws the state at 0.83 of its size.
  var REGION_CORNER = 4.8;
  function roundedPath(pts, radius) {
    var n = pts.length, d = "";
    for (var i = 0; i < n; i++) {
      var p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
      var la = Math.hypot(a.x - p.x, a.y - p.y), lb = Math.hypot(b.x - p.x, b.y - p.y);
      var r = Math.min(radius, la / 2, lb / 2);
      var p1 = { x: p.x + (a.x - p.x) / la * r, y: p.y + (a.y - p.y) / la * r };
      var p2 = { x: p.x + (b.x - p.x) / lb * r, y: p.y + (b.y - p.y) / lb * r };
      d += (i ? "L" : "M") + p1.x.toFixed(2) + " " + p1.y.toFixed(2) + "Q" + p.x.toFixed(2) + " " + p.y.toFixed(2) + " " + p2.x.toFixed(2) + " " + p2.y.toFixed(2);
    }
    return d + "Z";
  }

  function drawOutline() {
    var svgNS = "http://www.w3.org/2000/svg";
    var group = document.createElementNS(svgNS, "g");
    el.stage.appendChild(group);
    el.stageGroup = group;
    function path(d, cls, transform) {
      var node = document.createElementNS(svgNS, "path");
      node.setAttribute("d", d);
      node.setAttribute("class", cls);
      if (transform) node.setAttribute("transform", transform);
      return node;
    }
    // The land and coastline are the creative's smoothed shapes (RC_COAST in outline.js), not the raw outline.
    var LAND = window.RC_COAST.land;
    function coast(shape, cls) { return path(shape.d, cls, shape.transform); }
    // The state is drawn blank, then each service area is shaded on top, clipped to the coastline.
    var defs = document.createElementNS(svgNS, "defs");
    var clip = document.createElementNS(svgNS, "clipPath");
    clip.setAttribute("id", "state-clip");
    clip.appendChild(coast(LAND, ""));
    defs.appendChild(clip);
    group.appendChild(defs);
    group.appendChild(coast(LAND, "state"));
    Object.keys(window.RC_REGION_SHAPES).forEach(function (variant) {
      var shapes = window.RC_REGION_SHAPES[variant];
      var regionGroup = document.createElementNS(svgNS, "g");
      regionGroup.setAttribute("clip-path", "url(#state-clip)");
      regionGroup.setAttribute("class", "regions");
      regionGroup.dataset.variant = variant;
      C.regions.forEach(function (r) {
        var pts = shapes[r.id].map(function (pt) { return window.projectWA(pt[1], pt[0]); });
        regionGroup.appendChild(path(roundedPath(pts, REGION_CORNER), "region region-" + r.id));
      });
      group.appendChild(regionGroup);
    });
    // The coastline is drawn 1.5px on the inside of the edge only (the design's "inside" stroke): a 3px stroke clipped to
    // the land. The clip sits on a plain wrapper, as a clip path is read in the clipped element's own (transformed) space.
    var wrap = document.createElementNS(svgNS, "g");
    wrap.setAttribute("clip-path", "url(#state-clip)");
    wrap.appendChild(coast(LAND, "state-edge"));
    group.appendChild(wrap);
    var labels = document.createElement("div");
    labels.className = "map-labels";
    labels.id = "map-labels";
    el.viewport.insertBefore(labels, el.markers);
  }

  var frameRequested = false;
  function applyView(skipClamp) {
    if (!skipClamp) clampView();
    el.stageGroup.setAttribute("transform", "translate(" + view.x + " " + view.y + ") scale(" + view.k + ")");
    if (!frameRequested) {
      frameRequested = true;
      requestAnimationFrame(function () { frameRequested = false; renderMarkers(); });
    }
  }

  function toScreen(ux, uy) { return { x: view.x + ux * view.k, y: view.y + uy * view.k }; }

  // ---------- Map: markers and clusters ----------
  // Groups shrink as you zoom in, and at full zoom every community shows on its own.
  function clusterRadius() {
    var zoom = zoomLevel();
    if (zoom >= MAX_ZOOM * 0.98) return 0;
    // Once zoomed in, only dots that would actually overlap are grouped.
    return zoom >= 12 ? 10 : CLUSTER_RADIUS;
  }

  function cluster(list) {
    var groups = [];
    var radius = clusterRadius();
    list.forEach(function (c) {
      var p = toScreen(c.x, c.y);
      var hit = null;
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i];
        if (Math.abs(g.sx - p.x) < radius && Math.abs(g.sy - p.y) < radius) { hit = g; break; }
      }
      if (hit) {
        hit.items.push(c);
        var n = hit.items.length;
        hit.sx += (p.x - hit.sx) / n;
        hit.sy += (p.y - hit.sy) / n;
      } else {
        groups.push({ sx: p.x, sy: p.y, items: [c] });
      }
    });
    return groups;
  }

  function renderMarkers() {
    var labels = document.getElementById("map-labels");
    labels.innerHTML = C.regions.map(function (r) {
      var at = window.RC_REGION_LABELS[r.id], u = window.projectWA(at[1], at[0]), p = toScreen(u.x, u.y);
      return '<span class="region-label" style="left:' + p.x + "px;top:" + p.y + 'px">' + esc(r.name) + "</span>";
    }).join("");

    var zoom = zoomLevel();
    var filtering = activeFilterCount() > 0;
    // Stories and the selected community always show on their own; everything else groups when crowded.
    var solo = [], inFilter = [], outFilter = [];
    communities.forEach(function (c) {
      if (c.id === state.selected || (c.story && zoom >= STORY_SOLO_ZOOM)) solo.push(c);
      else if (matches(c)) inFilter.push(c);
      else outFilter.push(c);
    });

    var clusters = [].concat(
      cluster(outFilter).map(function (g) { g.faded = true; return g; }),
      cluster(inFilter)
    );
    // Nudge any group that would sit on top of a story or selected dot just clear of it.
    solo.forEach(function (c) {
      var p = toScreen(c.x, c.y);
      clusters.forEach(function (g) {
        if (g.items.length < 2) return;
        var dx = g.sx - p.x, dy = g.sy - p.y, d = Math.hypot(dx, dy), min = 34;
        if (d >= min) return;
        if (d < 0.5) { dx = -1; dy = 1; d = Math.SQRT2; }
        g.sx = p.x + dx / d * min;
        g.sy = p.y + dy / d * min;
      });
    });
    var groups = [].concat(
      clusters,
      solo.map(function (c) {
        var p = toScreen(c.x, c.y);
        return { sx: p.x, sy: p.y, items: [c], faded: filtering && !matches(c) };
      })
    );

    // Every marker is an obstacle for labels, so a name never sits under a neighbouring dot.
    // Single communities are pins with their tip on the spot, so the marker (and its name) centres on the pin's head:
    // 8px above the spot for a pin, 11.5px for the larger story and selected pin. Blue "not in filter" dots centre on the spot.
    groups.forEach(function (g) {
      if (g.items.length > 1) return;
      var c = g.items[0];
      if (c.id === state.selected) g.faded = false; // the selected community always shows its pin, even outside the filter
      if (g.faded) return;
      g.large = c.story || c.id === state.selected;
      g.sy -= g.large ? 11.49 : 8;
    });
    var placedLabels = groups.map(function (g, i) {
      var r = g.items.length > 1 ? 19 : g.large ? 12 : 8;
      return { x1: g.sx - r, x2: g.sx + r, y1: g.sy - r, y2: g.sy + r, owner: i };
    });
    var html = groups.map(function (g, i) {
      var style = 'style="left:' + g.sx + "px;top:" + g.sy + 'px"';
      if (g.items.length > 1) {
        var names = g.items.length + " communities, including " + g.items.slice(0, 3).map(function (c) { return c.name; }).join(", ");
        var hasStory = g.items.some(function (c) { return c.story; });
        if (hasStory) names += ", with a community story";
        return '<button type="button" class="marker is-cluster' + (g.faded ? " faded" : "") + (hasStory ? " has-story" : "") + '" ' + style +
          ' data-cluster="' + g.items.map(function (c) { return c.id; }).join(",") + '" aria-label="' + esc(names) + '. Zoom in.">' +
          '<span class="cluster">' + g.items.length + "</span></button>";
      }
      var c = g.items[0];
      var selected = c.id === state.selected;
      var labelPos = zoom >= LABEL_ZOOM ? placeLabel(placedLabels, i, g.sx, g.sy, c.name, g.large ? 19 : 10) : null;
      // The creative's pin artwork (images/design/): red pin, the larger outlined pin for stories and the selected
      // community, and a blue dot for communities outside the current filter.
      var art = g.faded ? "map-dot-faded" : g.large ? "map-pin-large" : "map-pin";
      return '<button type="button" class="marker' + (g.faded ? " faded" : g.large ? " pin pin-large" : " pin") + (selected ? " selected" : "") + (labelPos ? " has-label" : "") + '" ' + style +
        ' data-id="' + c.id + '" aria-label="' + esc(displayName(c)) + (c.story ? ", community with a story" : "") + '">' +
        '<img class="marker-art" src="images/design/' + art + '.svg" alt="">' +
        (labelPos ? '<span class="marker-label at-' + labelPos + '">' + esc(c.name) + "</span>" : "") +
        '<span class="tooltip">' + esc(displayName(c)) + "</span></button>";
    }).join("");
    el.markers.innerHTML = html;
  }

  // Puts a community's name in the first free spot around its dot: right, then left, above, below and the
  // corners. Returns that position, or null when every spot would overlap another name or marker.
  var LABEL_SPOTS = ["right", "left", "top", "bottom", "top-right", "top-left", "bottom-right", "bottom-left"];
  function placeLabel(placed, owner, x, y, text, gap) {
    var w = textWidth(text), h = 16, corner = gap > 10 ? 10 : 4;
    for (var i = 0; i < LABEL_SPOTS.length; i++) {
      var spot = LABEL_SPOTS[i];
      var cx = spot === "right" ? x + gap + w / 2 : spot === "left" ? x - gap - w / 2
        : spot.indexOf("right") > 0 ? x + corner + w / 2 : spot.indexOf("left") > 0 ? x - corner - w / 2 : x;
      var cy = spot.indexOf("top") === 0 ? y - gap - h / 2 : spot.indexOf("bottom") === 0 ? y + gap + h / 2 : y;
      // Sized for the bold highlighted state, so the name still fits when hovered or selected.
      var box = { x1: cx - w / 2 - 6, x2: cx + w / 2 + 6, y1: cy - h / 2 - 1, y2: cy + h / 2 + 1 };
      var clash = placed.some(function (b) {
        return b.owner !== owner && box.x1 < b.x2 && box.x2 > b.x1 && box.y1 < b.y2 && box.y2 > b.y1;
      });
      if (!clash) {
        placed.push(box);
        return spot;
      }
    }
    return null;
  }

  var measureCtx = document.createElement("canvas").getContext("2d");
  function textWidth(text) {
    measureCtx.font = "600 13px Inter, sans-serif"; // the highlighted name is Inter Semibold in the creative's design
    return measureCtx.measureText(text).width;
  }

  // ---------- Map: interaction ----------
  var pointers = new Map();
  var gesture = null;
  var moved = false;

  // ---------- Map: key ----------
  // The key shows on load, then tucks away into a "Key" button the first time someone uses the map.
  var legend = document.getElementById("legend");
  var legendToggle = document.getElementById("legend-toggle");
  var legendTouched = false;
  function setLegend(open) {
    legend.classList.toggle("collapsed", !open);
    legendToggle.setAttribute("aria-expanded", String(open));
  }
  function collapseLegendOnFirstUse() {
    if (legendTouched) return;
    legendTouched = true;
    setLegend(false);
  }
  legendToggle.addEventListener("click", function () {
    legendTouched = true;
    setLegend(legend.classList.contains("collapsed"));
  });
  legend.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
  if (isMobile()) { legendTouched = true; setLegend(false); }

  el.viewport.addEventListener("pointerdown", function (e) {
    collapseLegendOnFirstUse();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
    gesture = startGesture();
  });
  window.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    var g = startGesture();
    if (!gesture) return;
    var dx = g.cx - gesture.cx, dy = g.cy - gesture.cy;
    if (!moved && Math.hypot(dx, dy) < 5 && Math.abs(g.dist - gesture.dist) < 5) return;
    if (!moved) {
      moved = true;
      el.viewport.classList.add("dragging");
      try { el.viewport.setPointerCapture(e.pointerId); } catch (err) { /* pointer already released */ }
    }
    var rect = el.viewport.getBoundingClientRect();
    if (gesture.dist && g.dist) {
      zoomAt(g.dist / gesture.dist, g.cx - rect.left, g.cy - rect.top);
    }
    view.x += dx;
    view.y += dy;
    applyView();
    gesture = g;
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    gesture = pointers.size ? startGesture() : null;
    if (!pointers.size) el.viewport.classList.remove("dragging");
  }
  window.addEventListener("pointerup", endPointer);
  window.addEventListener("pointercancel", endPointer);

  function startGesture() {
    var pts = Array.from(pointers.values());
    if (!pts.length) return null;
    var cx = pts.reduce(function (s, p) { return s + p.x; }, 0) / pts.length;
    var cy = pts.reduce(function (s, p) { return s + p.y; }, 0) / pts.length;
    var dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { cx: cx, cy: cy, dist: dist };
  }

  // Focusing an off-screen marker (e.g. by tabbing) would scroll the clipped map layer out of line with the outline.
  el.map.addEventListener("scroll", function () { el.map.scrollTop = 0; el.map.scrollLeft = 0; });

  el.viewport.addEventListener("wheel", function (e) {
    e.preventDefault();
    collapseLegendOnFirstUse();
    var rect = el.viewport.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0022), e.clientX - rect.left, e.clientY - rect.top);
  }, { passive: false });

  el.markers.addEventListener("click", function (e) {
    var target = e.target.closest(".marker");
    if (!target || moved) return;
    if (target.dataset.id) {
      openProfile(target.dataset.id);
    } else if (target.dataset.cluster) {
      zoomToCommunities(target.dataset.cluster.split(","));
    }
  });

  document.querySelectorAll("[data-zoom]").forEach(function (button) {
    button.addEventListener("click", function () {
      collapseLegendOnFirstUse();
      var a = visibleArea();
      zoomAt(button.dataset.zoom === "in" ? 1.6 : 1 / 1.6, a.x + a.w / 2, a.y + a.h / 2);
    });
  });

  function zoomToCommunities(ids) {
    var items = ids.map(function (id) { return byId[id]; });
    var xs = items.map(function (c) { return c.x; }), ys = items.map(function (c) { return c.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var a = visibleArea();
    var fitK = Math.min((a.w * 0.6) / Math.max(maxX - minX, 1), (a.h * 0.6) / Math.max(maxY - minY, 1));
    var zoom = Math.max(zoomLevel() * 2, Math.min(fitK / baseK, MAX_ZOOM));
    centreOn((minX + maxX) / 2, (minY + maxY) / 2, zoom, true);
  }

  // ---------- Panel: home ----------
  function renderHome() {
    var count = activeFilterCount();
    var results = search(state.query);
    var resultsHtml = "";
    if (state.query.trim()) {
      // Results drop down over the content below, like a native select, so the story list doesn't jump as you type.
      resultsHtml = '<ul class="results" id="results" aria-label="Search results"' + (state.resultsOpen ? "" : " hidden") + ">" + (results.length
        ? results.map(function (c) {
          return '<li><button type="button" data-open="' + c.id + '"><span>' + esc(displayName(c)) +
            "</span><small>" + esc(regionsById[c.region].name) + "</small></button></li>";
        }).join("")
        : '<li class="empty">No communities match “' + esc(state.query) + "”</li>") + "</ul>";
    }
    var stories = C.stories.map(function (s) {
      var c = byId[s.community];
      // The whole card is clickable: the title is its one link, stretched over the card (no "Read more").
      return '<article class="story-card"><h3><a href="#community=' + c.id + '" data-open="' + c.id + '">' + esc(s.label || displayName(c)) + "</a></h3>" +
        "<p>" + esc(s.summary) + "</p>" + storyImage(s, "thumb") + "</article>";
    }).join("");

    return '<div class="home">' +
      "<h1>Power for remote communities</h1>" +
      '<p class="intro">See the work we\'re doing with ' + communities.length + " remote Aboriginal communities across WA to keep the power on, safely and reliably.</p>" +
      '<form class="search" role="search" id="search-form">' +
      '<label class="visually-hidden" for="search-input">Search communities</label>' +
      '<div class="search-field"><input id="search-input" type="search" autocomplete="off" placeholder="' + (isMobile() ? "Search" : "Search communities") + '" value="' + esc(state.query) + '" aria-controls="results">' +
      '<button type="submit" aria-label="Search">' + icon("search") + "</button>" + resultsHtml + "</div>" +
      '<button type="button" class="btn btn-secondary" data-action="filters">' + icon("filter") + "Filters" + (count ? ' <span class="count">' + count + "</span>" : "") + "</button>" +
      "</form>" +
      '<section class="stories band" id="stories" aria-label="Community stories">' + stories + "</section>" +
      "</div>";
  }

  // ---------- Panel: filters ----------
  function tile(group, item, opts) {
    opts = opts || {};
    var pressed = state.filters[group].has(item.id);
    var iconHtml = item.icon ? icon(item.icon, opts.medium ? "icon-48" : "") : "";
    return '<button type="button" class="tile' + (opts.medium ? " medium" : "") + (iconHtml ? "" : " no-icon") + '" aria-pressed="' + pressed +
      '" data-filter="' + group + '" data-value="' + item.id + '">' + iconHtml +
      '<span class="label">' + esc(item.name) + (item.description ? '<span class="desc">' + esc(item.description) + "</span>" : "") + "</span>" +
      (opts.count != null ? '<span class="count">' + opts.count + "</span>" : "") + "</button>";
  }

  function renderFilters() {
    var types = state.showAllTypes ? C.workTypes : C.workTypes.slice(0, 5);
    var hidden = C.workTypes.length - 5;
    var n = matchingCount();
    return '<div class="filters">' +
      '<div class="filters-head"><h2><button type="button" data-action="home" aria-label="Back">' + icon("chevron-left") + "</button>Filters</h2>" +
      '<button type="button" class="text-link" data-action="clear">Clear all</button></div>' +
      '<div class="filters-body">' +
      '<fieldset class="filter-group"><legend>Region</legend>' +
      C.regions.map(function (r) {
        return tile("region", r, { count: communities.filter(function (c) { return c.region === r.id; }).length });
      }).join("") + "</fieldset>" +
      '<fieldset class="filter-group"><legend>Program</legend>' +
      C.programs.map(function (p) { return tile("program", p, { medium: true }); }).join("") + "</fieldset>" +
      '<fieldset class="filter-group"><legend>Type of work</legend>' +
      types.map(function (t) { return tile("type", t); }).join("") +
      '<button type="button" class="show-more" data-action="more-types">' + (state.showAllTypes ? "Show fewer" : "Show " + hidden + " more") + "</button></fieldset>" +
      '<fieldset class="filter-group"><legend>Status</legend>' +
      C.statuses.map(function (s) { return tile("status", s); }).join("") + "</fieldset>" +
      '<fieldset class="filter-group"><legend>Service provider</legend>' +
      '<div class="select"><label class="visually-hidden" for="rsp">Service provider</label><select id="rsp" disabled><option>All service providers</option></select><span>' + icon("chevron-down") + "</span></div>" +
      '<p class="note">Service provider details are still to come from Horizon Power.</p></fieldset>' +
      '<p class="note">Program, type of work and status use sample works from the Figma profiles until the works data arrives.</p>' +
      "</div>" +
      '<div class="filters-foot"><button type="button" class="btn btn-link" data-action="clear">Clear all</button>' +
      '<button type="button" class="btn btn-primary" data-action="home">Show ' + n + " " + (n === 1 ? "community" : "communities") + "</button></div>" +
      "</div>";
  }

  // ---------- Panel: profile ----------
  // A work is a tight block like the old milestone rows (client edit): dark red when completed, pale with a red border
  // when in progress, outlined only when planned. The status shows in colour and in the small line's text.
  function workItem(w) {
    // Works icons use the creative's hand-drawn versions where the design has them (images/design/), else the sprite.
    var art = DESIGN_WORK_ICONS.indexOf(w.icon) > -1 ? '<img class="work-icon" src="images/design/work-' + w.icon + '.svg" alt="">' : icon(w.icon);
    return '<li class="work-item ' + w.status + '"><span class="work-art">' + art + "</span>" +
      "<span><strong>" + esc(w.title) + "</strong><small>" + esc(programsById[w.program].shortName + " · " + w.when) + "</small></span></li>";
  }

  var DESIGN_WORK_ICONS = ["battery", "fuel", "power-lines", "meter"];

  // Completed first, then in progress, then planned; the order within each stays as the data has it.
  function worksByStatus(c) {
    var rows = C.statuses.map(function (st) {
      return c.works.filter(function (w) { return w.status === st.id; }).map(workItem).join("");
    }).join("");
    return '<ul class="work-list" aria-label="Works">' + rows + "</ul>";
  }

  function contactBlock() {
    var k = C.contact;
    return '<section class="band contact" id="yarn" aria-label="Your local service provider"><small>Your local service provider</small>' +
      "<h3>" + esc(k.heading) + "</h3><p>" + esc(k.body) + "</p>" +
      '<div class="buttons"><a class="btn btn-primary" href="tel:">' + icon("call") + "Call " + esc(k.phone) + "</a>" +
      '<a class="btn btn-secondary" href="mailto:">' + icon("email") + "Email</a></div>" +
      '<p class="alert">' + icon("info") + esc(k.emergency) + "</p></section>";
  }

  function nearbyList(c, howMany) {
    var near = communities.filter(function (o) { return o.id !== c.id; })
      .map(function (o) { return { c: o, km: distanceKm(c, o) }; })
      .sort(function (a, b) { return a.km - b.km; })
      .slice(0, howMany);
    return '<section aria-labelledby="nearby-h"><h3 id="nearby-h">Nearby communities</h3><ul class="nearby">' +
      near.map(function (n) {
        return '<li><button type="button" data-open="' + n.c.id + '">' + icon("pin") +
          '<span class="text"><strong>' + esc(n.c.name) + "</strong><small>" + Math.round(n.km) + " km away" +
          (n.c.story ? " · Community story" : "") + "</small></span>" + icon("chevron-right") + "</button></li>";
      }).join("") + "</ul></section>";
  }

  // The nearby communities, which close every profile.
  function profileFoot(c, howMany) {
    return '<div class="section">' + nearbyList(c, howMany) + "</div>";
  }

  function profileBar(c) {
    return '<div class="profile-bar"><div class="actions"><button type="button" data-action="share" aria-label="Share ' + esc(c.name) + '">' + icon("share") + "</button>" +
      '<button type="button" data-action="close" aria-label="Close">' + icon("close") + "</button></div></div>";
  }

  function renderProfile(c) {
    return c.story ? renderStoryProfile(c) : renderSimpleProfile(c);
  }

  function renderStoryProfile(c) {
    var s = c.story;
    var aka = c.otherNames.length ? '<p class="aka">Also known as ' + esc(c.otherNames.join(", ")) + "</p>" : "";
    // Sections and "bands" follow the creative's treatment (Nov 2026): plain sections on the sand background,
    // and full-width bands with torn top and bottom edges for the About box, the quote and the service provider.
    var storyHtml = '<section class="section story" id="story"><h3>' + esc(s.title) + "</h3>" +
      s.body.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    // Article link straight after the story text. Its text is the article title, never "Read more" (WCAG 2.4.4 link purpose).
    if (s.article) {
      storyHtml += '<p class="story-article">' +
        '<a class="link-arrow" href="' + esc(s.article.url) + '">' + esc(s.article.title) + icon("arrow-right") + "</a></p>";
    }
    // Video, quote, photos and before-and-after only show where a story has them (Papulankutja, as placeholders).
    if (s.video) {
      storyHtml += '<div class="placeholder video"><span class="play"><img src="images/design/play.svg" alt=""></span>' + esc(s.video) + "</div>" +
        '<p class="caption">Captions and transcript available</p>';
    }
    storyHtml += "</section>";
    if (s.quote) storyHtml += '<blockquote class="band quote"><p>' + esc(s.quote) + "</p><footer>" + esc(s.quoteBy) + "</footer></blockquote>";
    var media = "";
    if (s.photos) {
      media += '<section class="media"><div class="section-head"><h3>Photos</h3><a href="#">View all ' + s.photos + "</a></div>" +
        '<div class="photos"><div class="placeholder">Photo</div><div class="placeholder">Photo</div><div class="placeholder more">+' + (s.photos - 3) + " more</div></div></section>";
    }
    if (s.beforeAfter) {
      media += '<section class="media"><div class="section-head"><h3>Before and after</h3></div><div class="before-after">' +
        '<div><div class="placeholder">Photo</div><p class="caption">' + esc(s.beforeAfter[0]) + "</p></div>" +
        '<div><div class="placeholder">Photo</div><p class="caption">' + esc(s.beforeAfter[1]) + "</p></div></div></section>";
    }

    return profileBar(c) +
      storyImage(s, "hero") +
      '<div class="profile-main">' +
      '<div class="profile-name">' + nameRow(c) + aka + "</div>" +
      aboutBlock(c, fact("Population", "[About 000 people]") + fact("Languages spoken", "[Language names]") +
        fact("Traditional Owners", "[Traditional Owner group]") + fact("Service provider", "[RSP name]")) +
      storyHtml +
      (media ? '<div class="section">' + media + "</div>" : "") +
      contactBlock() + profileFoot(c, 3) +
      "</div>";
  }

  function renderSimpleProfile(c) {
    var programs = [];
    c.works.forEach(function (w) { if (programs.indexOf(w.program) === -1) programs.push(w.program); });
    var explainers = programs.map(function (id) {
      var e = programsById[id].explainer;
      return '<div class="explainer"><h4>' + icon("info") + esc(e.title) + "</h4><p>" + esc(e.body) + "</p>" +
        '<a class="link-arrow" href="#">' + esc(e.link) + icon("arrow-right") + "</a></div>";
    }).join("");
    var aka = c.otherNames.length ? '<p class="aka">Also known as ' + esc(c.otherNames.join(", ")) + "</p>" : "";

    return profileBar(c) +
      '<div class="profile-main simple">' +
      '<div class="profile-name">' + nameRow(c) + aka + "</div>" +
      aboutBlock(c, fact("Region", regionsById[c.region].name) + fact("Service provider", "[RSP name]")) +
      (explainers ? '<div class="section">' + explainers + "</div>" : "") +
      contactBlock() + profileFoot(c, 2) +
      "</div>";
  }

  // Name with a "hear it said" button. The clip will be a community member saying the name (with permission),
  // not text-to-speech, which gets Aboriginal names wrong.
  function nameRow(c) {
    return '<div class="name-row"><h2 id="profile-title">' + esc(c.name) + "</h2>" +
      '<button type="button" class="say-name" data-action="say-name" aria-label="Hear how to say ' + esc(c.name) + '">' +
      icon("sound") + "</button></div>";
  }

  // The community's key details in a box like the service provider one, then what's been done and what's planned
  // (it replaced the transition milestones here, client edit).
  function aboutBlock(c, facts) {
    return '<section class="band about" id="work" aria-label="About ' + esc(c.name) + '">' +
      '<div class="facts">' + facts + "</div>" +
      '<div class="works"><h3>Works</h3>' + worksByStatus(c) + "</div></section>";
  }

  // A story's photo, or a grey placeholder if it hasn't got one. The card thumbnail is decorative (the card is
  // already named by its title), so it has empty alt text; the profile's hero photo is described.
  function storyImage(s, kind) {
    if (!s.image) return '<div class="placeholder ' + kind + '"' + (kind === "thumb" ? ' aria-hidden="true">Image' : ">Hero photo (with consent)") + "</div>";
    return '<img class="photo ' + kind + '" src="' + esc(s.image) + '" alt="' + (kind === "thumb" ? "" : esc(s.imageAlt)) + '">';
  }

  function fact(label, value) {
    return '<div class="fact"><span>' + esc(label) + "</span><strong>" + esc(value).replace(/\//g, "/<wbr>") + "</strong></div>"; // e.g. Esperance/Goldfields can wrap on mobile
  }

  // ---------- Panel rendering ----------
  // The creative's base plate closes the home and profile panes: a torn, patterned edge, then a solid bar with "Back to top".
  function backToTop(onBand) {
    return '<div class="base-plate' + (onBand ? " on-band" : "") + '"><img src="images/design/base-plate' + (onBand ? "-no-backing" : "") + '.svg" alt="">' +
      '<button type="button" class="back-top" data-action="top"><img src="images/design/back-to-top-icon.svg" alt="">Back to top</button></div>';
  }

  function render(opts) {
    opts = opts || {};
    var c = state.selected ? byId[state.selected] : null;
    var html = state.view === "filters" ? renderFilters() : state.view === "profile" && c ? renderProfile(c) : renderHome() + backToTop(true);
    if (state.view === "profile" && c) html += backToTop();
    var scroll = el.body.scrollTop;
    el.body.innerHTML = html;
    el.body.scrollTop = opts.keepScroll ? scroll : 0;

    el.panel.classList.toggle("profile", state.view === "profile");
    el.map.classList.toggle("sheet-profile", state.view === "profile");
    el.panel.classList.toggle("filters-open", state.view === "filters");
    el.panel.classList.toggle("expanded", state.expanded);
    renderMarkers();
  }

  function openProfile(id, opts) {
    var c = byId[id];
    if (!c) return;
    opts = opts || {};
    state.view = "profile";
    state.selected = id;
    state.expanded = false;
    state.query = "";
    setHash("community=" + id);
    render();
    centreOn(c.x, c.y, Math.max(zoomLevel(), 5), !opts.instant);
    var title = document.getElementById("profile-title");
    if (title && !opts.instant) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
  }

  function goHome() {
    state.view = "home";
    state.selected = null;
    state.expanded = false;
    setHash("");
    render();
  }

  // The cross (and Escape) close the profile and glide the map back to the opening whole-of-WA view.
  function closeProfile() {
    goHome();
    fitState(true);
  }

  function setHash(value) {
    var next = value ? "#" + value : location.pathname + location.search;
    if (("#" + value) === location.hash || (!value && !location.hash)) return;
    history.replaceState(null, "", next);
  }

  function share() {
    var url = location.href;
    var c = state.selected && byId[state.selected];
    var title = c ? c.name + " · Remote Communities Map" : "Remote Communities Map";
    if (navigator.share && isMobile()) {
      navigator.share({ title: title, url: url }).catch(function () { /* share sheet dismissed */ });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast(url); });
    } else {
      toast(url);
    }
  }

  // ---------- Panel events ----------
  el.body.addEventListener("click", function (e) {
    var t = e.target.closest("[data-open],[data-action],[data-filter],[data-jump]");
    if (!t) return;
    if (t.dataset.open) {
      e.preventDefault();
      openProfile(t.dataset.open);
    } else if (t.dataset.filter) {
      var set = state.filters[t.dataset.filter];
      if (set.has(t.dataset.value)) set.delete(t.dataset.value); else set.add(t.dataset.value);
      render({ keepScroll: true });
    } else if (t.dataset.jump) {
      // In-panel link (e.g. "Yarn with us"): scroll the panel rather than change the route hash.
      e.preventDefault();
      var target = document.getElementById(t.dataset.jump);
      if (target) {
        if (isMobile()) { state.expanded = true; el.panel.classList.add("expanded"); }
        el.body.scrollTo({ top: target.offsetTop - 64, behavior: "smooth" });
      }
    } else {
      handleAction(t.dataset.action, e);
    }
  });

  document.querySelector(".site-header").addEventListener("click", function (e) {
    var t = e.target.closest("[data-action]");
    if (t) handleAction(t.dataset.action, e);
  });

  function handleAction(action, e) {
    if (e) e.preventDefault();
    switch (action) {
      case "home":
        goHome();
        break;
      case "top":
        // Scroll the pane (not the page) back to the start, and move focus there so keyboard users don't stay at the bottom.
        el.body.scrollTo({ top: 0, behavior: "smooth" });
        var top = document.getElementById("profile-title") || document.querySelector(".home h1");
        if (top) { top.setAttribute("tabindex", "-1"); top.focus({ preventScroll: true }); }
        break;
      case "reset":
        // The logo returns to the page-load state: no profile, search or filters, and the whole-of-WA view.
        state.query = "";
        state.showAllTypes = false;
        Object.keys(state.filters).forEach(function (k) { state.filters[k].clear(); });
        goHome();
        fitState(true);
        break;
      case "close":
        closeProfile();
        break;
      case "filters":
        state.view = "filters";
        state.expanded = false;
        render();
        break;
      case "clear":
        Object.keys(state.filters).forEach(function (k) { state.filters[k].clear(); });
        render({ keepScroll: true });
        break;
      case "more-types":
        state.showAllTypes = !state.showAllTypes;
        render({ keepScroll: true });
        break;
      case "share":
        share();
        break;
      case "say-name":
        // Placeholder: no recordings yet. Show the playing state for about as long as a clip would last.
        var btn = e && e.target.closest(".say-name");
        if (btn) { btn.classList.add("playing"); setTimeout(function () { btn.classList.remove("playing"); }, 1600); }
        toast("[A recording of a community member saying " + byId[state.selected].name + " plays here]");
        break;
      case "soon":
        toast("This page is not part of the prototype");
        break;
      case "stories":
        if (state.view !== "home") goHome();
        state.expanded = true;
        el.panel.classList.add("expanded");
        document.getElementById("stories").scrollIntoView({ behavior: "smooth" });
        break;
      case "search":
        if (state.view !== "home") goHome();
        state.expanded = true;
        el.panel.classList.add("expanded");
        document.getElementById("search-input").focus();
        break;
    }
  }

  el.body.addEventListener("input", function (e) {
    if (e.target.id !== "search-input") return;
    state.query = e.target.value;
    state.resultsOpen = true;
    // On mobile, open the sheet to full height so the results aren't cut off at the bottom of the screen.
    if (isMobile() && !state.expanded) {
      state.expanded = true;
      el.panel.classList.add("expanded");
    }
    var pos = e.target.selectionStart;
    render({ keepScroll: true });
    var input = document.getElementById("search-input");
    input.focus();
    input.setSelectionRange(pos, pos);
  });
  // The results close when you click, tap or tab anywhere outside the search field, or press Escape, and reopen when you return to it.
  function setResultsOpen(open) {
    state.resultsOpen = open;
    var list = document.getElementById("results");
    if (list) list.hidden = !open;
  }
  document.addEventListener("focusin", function (e) {
    if (e.target.id === "search-input") setResultsOpen(true);
    else if (!e.target.closest(".search-field")) setResultsOpen(false);
  });
  document.addEventListener("click", function (e) {
    if (e.target.id === "search-input") setResultsOpen(true);
    else if (state.resultsOpen && !e.target.closest(".search-field")) setResultsOpen(false);
  });

  el.body.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = search(state.query)[0];
    if (first) openProfile(first.id);
  });

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && e.target.type !== "checkbox";
    if (e.shiftKey && e.key.toLowerCase() === "o" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      toggleOptions();
      return;
    }
    if (e.key === "Escape" && !el.options.hidden) {
      toggleOptions(false);
      return;
    }
    if (e.key === "Escape" && state.resultsOpen && document.getElementById("results")) {
      setResultsOpen(false);
      return;
    }
    if (e.key === "Escape" && state.view === "profile") closeProfile();
    else if (e.key === "Escape" && state.view !== "home") goHome();
  });



  window.addEventListener("hashchange", routeFromHash);
  function routeFromHash() {
    var m = location.hash.match(/community=([a-z0-9-]+)/);
    if (m && byId[m[1]]) openProfile(m[1], { instant: true });
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var c = state.selected && byId[state.selected];
      fitState();
      if (c) centreOn(c.x, c.y, 5, false);
    }, 150);
  });

  // ---------- Prototype options (Shift + O) ----------
  // Layout experiments that can be switched on and off. Settings are remembered in this browser, and
  // URL parameters (e.g. ?ngLands=1) override them so a particular set-up can be shared as a link.
  var OPTIONS = [
    { id: "ngLands", label: "Goldfields takes in the NG lands",
      description: "Redraws Esperance/Goldfields north along the border to cover the Ngaanyatjarra lands communities it services, instead of the poster's straight band.", initial: false },
  ];
  var OPTIONS_KEY = "rcm-prototype-options";
  el.options = document.getElementById("options");
  var options = loadOptions();

  function loadOptions() {
    var out = {};
    OPTIONS.forEach(function (o) { out[o.id] = o.initial; });
    try { Object.assign(out, JSON.parse(localStorage.getItem(OPTIONS_KEY)) || {}); } catch (err) { /* storage unavailable */ }
    var params = new URLSearchParams(location.search);
    OPTIONS.forEach(function (o) { if (params.has(o.id)) out[o.id] = params.get(o.id) === "1"; });
    return out;
  }
  function saveOptions() {
    try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch (err) { /* storage unavailable */ }
  }
  function optionsLink() {
    var url = new URL(location.href);
    OPTIONS.forEach(function (o) { url.searchParams.set(o.id, options[o.id] ? "1" : "0"); });
    return url.toString();
  }

  function renderOptions() {
    el.options.innerHTML =
      '<div class="options-head"><h2 id="options-title">Prototype options</h2>' +
      '<button type="button" data-options="close" aria-label="Close options">' + icon("close") + "</button></div>" +
      '<ul class="options-list">' + OPTIONS.map(function (o) {
        // An option that builds on another (set with requires) is greyed out until that one is on.
        var off = o.requires && !options[o.requires];
        return '<li><label class="option-row' + (off ? " disabled" : "") + '"><span class="option-text"><strong>' + esc(o.label) + "</strong><small>" + esc(o.description) + "</small></span>" +
          '<input type="checkbox" role="switch" data-option="' + o.id + '"' + (options[o.id] ? " checked" : "") + (off ? " disabled" : "") + '><span class="switch" aria-hidden="true"></span></label></li>';
      }).join("") + "</ul>" +
      '<div class="options-foot"><button type="button" data-options="copy">Copy link with these options</button><small>Shift + O to show or hide</small></div>';
  }
  function toggleOptions(show) {
    show = show === undefined ? el.options.hidden : show;
    if (show) renderOptions();
    el.options.hidden = !show;
    if (show) el.options.querySelector("input").focus();
  }
  el.options.addEventListener("change", function (e) {
    var id = e.target.dataset.option;
    if (!id) return;
    options[id] = e.target.checked;
    saveOptions();
    applyOptions();
    renderOptions();
    var again = el.options.querySelector('[data-option="' + id + '"]');
    if (again) again.focus();
  });
  el.options.addEventListener("click", function (e) {
    var t = e.target.closest("[data-options]");
    if (!t) return;
    if (t.dataset.options === "close") toggleOptions(false);
    if (t.dataset.options === "copy") {
      var link = optionsLink();
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { toast("Link copied"); }, function () { toast(link); });
      else toast(link);
    }
  });
  function showRegionVariant() {
    var variant = options.ngLands ? "ngLands" : "poster";
    el.stage.querySelectorAll(".regions").forEach(function (g) { g.style.display = g.dataset.variant === variant ? "" : "none"; });
  }

  function applyOptions() {
    showRegionVariant();
  }

  // ---------- Start ----------
  drawOutline();
  showRegionVariant();
  // Name labels are placed using measured text widths, so re-place them once the brand font has loaded.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { renderMarkers(); });
  render();
  fitState();
  routeFromHash();
})();
