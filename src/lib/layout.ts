/** App shell widths — calculator stays compact, catalog gets room for the table */
export const shellCalc = 'mx-auto w-full max-w-[72rem]';

export const shellCatalog = 'mx-auto w-full max-w-[80rem]';

/** Calculator top row: search · pricing */
export const calcTopGrid =
  'grid gap-3 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] lg:items-stretch [&>*]:min-w-0';

/** Calculator bottom row: repairs · cart */
export const calcBottomGrid = 'grid gap-3 lg:grid-cols-2 lg:items-start';

/** Catalog table — shared grid for header + rows, fluid inside frame */
export const catalogGrid =
  'grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.75fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)_minmax(4.5rem,1fr)] items-center gap-x-2 px-3';

/** Catalog root — sized by frame CSS, not a fixed min-width */
export const catalogShell = 'fw-catalog w-full min-w-0';
