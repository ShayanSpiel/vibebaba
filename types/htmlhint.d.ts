declare module 'htmlhint' {
  export function verify(html: string, rules?: any): any[];
  export const HTMLHint: any;
  export default HTMLHint;
}
