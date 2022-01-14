const { createRectangle, currentPage, getNodeById, showUI, ui, widget } = figma;
const {
  useEffect,
  useSyncedMap,
  useSyncedState,
  useWidgetId,
  AutoLayout,
  Text,
} = widget;

const border = 10;

function safeGetNodeById<T>(nodeId?: string | null): T | null {
  const found: unknown = nodeId ? getNodeById(nodeId) : null;
  return found ? (found as T) : null;
}

function setRectangleColor(
  node: RectangleNode,
  r: number,
  g: number,
  b: number
) {
  const rgb = { r, g, b };

  const solid: Paint = { type: "SOLID", color: rgb, opacity: 1 };
  node.strokes = [solid];
  node.strokeAlign = "CENTER";
  node.strokeWeight = border * 0.8;
  node.fills = [];
}

function RandomFromSelection() {
  const current = useSyncedMap<string>("current");
  const future = useSyncedMap<string>("future");
  const past = useSyncedMap<string>("past");
  const [widgetId] = useSyncedState<string>("widgetId", useWidgetId());

  const currentRectangleId = () => current.values()[0];
  const currentNodeId = () => current.keys()[0];

  const qualifyingType = (type: string): boolean => {
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
      return safeGetNodeById<SceneNode>(key) || null;
    }
    return null;
  };

  const handleAddToTour = () => {
    const tourWidgetGroupName = "tour-widget-group";
    const items = currentPage.selection.filter((item) => {
      return (
        item.id !== widgetId &&
        qualifyingType(item.type) &&
        item.name !== tourWidgetGroupName &&
        (!item.parent || item.parent.name !== tourWidgetGroupName)
      );
    });
    items.forEach((node) => {
      const parent = node?.parent;
      if (parent) {
        const index = parent.children.indexOf(node);
        const group = figma.group([node], parent, index);
        group.name = tourWidgetGroupName;
        const extra = border * 1.5;
        const rect =
          safeGetNodeById<RectangleNode>(future.get(node.id)) ||
          createRectangle();
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
    const clear = (map: SyncedMap<string>) => {
      map.keys().forEach((key) => {
        const item = safeGetNodeById<SceneNode>(key);
        const rect = safeGetNodeById<RectangleNode>(map.get(key));
        if (rect && item) {
          const parent = rect.parent;
          if (parent) {
            const grandparent = parent.parent;
            if (grandparent && rect.parent) {
              const p = safeGetNodeById<SceneNode>(rect.parent.id);
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
    const curr = safeGetNodeById<RectangleNode>(currentRectangleId());
    const next = getRandomNode();
    if (next) {
      if (curr) {
        setRectangleColor(curr, 1, 0.8, 0.8);
      }
      const rect = safeGetNodeById<RectangleNode>(currentRectangleId());
      if (rect) {
        setRectangleColor(rect, 1, 0, 0);
      }
    }
  };

  const sharedButtonProps: AutoLayoutProps = {
    fill: "#fff",
    height: 50,
    strokeWidth: 2,
    horizontalAlignItems: "center",
    padding: { top: 10, bottom: 10, left: 30, right: 30 },
    verticalAlignItems: "center",
    width: "fill-parent",
  };

  const sharedTextProps: TextProps = {
    fontSize: 20,
    fontWeight: "semi-bold",
  };

  const totalSize = future.size + current.size + past.size;

  return (
    <AutoLayout direction="vertical" spacing={16}>
      {totalSize ? (
        <AutoLayout {...sharedButtonProps} fill="#000" onClick={handleTourStep}>
          <Text {...sharedTextProps} fill="#FFF">
            Tour! ({past.size + current.size}/{totalSize})
          </Text>
        </AutoLayout>
      ) : null}
      <AutoLayout
        {...sharedButtonProps}
        stroke="#000"
        onClick={handleAddToTour}
      >
        <Text {...sharedTextProps} fill="#000">
          Add to Tour
        </Text>
      </AutoLayout>
      {totalSize ? (
        <AutoLayout {...sharedButtonProps} stroke="#F00" onClick={handleReset}>
          <Text {...sharedTextProps} fill="#F00">
            Reset
          </Text>
        </AutoLayout>
      ) : null}
    </AutoLayout>
  );
}

widget.register(RandomFromSelection);
