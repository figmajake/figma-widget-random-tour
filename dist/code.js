(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/code.tsx
  var { createRectangle, currentPage, getNodeById, showUI, ui, widget } = figma;
  var {
    useEffect,
    useSyncedMap,
    useSyncedState,
    useWidgetId,
    AutoLayout,
    Text
  } = widget;
  var border = 10;
  function safeGetNodeById(nodeId) {
    const found = nodeId ? getNodeById(nodeId) : null;
    return found ? found : null;
  }
  function setRectangleColor(node, r, g, b) {
    const rgb = { r, g, b };
    const solid = { type: "SOLID", color: rgb, opacity: 1 };
    node.strokes = [solid];
    node.strokeAlign = "CENTER";
    node.strokeWeight = border * 0.8;
    node.fills = [];
  }
  function RandomFromSelection() {
    const current = useSyncedMap("current");
    const future = useSyncedMap("future");
    const past = useSyncedMap("past");
    const [widgetId] = useSyncedState("widgetId", useWidgetId());
    const currentRectangleId = () => current.values()[0];
    const currentNodeId = () => current.keys()[0];
    const qualifyingType = (type) => {
      switch (type) {
        case "FRAME":
        case "GROUP":
        case "RECTANGLE":
        case "SHAPE_WITH_TEXT":
        case "COMPONENT":
        case "WIDGET":
        case "STICKY":
        case "TEXT":
          return true;
      }
      return false;
    };
    const getRandomNode = () => {
      const keys = future.keys();
      if (keys.length) {
        const key = keys[Math.floor(Math.random() * keys.length)];
        if (current.size) {
          const k = currentNodeId();
          past.set(k, currentRectangleId());
          current.delete(k);
        }
        current.set(key, future.get(key) || "");
        future.delete(key);
        return safeGetNodeById(key) || null;
      }
      return null;
    };
    const handleAddToTour = () => {
      const tourWidgetGroupName = "tour-widget-group";
      const items = currentPage.selection.filter((item) => {
        return item.id !== widgetId && qualifyingType(item.type) && item.name !== tourWidgetGroupName && (!item.parent || item.parent.name !== tourWidgetGroupName);
      });
      items.forEach((node) => {
        const parent = node == null ? void 0 : node.parent;
        if (parent) {
          const index = parent.children.indexOf(node);
          const group = figma.group([node], parent, index);
          group.name = tourWidgetGroupName;
          const extra = border * 1.5;
          const rect = safeGetNodeById(future.get(node.id)) || createRectangle();
          setRectangleColor(rect, 0.97, 0.97, 0.97);
          rect.cornerRadius = 10;
          rect.resize(group.width + extra * 2, group.height + extra * 2);
          rect.x = group.x - extra;
          rect.y = group.y - extra;
          group.insertChild(0, rect);
          future.set(node.id, rect.id);
        }
      });
    };
    const handleReset = () => {
      const clear = (map) => {
        map.keys().forEach((key) => {
          const item = safeGetNodeById(key);
          const rect = safeGetNodeById(map.get(key));
          if (rect && item) {
            const parent = rect.parent;
            if (parent) {
              const grandparent = parent.parent;
              if (grandparent && rect.parent) {
                const p = safeGetNodeById(rect.parent.id);
                if (p) {
                  const index = grandparent.children.indexOf(p);
                  grandparent.insertChild(index, item);
                }
              }
            }
            rect.remove();
          }
          map.delete(key);
        });
      };
      clear(future);
      clear(past);
      clear(current);
    };
    const handleTourStep = () => {
      const curr = safeGetNodeById(currentRectangleId());
      const next = getRandomNode();
      if (next) {
        if (curr) {
          setRectangleColor(curr, 1, 0.8, 0.8);
        }
        const rect = safeGetNodeById(currentRectangleId());
        if (rect) {
          setRectangleColor(rect, 1, 0, 0);
        }
      }
    };
    const sharedButtonProps = {
      fill: "#fff",
      height: 50,
      strokeWidth: 2,
      horizontalAlignItems: "center",
      padding: { top: 10, bottom: 10, left: 30, right: 30 },
      verticalAlignItems: "center",
      width: "fill-parent"
    };
    const sharedTextProps = {
      fontSize: 20,
      fontWeight: "semi-bold"
    };
    const totalSize = future.size + current.size + past.size;
    return /* @__PURE__ */ figma.widget.h(AutoLayout, {
      direction: "vertical",
      spacing: 16
    }, totalSize ? /* @__PURE__ */ figma.widget.h(AutoLayout, __spreadProps(__spreadValues({}, sharedButtonProps), {
      fill: "#000",
      onClick: handleTourStep
    }), /* @__PURE__ */ figma.widget.h(Text, __spreadProps(__spreadValues({}, sharedTextProps), {
      fill: "#FFF"
    }), "Tour! (", past.size + current.size, "/", totalSize, ")")) : null, /* @__PURE__ */ figma.widget.h(AutoLayout, __spreadProps(__spreadValues({}, sharedButtonProps), {
      stroke: "#000",
      onClick: handleAddToTour
    }), /* @__PURE__ */ figma.widget.h(Text, __spreadProps(__spreadValues({}, sharedTextProps), {
      fill: "#000"
    }), "Add to Tour")), totalSize ? /* @__PURE__ */ figma.widget.h(AutoLayout, __spreadProps(__spreadValues({}, sharedButtonProps), {
      stroke: "#F00",
      onClick: handleReset
    }), /* @__PURE__ */ figma.widget.h(Text, __spreadProps(__spreadValues({}, sharedTextProps), {
      fill: "#F00"
    }), "Reset")) : null);
  }
  widget.register(RandomFromSelection);
})();
