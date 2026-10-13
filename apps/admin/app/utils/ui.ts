/** Class strings shared by the board's surfaces, menus and controls. */

/**
 * A draggable card. While one is dragged, dnd-kit leaves a hidden copy where
 * it will land; it shows here as an empty dashed slot. dnd-kit mirrors the
 * dragged card's inline styles onto that copy, so the slot overrides the tilt
 * to stay upright.
 */
export const CARD_SURFACE =
  "rounded-lg bg-white shadow-border outline-none transition-shadow duration-150 select-none [-webkit-touch-callout:none] hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand data-dnd-dragging:shadow-raised data-dnd-placeholder:visible! data-dnd-placeholder:rotate-none! data-dnd-placeholder:bg-neutral-950/3 data-dnd-placeholder:shadow-none data-dnd-placeholder:outline-2 data-dnd-placeholder:-outline-offset-2 data-dnd-placeholder:outline-neutral-950/15 data-dnd-placeholder:outline-dashed data-dnd-placeholder:*:invisible";

/** A floating menu or popover panel. */
export const MENU_CONTENT =
  "z-50 flex max-h-(--reka-dropdown-menu-content-available-height) min-w-44 origin-(--reka-dropdown-menu-content-transform-origin) flex-col overflow-y-auto rounded-xl bg-white p-1 shadow-popover outline-none data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in";

export const POPOVER_CONTENT =
  "z-50 origin-(--reka-popover-content-transform-origin) rounded-xl bg-white shadow-popover outline-none data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in";

export const MENU_ITEM =
  "group/item flex h-8 shrink-0 cursor-default items-center gap-2.5 rounded-lg px-2 text-sm text-neutral-800 outline-none select-none data-disabled:opacity-50 data-highlighted:bg-neutral-100";

export const MENU_LABEL =
  "px-2 pt-1.5 pb-1 text-xs font-medium text-neutral-500 select-none";

/** Looks like a checkbox; shows on the highlighted row and on picked ones. */
export const MENU_CHECK =
  "flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-neutral-300 bg-white text-white opacity-0 transition-[opacity,background-color,border-color] duration-150 group-data-highlighted/item:opacity-100 group-data-[state=checked]/item:border-neutral-900 group-data-[state=checked]/item:bg-neutral-900 group-data-[state=checked]/item:opacity-100";

const PILL_BASE =
  "flex h-7 max-w-56 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium outline-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** A property as a pill, in the card dialog and the board's toolbar. */
export const PILL = `${PILL_BASE} bg-neutral-950/5 text-neutral-800 hover:bg-neutral-950/10 data-[state=open]:bg-neutral-950/10`;

/** A pill whose setting is on, like a filter in use. */
export const PILL_ACTIVE = `${PILL_BASE} bg-brand-soft text-brand hover:bg-brand/15 data-[state=open]:bg-brand/15`;

/**
 * An inline control on a card: sits where the bare value would, with room
 * around it to aim at.
 */
export const INLINE_TRIGGER =
  "-m-1 flex shrink-0 cursor-pointer items-center rounded-md p-1 outline-none transition-colors duration-150 hover:bg-neutral-950/5 focus-visible:outline-2 focus-visible:outline-brand data-[state=open]:bg-neutral-950/5";

/** A quiet square button holding an icon. */
export const ICON_BUTTON =
  "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-500 outline-none transition-colors duration-150 hover:bg-neutral-950/5 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-brand data-[state=open]:bg-neutral-950/5 data-[state=open]:text-neutral-900";
