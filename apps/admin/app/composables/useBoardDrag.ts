import { move } from "@dnd-kit/helpers";
import { KeyboardSensor, PointerSensor } from "@dnd-kit/vue";
import type {
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/vue";

import type { BoardCard, CardMove } from "~/utils/boards";

// Enter opens a card, so only Space picks one up.
const SENSORS = [
  PointerSensor,
  KeyboardSensor.configure({
    keyboardCodes: {
      ...KeyboardSensor.defaults.keyboardCodes,
      start: ["Space"],
    },
  }),
];

/** Each column as the ids of its cards, the shape dnd-kit's `move` rearranges. */
type IdGroups = Record<string, string[]>;

function idsOf<T extends BoardCard>(groups: Record<string, T[]>): IdGroups {
  return Object.fromEntries(
    Object.entries(groups).map(([key, cards]) => [
      key,
      cards.map((card) => card._id),
    ])
  );
}

/**
 * Keeps a local copy of the columns while dragging and reports the new orders
 * on drop. A card dragged by pointer tilts with its movement.
 */
export function useBoardDrag<T extends BoardCard>(
  groups: () => Record<string, T[]>,
  onMove: (moves: CardMove[]) => void
) {
  const dragIds = shallowRef<IdGroups | null>(null);
  const tilt = createDragTilt();
  onBeforeUnmount(tilt.stop);

  // The cards in the order the drag left them; ones gone meanwhile drop out.
  function resolve(ids: IdGroups): Record<string, T[]> {
    const byId = new Map(
      Object.values(groups())
        .flat()
        .map((card) => [card._id, card])
    );
    return Object.fromEntries(
      Object.keys(groups()).map((key) => [
        key,
        (ids[key] ?? []).flatMap((id) => {
          const card = byId.get(id);
          return card ? [card] : [];
        }),
      ])
    );
  }

  const shown = computed(() =>
    dragIds.value ? resolve(dragIds.value) : groups()
  );

  function onDragStart(event: DragStartEvent) {
    dragIds.value = idsOf(groups());
    const { activatorEvent, position, source } = event.operation;
    if (!(activatorEvent instanceof KeyboardEvent)) {
      tilt.start(source?.element, position.current);
    }
  }

  function onDragMove(event: DragMoveEvent) {
    tilt.move(
      event.operation.source?.element,
      event.operation.position.current
    );
  }

  function onDragOver(event: DragOverEvent) {
    dragIds.value = move(dragIds.value ?? idsOf(groups()), event);
  }

  function onDragEnd(event: DragEndEvent) {
    tilt.stop();
    const final = dragIds.value ? resolve(dragIds.value) : null;
    dragIds.value = null;
    const id = event.operation.source?.id;
    if (event.canceled || !final || id === undefined) {
      return;
    }
    for (const [status, cards] of Object.entries(final)) {
      const index = cards.findIndex((card) => card._id === id);
      if (index !== -1) {
        if (groups()[status]?.[index]?._id !== id) {
          onMove(placeCard(cards, index, status));
        }
        return;
      }
    }
  }

  return {
    groups: shown,
    handlers: { onDragEnd, onDragMove, onDragOver, onDragStart },
    sensors: SENSORS,
  };
}
