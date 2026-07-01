/** App shell widths — calculator stays compact, catalog gets room for the table */
export const shellCalc = 'mx-auto w-full max-w-[72rem]';

export const shellCatalog = 'mx-auto w-full max-w-[80rem]';

/** Calculator top row: search · pricing */
export const calcTopGrid =
  'grid gap-3 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-stretch [&>*]:min-w-0';

/** Calculator bottom row: repairs · cart */
export const calcBottomGrid = 'grid gap-3 lg:grid-cols-2 lg:items-start';

/** Catalog table — one shared grid for header + rows */
export const catalogGrid =
  'grid grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)_minmax(0,0.85fr)_5.5rem_5.5rem_5.5rem] items-center gap-x-3';

export const catalogMinWidth = 'min-w-[640px] w-full';

/** Outer catalog shell — fills frame width, defers min-width to table scroll area */
export const catalogShell = 'w-full min-w-0';
