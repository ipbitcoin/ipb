/** Column definition consumed by `AdminTable`. */
export interface TableColumn {
  key: string;
  label: string;
  /** Right-aligned with tabular figures. */
  numeric?: boolean;
}
