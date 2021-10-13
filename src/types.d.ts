type ArrayLengthMutationKeys = 'splice' | 'push' | 'pop' | 'shift' | 'unshift' | number

type ArrayItems<T extends Array<any>> = T extends Array<infer TItems> ? TItems : never

type FixedLengthArray<T extends any[]> =  Pick<T, Exclude<keyof T, ArrayLengthMutationKeys>> & { [Symbol.iterator]: () => IterableIterator< ArrayItems<T> > }

import * as _d3 from "d3";

declare global {
  const d3: typeof _d3;
}