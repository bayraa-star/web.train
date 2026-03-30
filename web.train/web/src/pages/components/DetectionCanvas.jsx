import { useEffect, useMemo, useRef, useState } from "react";

const MIN_BOX_SIZE = 0.01;
const NUDGE_STEP = 0.0025;
const LARGE_NUDGE_STEP = 0.01;

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

const clampAnnotation = (annotation) => {
  const x = clamp(Number(annotation?.x || 0), 0, 1);
  const y = clamp(Number(annotation?.y || 0), 0, 1);
  const width = clamp(Number(annotation?.width || 0), 0, 1 - x);
  const height = clamp(Number(annotation?.height || 0), 0, 1 - y);

  return {
    ...annotation,
    x,
    y,
    width,
    height,
  };
};

const buildAnnotation = (start, end) => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return clampAnnotation({
    x,
    y,
    width,
    height,
  });
};

const resizeAnnotation = (annotation, handle, point) => {
  const startX = annotation.x;
  const startY = annotation.y;
  const endX = annotation.x + annotation.width;
  const endY = annotation.y + annotation.height;

  const next = {
    left: handle.includes("w") ? point.x : startX,
    top: handle.includes("n") ? point.y : startY,
    right: handle.includes("e") ? point.x : endX,
    bottom: handle.includes("s") ? point.y : endY,
  };

  return buildAnnotation(
    { x: next.left, y: next.top },
    { x: next.right, y: next.bottom }
  );
};

const moveAnnotation = (annotation, delta) => {
  const width = Number(annotation?.width || 0);
  const height = Number(annotation?.height || 0);

  return {
    ...annotation,
    x: clamp(Number(annotation?.x || 0) + delta.x, 0, 1 - width),
    y: clamp(Number(annotation?.y || 0) + delta.y, 0, 1 - height),
  };
};

const DetectionCanvas = ({
  src,
  annotations = [],
  onChange,
  imageMeta,
  onImageMetaChange,
  classOptions = [],
  readOnly = false,
  onRequestSave,
}) => {
  const containerRef = useRef(null);
  const interactionRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({
    width: Number(imageMeta?.width || 0),
    height: Number(imageMeta?.height || 0),
  });
  const [selectedId, setSelectedId] = useState("");
  const [draftAnnotation, setDraftAnnotation] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [viewport, setViewport] = useState({ zoom: 1, panX: 0, panY: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const normalizedClassOptions = useMemo(
    () => (classOptions.length > 0 ? classOptions : ["plate"]),
    [classOptions]
  );
  const [activeClassName, setActiveClassName] = useState(normalizedClassOptions[0]);

  useEffect(() => {
    if (!src) {
      setNaturalSize({
        width: Number(imageMeta?.width || 0),
        height: Number(imageMeta?.height || 0),
      });
      return undefined;
    }

    let active = true;
    const image = new window.Image();

    image.onload = () => {
      if (!active) return;

      const nextSize = {
        width: image.naturalWidth || Number(imageMeta?.width || 0),
        height: image.naturalHeight || Number(imageMeta?.height || 0),
      };

      setNaturalSize(nextSize);
      onImageMetaChange && onImageMetaChange(nextSize);
    };

    image.src = src;

    return () => {
      active = false;
    };
  }, [imageMeta?.height, imageMeta?.width, onImageMetaChange, src]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) return;

      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return undefined;
    }

    const handleWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();

      setViewport((previous) => ({
        ...previous,
        zoom: clamp(previous.zoom + (event.deltaY < 0 ? 0.15 : -0.15), 0.4, 6),
      }));
    };

    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    setSelectedId((previous) =>
      annotations.some((annotation) => annotation.id === previous) ? previous : ""
    );
  }, [annotations]);

  useEffect(() => {
    setActiveClassName((previous) =>
      normalizedClassOptions.includes(previous)
        ? previous
        : normalizedClassOptions[0]
    );
  }, [normalizedClassOptions]);

  useEffect(() => {
    if (!selectedId) return;

    const selected = annotations.find((annotation) => annotation.id === selectedId);

    if (selected?.className) {
      setActiveClassName(selected.className);
    }
  }, [annotations, selectedId]);

  useEffect(() => {
    if (!isActive || readOnly) {
      return undefined;
    }

    const onKeyDown = (event) => {
      const isInputTarget = ["INPUT", "TEXTAREA"].includes(
        event.target?.tagName || ""
      );

      if (event.key === " ") {
        event.preventDefault();
        setSpacePressed(true);
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onRequestSave && onRequestSave();
        return;
      }

      if (isInputTarget) {
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setActiveTool("draw");
        return;
      }

      if (event.key.toLowerCase() === "v") {
        event.preventDefault();
        setActiveTool("select");
        return;
      }

      const hotkeyIndex = Number(event.key);

      if (
        hotkeyIndex >= 1 &&
        hotkeyIndex <= normalizedClassOptions.length &&
        normalizedClassOptions[hotkeyIndex - 1]
      ) {
        event.preventDefault();
        const nextClassName = normalizedClassOptions[hotkeyIndex - 1];
        setActiveClassName(nextClassName);

        if (selectedId) {
          onChange(
            annotations.map((annotation) =>
              annotation.id === selectedId
                ? { ...annotation, className: nextClassName }
                : annotation
            )
          );
        }
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        interactionRef.current = null;
        setDraftAnnotation(null);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        setViewport((previous) => ({
          ...previous,
          zoom: clamp(previous.zoom + 0.2, 0.4, 6),
        }));
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        setViewport((previous) => ({
          ...previous,
          zoom: clamp(previous.zoom - 0.2, 0.4, 6),
        }));
        return;
      }

      if (event.key === "0") {
        event.preventDefault();
        setViewport({ zoom: 1, panX: 0, panY: 0 });
        return;
      }

      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedId &&
        !readOnly
      ) {
        event.preventDefault();
        onChange(annotations.filter((annotation) => annotation.id !== selectedId));
        setSelectedId("");
        return;
      }

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key) &&
        selectedId &&
        !readOnly
      ) {
        event.preventDefault();
        const step = event.shiftKey ? LARGE_NUDGE_STEP : NUDGE_STEP;

        onChange(
          annotations.map((annotation) => {
            if (annotation.id !== selectedId) {
              return annotation;
            }

            return moveAnnotation(annotation, {
              x:
                event.key === "ArrowLeft"
                  ? -step
                  : event.key === "ArrowRight"
                    ? step
                    : 0,
              y:
                event.key === "ArrowUp"
                  ? -step
                  : event.key === "ArrowDown"
                    ? step
                    : 0,
            });
          })
        );
      }
    };

    const onKeyUp = (event) => {
      if (event.key === " ") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    annotations,
    isActive,
    normalizedClassOptions,
    onChange,
    onRequestSave,
    readOnly,
    selectedId,
  ]);

  const stageSize = useMemo(() => {
    const maxWidth = Math.max(containerSize.width - 2, 320);
    const maxHeight = 420;
    const naturalWidth = naturalSize.width || 1;
    const naturalHeight = naturalSize.height || 1;
    const fitScale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);

    return {
      width: naturalWidth * fitScale,
      height: naturalHeight * fitScale,
    };
  }, [containerSize.width, naturalSize.height, naturalSize.width]);

  const stageOffset = useMemo(() => {
    return {
      x: Math.max((containerSize.width - stageSize.width * viewport.zoom) / 2, 0),
      y: Math.max((containerSize.height - stageSize.height * viewport.zoom) / 2, 0),
    };
  }, [containerSize.height, containerSize.width, stageSize.height, stageSize.width, viewport.zoom]);

  const toStagePoint = (event) => {
    const rect = containerRef.current?.getBoundingClientRect();

    if (!rect || !stageSize.width || !stageSize.height) {
      return { x: 0, y: 0 };
    }

    const localX =
      (event.clientX - rect.left - stageOffset.x - viewport.panX) / viewport.zoom;
    const localY =
      (event.clientY - rect.top - stageOffset.y - viewport.panY) / viewport.zoom;

    return {
      x: clamp(localX / stageSize.width, 0, 1),
      y: clamp(localY / stageSize.height, 0, 1),
    };
  };

  const commitAnnotations = (nextAnnotations) => {
    onChange(nextAnnotations.map(clampAnnotation));
  };

  const onPointerMove = (event) => {
    const interaction = interactionRef.current;

    if (!interaction) return;

    if (interaction.type === "pan") {
      setViewport((previous) => ({
        ...previous,
        panX: interaction.startPanX + (event.clientX - interaction.startClientX),
        panY: interaction.startPanY + (event.clientY - interaction.startClientY),
      }));
      return;
    }

    const point = toStagePoint(event);

    if (interaction.type === "draw") {
      setDraftAnnotation(buildAnnotation(interaction.startPoint, point));
      return;
    }

    if (interaction.type === "move") {
      commitAnnotations(
        annotations.map((annotation) =>
          annotation.id === interaction.annotationId
            ? moveAnnotation(interaction.annotation, {
                x: point.x - interaction.startPoint.x,
                y: point.y - interaction.startPoint.y,
              })
            : annotation
        )
      );
      return;
    }

    if (interaction.type === "resize") {
      commitAnnotations(
        annotations.map((annotation) =>
          annotation.id === interaction.annotationId
            ? resizeAnnotation(interaction.annotation, interaction.handle, point)
            : annotation
        )
      );
    }
  };

  const onPointerUp = () => {
    const interaction = interactionRef.current;

    if (interaction?.type === "draw" && draftAnnotation) {
      if (
        draftAnnotation.width >= MIN_BOX_SIZE &&
        draftAnnotation.height >= MIN_BOX_SIZE
      ) {
        const nextAnnotation = {
          id: `ann-${Date.now()}`,
          className: activeClassName || normalizedClassOptions[0],
          ...draftAnnotation,
        };

        commitAnnotations([...annotations, nextAnnotation]);
        setSelectedId(nextAnnotation.id);
      }
    }

    interactionRef.current = null;
    setDraftAnnotation(null);
  };

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  });

  const startDraw = (event) => {
    if (readOnly) return;

    setIsActive(true);

    if (spacePressed) {
      interactionRef.current = {
        type: "pan",
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: viewport.panX,
        startPanY: viewport.panY,
      };
      return;
    }

    if (activeTool !== "draw") {
      setSelectedId("");
      return;
    }

    const point = toStagePoint(event);
    interactionRef.current = {
      type: "draw",
      startPoint: point,
    };
    setDraftAnnotation(
      buildAnnotation(point, {
        x: point.x,
        y: point.y,
      })
    );
  };

  const startMoveAnnotation = (event, annotation) => {
    if (readOnly) return;

    event.stopPropagation();
    setIsActive(true);
    setActiveTool("select");
    setSelectedId(annotation.id);

    if (spacePressed) {
      interactionRef.current = {
        type: "pan",
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: viewport.panX,
        startPanY: viewport.panY,
      };
      return;
    }

    interactionRef.current = {
      type: "move",
      annotationId: annotation.id,
      annotation,
      startPoint: toStagePoint(event),
    };
  };

  const startResizeAnnotation = (event, annotation, handle) => {
    if (readOnly) return;

    event.stopPropagation();
    setIsActive(true);
    setSelectedId(annotation.id);
    interactionRef.current = {
      type: "resize",
      annotationId: annotation.id,
      annotation,
      handle,
    };
  };

  const selectedAnnotation = annotations.find((annotation) => annotation.id === selectedId);
  const deleteSelectedAnnotation = () => {
    if (readOnly || !selectedId) return;

    onChange(annotations.filter((annotation) => annotation.id !== selectedId));
    setSelectedId("");
  };

  return (
    <div
      className="rounded border bg-slate-950 p-3 text-white"
      onPointerDown={() => setIsActive(true)}
      onPointerEnter={() => setIsActive(true)}
      onPointerLeave={() => setIsActive(false)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTool("select")}
          className={`!w-auto rounded border px-3 py-1 text-xs ${
            activeTool === "select" ? "bg-white text-black" : "border-white/30"
          }`}
        >
          Select `V`
        </button>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => setActiveTool("draw")}
            className={`!w-auto rounded border px-3 py-1 text-xs ${
              activeTool === "draw" ? "bg-cyan-300 text-black" : "border-white/30"
            }`}
          >
            Box `B`
          </button>
        ) : null}
        {!readOnly ? (
          <button
            type="button"
            onClick={deleteSelectedAnnotation}
            disabled={!selectedId}
            className="!w-auto rounded border border-red-400 px-3 py-1 text-xs text-red-200 disabled:opacity-40"
          >
            Delete Selected
          </button>
        ) : null}
        <button
          type="button"
          onClick={() =>
            setViewport((previous) => ({
              ...previous,
              zoom: clamp(previous.zoom + 0.2, 0.4, 6),
            }))
          }
          className="!w-auto rounded border border-white/30 px-3 py-1 text-xs"
        >
          Zoom +
        </button>
        <button
          type="button"
          onClick={() =>
            setViewport((previous) => ({
              ...previous,
              zoom: clamp(previous.zoom - 0.2, 0.4, 6),
            }))
          }
          className="!w-auto rounded border border-white/30 px-3 py-1 text-xs"
        >
          Zoom -
        </button>
        <button
          type="button"
          onClick={() => setViewport({ zoom: 1, panX: 0, panY: 0 })}
          className="!w-auto rounded border border-white/30 px-3 py-1 text-xs"
        >
          Reset `0`
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {normalizedClassOptions.map((className, index) => {
            const isSelected =
              (selectedAnnotation?.className || activeClassName) === className;

            return (
              <button
                key={className}
                type="button"
                onClick={() => {
                  setActiveClassName(className);

                  if (!readOnly && selectedId) {
                    onChange(
                      annotations.map((annotation) =>
                        annotation.id === selectedId
                          ? { ...annotation, className }
                          : annotation
                      )
                    );
                  }
                }}
                className={`!w-auto rounded border px-3 py-1 text-xs ${
                  isSelected
                    ? "border-amber-300 bg-amber-300 text-black"
                    : "border-white/30"
                }`}
              >
                {index + 1}. {className}
              </button>
            );
          })}
        </div>
        <div className="ml-auto text-[11px] text-slate-400">
          Drag to draw. Space + drag to pan. `1-9` sets class. Arrows nudge. Del removes.
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative mt-3 h-[28rem] overflow-hidden rounded bg-black/40"
        onPointerDown={startDraw}
        style={{ touchAction: "none" }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{
            width: stageSize.width,
            height: stageSize.height,
            transform: `translate(${stageOffset.x + viewport.panX}px, ${
              stageOffset.y + viewport.panY
            }px) scale(${viewport.zoom})`,
          }}
        >
          <img
            src={src}
            alt="annotation target"
            className="absolute inset-0 h-full w-full select-none object-contain"
            draggable={false}
          />

          <svg className="absolute inset-0 h-full w-full">
            {annotations.map((annotation) => {
              const x = annotation.x * stageSize.width;
              const y = annotation.y * stageSize.height;
              const width = annotation.width * stageSize.width;
              const height = annotation.height * stageSize.height;
              const selected = annotation.id === selectedId;
              const stroke = selected ? "#22d3ee" : "#f59e0b";

              return (
                <g key={annotation.id}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill="rgba(34,211,238,0.12)"
                    stroke={stroke}
                    strokeWidth={selected ? 1 : 0.75}
                    onPointerDown={(event) => startMoveAnnotation(event, annotation)}
                  />
                  <text
                    x={x + 6}
                    y={y + 16}
                    fill={stroke}
                    fontSize="12"
                    fontWeight="600"
                  >
                    {annotation.className || normalizedClassOptions[0]}
                  </text>
                  {!readOnly && selected
                    ? ["nw", "ne", "sw", "se"].map((handle) => {
                        const handleX =
                          handle.includes("w") ? x : x + width;
                        const handleY =
                          handle.includes("n") ? y : y + height;

                        return (
                          <rect
                            key={handle}
                            x={handleX - 3}
                            y={handleY - 3}
                            width={6}
                            height={6}
                            fill="#22d3ee"
                            stroke="#0f172a"
                            onPointerDown={(event) =>
                              startResizeAnnotation(event, annotation, handle)
                            }
                          />
                        );
                      })
                    : null}
                </g>
              );
            })}

            {draftAnnotation ? (
              <rect
                x={draftAnnotation.x * stageSize.width}
                y={draftAnnotation.y * stageSize.height}
                width={draftAnnotation.width * stageSize.width}
                height={draftAnnotation.height * stageSize.height}
                fill="rgba(244,114,182,0.14)"
                stroke="#f472b6"
                strokeDasharray="6 4"
                strokeWidth={1}
              />
            ) : null}
          </svg>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Boxes: {annotations.length}
        {selectedId ? ` • Selected ${selectedId}` : ""}
        {selectedAnnotation?.className ? ` • Class ${selectedAnnotation.className}` : ""}
      </div>
    </div>
  );
};

export default DetectionCanvas;
