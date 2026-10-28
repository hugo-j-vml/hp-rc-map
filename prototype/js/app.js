(function () {
  "use strict";

  var C = window.RC_CONTENT;
  var OUTLINE = window.RC_OUTLINE;

  // ---------- Data ----------
  var regionsById = indexBy(C.regions);
  var programsById = indexBy(C.programs);
  var storiesById = {};
  C.stories.forEach(function (s) { storiesById[s.community] = s; });

  var communities = window.RC_COMMUNITIES.map(function (c) {
    var p = window.projectWA(c.lat, c.lng);
    return Object.assign({}, c, {
      x: p.x,
      y: p.y,
      story: storiesById[c.id] || null,
      works: C.works.filter(function (w) { return w.community === c.id; }),
    });
  });
  var byId = indexBy(communities);

  // ---------- State ----------
  var state = {
    view: "home",          // home | filters | profile
    selected: null,
    query: "",
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
  function fitState() {
    var a = visibleArea();
    var pad = isMobile() ? 24 : 40;
    baseK = Math.min((a.w - pad * 2) / OUTLINE.width, (a.h - pad * 2) / OUTLINE.height);
    view.k = baseK;
    view.x = a.x + (a.w - OUTLINE.width * baseK) / 2;
    view.y = a.y + (a.h - OUTLINE.height * baseK) / 2;
    applyView();
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
      applyView(p < 1);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function drawOutline() {
    var svgNS = "http://www.w3.org/2000/svg";
    var group = document.createElementNS(svgNS, "g");
    el.stage.appendChild(group);
    el.stageGroup = group;
    var shape = document.createElementNS(svgNS, "path");
    shape.setAttribute("d", OUTLINE.state);
    shape.setAttribute("class", "state");
    group.appendChild(shape);
    OUTLINE.regionLines.forEach(function (d) {
      var line = document.createElementNS(svgNS, "path");
      line.setAttribute("d", d);
      line.setAttribute("class", "region-line");
      group.appendChild(line);
    });
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
    labels.innerHTML = OUTLINE.regionLabels.map(function (l) {
      var p = toScreen(l.x, l.y);
      return '<span class="region-label" style="left:' + p.x + "px;top:" + p.y + 'px">' + esc(l.text) + "</span>";
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

    var groups = [].concat(
      cluster(outFilter).map(function (g) { g.faded = true; return g; }),
      cluster(inFilter),
      solo.map(function (c) {
        var p = toScreen(c.x, c.y);
        return { sx: p.x, sy: p.y, items: [c], faded: filtering && !matches(c) };
      })
    );

    // Every marker is an obstacle for labels, so a name never sits under a neighbouring dot.
    var placedLabels = groups.map(function (g, i) {
      var r = g.items.length > 1 ? 21 : g.items[0].id === state.selected ? 14 : 8;
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
      var labelPos = zoom >= LABEL_ZOOM ? placeLabel(placedLabels, i, g.sx, g.sy, c.name, selected ? 25 : 14) : null;
      return '<button type="button" class="marker' + (g.faded ? " faded" : "") + (selected ? " selected" : "") + (labelPos ? " has-label" : "") + '" ' + style +
        ' data-id="' + c.id + '" aria-label="' + esc(displayName(c)) + (c.story ? ", community with a story" : "") + '">' +
        '<span class="dot' + (c.story ? " story" : "") + (g.faded ? " faded" : "") + '"></span>' +
        (labelPos ? '<span class="marker-label at-' + labelPos + '">' + esc(c.name) + "</span>" : "") +
        '<span class="tooltip">' + esc(displayName(c)) + "</span></button>";
    }).join("");
    el.markers.innerHTML = html;
  }

  // Puts a community's name in the first free spot around its dot: right, then left, above, below and the
  // corners. Returns that position, or null when every spot would overlap another name or marker.
  var LABEL_SPOTS = ["right", "left", "top", "bottom", "top-right", "top-left", "bottom-right", "bottom-left"];
  function placeLabel(placed, owner, x, y, text, gap) {
    var w = textWidth(text), h = 16, corner = gap === 14 ? 4 : 10;
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
    measureCtx.font = "600 13px Inter, system-ui, sans-serif";
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
    var stats = C.stats.map(function (s) {
      return '<div class="stat"><strong>' + esc(s.value.replace("{count}", communities.length)) + "</strong><span>" + esc(s.label) + "</span></div>";
    }).join("");
    var resultsHtml = "";
    if (state.query.trim()) {
      resultsHtml = '<ul class="results" id="results" aria-label="Search results">' + (results.length
        ? results.map(function (c) {
          return '<li><button type="button" data-open="' + c.id + '"><span>' + esc(displayName(c)) +
            "</span><small>" + esc(regionsById[c.region].name) + "</small></button></li>";
        }).join("")
        : '<li class="empty">No communities match “' + esc(state.query) + "”</li>") + "</ul>";
    }
    var stories = C.stories.map(function (s) {
      var c = byId[s.community];
      return '<article class="story-card"><h3>' + esc(s.label || displayName(c)) + "</h3>" +
        "<p>" + esc(s.summary) + '</p><div class="placeholder">Image</div>' +
        '<a class="link-arrow" href="#community=' + c.id + '" data-open="' + c.id + '">Read more' + icon("arrow-right") + "</a></article>";
    }).join("");

    return '<div class="home">' +
      "<h1>Power for remote communities</h1>" +
      '<p class="intro">See the work we\'re doing with ' + communities.length + " remote Aboriginal communities across WA to keep the power on, safely and reliably.</p>" +
      '<div class="stats">' + stats + "</div>" +
      '<form class="search" role="search" id="search-form">' +
      '<label class="visually-hidden" for="search-input">Search communities</label>' +
      '<div class="search-field"><input id="search-input" type="search" autocomplete="off" placeholder="Search communities" value="' + esc(state.query) + '" aria-controls="results">' +
      '<button type="submit" aria-label="Search">' + icon("search") + "</button></div>" +
      '<button type="button" class="btn btn-secondary" data-action="filters">Filters' + (count ? ' <span class="count">' + count + "</span>" : "") + "</button>" +
      "</form>" + resultsHtml +
      '<section class="stories" id="stories" aria-label="Community stories">' + stories + "</section>" +
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
  function workItem(w) {
    var status = C.statuses.find(function (s) { return s.id === w.status; });
    var tagClass = w.status === "completed" ? "tag-solid" : w.status === "in-progress" ? "tag-mid" : "tag-outline";
    return '<div class="work-item">' + icon(w.icon) +
      "<div><strong>" + esc(w.title) + "</strong><small>" + esc(programsById[w.program].shortName + " · " + w.when) + "</small></div>" +
      '<span class="tag status ' + tagClass + '">' + esc(status.name) + "</span></div>";
  }

  function worksByProgram(c) {
    if (!c.works.length) {
      return '<p class="work-empty">[Works for this community will show here once the works data is loaded.]</p>';
    }
    return C.programs.map(function (p) {
      var list = c.works.filter(function (w) { return w.program === p.id; });
      if (!list.length) return "";
      return '<div class="work-group"><h4>' + esc(p.name.replace(/ \(.*/, "") + " (" + p.shortName + ")") + "</h4>" + list.map(workItem).join("") + "</div>";
    }).join("");
  }

  function contactBlock() {
    var k = C.contact;
    return '<section class="contact" id="yarn" aria-label="Your local service provider"><small>Your local service provider</small>' +
      "<h3>" + esc(k.heading) + "</h3><p>" + esc(k.body) + "</p>" +
      '<div class="buttons"><a class="btn btn-primary" href="tel:">Call ' + esc(k.phone) + " for a yarn" + icon("call") + "</a>" +
      '<a class="btn btn-secondary" href="mailto:">Email' + icon("email") + "</a></div>" +
      '<p class="alert">' + icon("info") + esc(k.emergency) + "</p></section>";
  }

  function nearbyList(c, howMany) {
    var near = communities.filter(function (o) { return o.id !== c.id; })
      .map(function (o) { return { c: o, km: distanceKm(c, o) }; })
      .sort(function (a, b) { return a.km - b.km; })
      .slice(0, howMany);
    return '<section class="section" aria-labelledby="nearby-h"><h3 id="nearby-h">Nearby communities</h3><ul class="nearby">' +
      near.map(function (n) {
        return '<li><button type="button" data-open="' + n.c.id + '">' + icon("pin") +
          '<span class="text"><strong>' + esc(n.c.name) + "</strong><small>" + Math.round(n.km) + " km away" +
          (n.c.story ? " · Community story" : "") + "</small></span>" + icon("chevron-right") + "</button></li>";
      }).join("") + "</ul></section>";
  }

  function profileBar(c) {
    return '<div class="profile-bar"><button type="button" class="back" data-action="home">' + icon("chevron-left") + "All communities</button>" +
      '<div class="actions"><button type="button" data-action="share" aria-label="Share ' + esc(c.name) + '">' + icon("share") + "</button>" +
      '<button type="button" data-action="home" aria-label="Close">' + icon("close") + "</button></div></div>";
  }

  function renderProfile(c) {
    return c.story ? renderStoryProfile(c) : renderSimpleProfile(c);
  }

  function renderStoryProfile(c) {
    var s = c.story;
    var aka = c.otherNames.length ? '<p class="aka">Also known as ' + esc(c.otherNames.join(", ")) + "</p>" : "";
    var visited = s.visited ? '<span class="tag tag-grey">' + icon("check") + "Our team visited · " + esc(s.visited) + "</span>" : "";
    var storyHtml;
    if (s.body) {
      storyHtml = '<section class="section" id="story"><h3>' + esc(s.title) + "</h3>" +
        s.body.map(function (p, i) { return "<p" + (i ? ' class="muted"' : "") + ">" + esc(p) + "</p>"; }).join("") +
        '<div class="placeholder video"><span class="play">' + icon("play") + "</span>" + esc(s.video) + "</div>" +
        '<p class="caption">Captions and transcript available</p>' +
        '<blockquote class="quote"><p>' + esc(s.quote) + "</p><footer>" + esc(s.quoteBy) + "</footer></blockquote></section>" +
        '<section class="section"><div class="section-head"><h3>Photos</h3><a href="#">View all ' + s.photos + "</a></div>" +
        '<div class="photos"><div class="placeholder">Photo</div><div class="placeholder">Photo</div><div class="placeholder">+' + (s.photos - 3) + " more</div></div></section>" +
        '<section class="section"><div class="section-head"><h3>Before and after</h3></div><div class="before-after">' +
        '<div><div class="placeholder">Photo</div><p class="caption">' + esc(s.beforeAfter[0]) + "</p></div>" +
        '<div><div class="placeholder">Photo</div><p class="caption">' + esc(s.beforeAfter[1]) + "</p></div></div></section>";
    } else {
      storyHtml = '<section class="section" id="story"><h3>[Story headline for ' + esc(c.name) + "]</h3><p>" + esc(s.summary) +
        '</p><p class="muted">[Full story, photos and video to come.]</p></section>';
    }

    return profileBar(c) +
      '<div class="placeholder hero">' + esc(s.heroCaption || "Hero photo (with consent)") + "</div>" +
      '<div class="profile-main">' +
      '<div class="profile-name"><h2 id="profile-title">' + esc(c.name) + "</h2>" + aka +
      '<div class="tags">' + visited + '<a class="tag tag-outline" href="#story" data-tab="story">Community story</a></div></div>' +
      '<nav class="tabs" aria-label="Sections">' +
      '<a href="#overview" data-tab="overview" aria-current="true">Overview</a><a href="#story" data-tab="story">Story</a>' +
      '<a href="#work" data-tab="work">Work</a><a href="#yarn" data-tab="yarn">Yarn with us</a></nav>' +
      '<div class="facts" id="overview">' +
      fact("Population", "[About 000 people]") + fact("Languages spoken", "[Language names]") +
      fact("Traditional Owners", "[Traditional Owner group]") + fact("Service provider", "[RSP name]") + "</div>" +
      storyHtml +
      '<section class="section" id="work"><h3>What we\'ve done and what\'s planned</h3>' + worksByProgram(c) + "</section>" +
      contactBlock() + nearbyList(c, 3) +
      '<p class="updated">Last updated [date] · Something not right? <a href="#yarn">Yarn with us</a></p>' +
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
      '<div class="placeholder hero small">Illustration (no photos yet)</div>' +
      '<div class="profile-main">' +
      '<div class="profile-name"><h2 id="profile-title">' + esc(c.name) + "</h2>" + aka + "</div>" +
      '<div class="facts">' + fact("Region", regionsById[c.region].name) + fact("Service provider", "[RSP name]") + "</div>" +
      '<section class="section" id="work" aria-label="Work in this community">' + worksByProgram(c) + "</section>" +
      explainers + contactBlock() + nearbyList(c, 2) +
      '<p class="updated">Last updated [date] · Something not right? <a href="#yarn">Yarn with us</a></p>' +
      "</div>";
  }

  function fact(label, value) {
    return '<div class="fact"><span>' + esc(label) + "</span><strong>" + esc(value) + "</strong></div>";
  }

  // ---------- Panel rendering ----------
  function render(opts) {
    opts = opts || {};
    var c = state.selected ? byId[state.selected] : null;
    var html = state.view === "filters" ? renderFilters() : state.view === "profile" && c ? renderProfile(c) : renderHome();
    var scroll = el.body.scrollTop;
    el.body.innerHTML = html;
    el.body.scrollTop = opts.keepScroll ? scroll : 0;

    el.panel.classList.toggle("profile", state.view === "profile");
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
    var t = e.target.closest("[data-open],[data-action],[data-filter],[data-tab]");
    if (!t) return;
    if (t.dataset.open) {
      e.preventDefault();
      openProfile(t.dataset.open);
    } else if (t.dataset.filter) {
      var set = state.filters[t.dataset.filter];
      if (set.has(t.dataset.value)) set.delete(t.dataset.value); else set.add(t.dataset.value);
      render({ keepScroll: true });
    } else if (t.dataset.tab) {
      e.preventDefault();
      el.body.querySelectorAll(".tabs a").forEach(function (a) { a.setAttribute("aria-current", String(a.dataset.tab === t.dataset.tab)); });
      var target = document.getElementById(t.dataset.tab);
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
    var pos = e.target.selectionStart;
    render({ keepScroll: true });
    var input = document.getElementById("search-input");
    input.focus();
    input.setSelectionRange(pos, pos);
  });
  el.body.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = search(state.query)[0];
    if (first) openProfile(first.id);
  });

  document.querySelector(".sheet-handle").addEventListener("click", function () {
    state.expanded = !state.expanded;
    el.panel.classList.toggle("expanded", state.expanded);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && state.view !== "home") goHome();
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

  // ---------- Start ----------
  drawOutline();
  render();
  fitState();
  routeFromHash();
})();
