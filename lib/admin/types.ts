/** Result every admin form action returns; shown as a toast. */
export interface ActionState {
  ok?: boolean;
  message?: string;
  /** Timestamp so repeating the same result still triggers the toast. */
  at?: number;
}

export const done = (message: string): ActionState => ({ ok: true, message, at: Date.now() });
export const failed = (message: string): ActionState => ({ ok: false, message, at: Date.now() });
