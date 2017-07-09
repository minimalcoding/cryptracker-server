
interface IDictionary<V> { [key: string]: V }

type Row = string[];

interface NestedArray <T> {
    [index: number]: T | NestedArray<T>;
    length: number;
}

declare module 'ramda' {
    export function map<V, R>(fn: (input: V) => R, array: V[]): R[];
    export function map<V, R>(fn: (input: V) => R): (array: V[]) => R[];
    export function mapObjIndexed<V, R>(fn: (value: V, key: string) => R, input: IDictionary<V>): IDictionary<R>;
    export function mapObjIndexed<V, R>(fn: (value: V, key: string) => R): (input: IDictionary<V>) => IDictionary<R>;
    export function trim(entry: string): string;
    export function flatten<T>(array: NestedArray<T>): T[];
    export function head<T>(array: T[]): T;
    export function drop<T>(n: number, array: T[]): T[];
    export function drop<T>(n: number): (array: T[]) => T[];
    export function tap<T>(fn: (input: T) => void, array: T[]): T[];
    export function tap<T>(fn: (input: T) => void): (array: T[]) => T[];

    export function values<V>(d: IDictionary<V>): V[];
    export function keys<V>(d: IDictionary<V>): string[];
    export function isEmpty<T>(array: T[]): Boolean;

    export function join(...input: any[]): any;
    export function groupBy(...input: any[]): any;
    export function concat(...input: any[]): any;
    export function last(...input: any[]): any;
    export function toLower(...input: any[]): any;
    export function contains(...input: any[]): any;
    export function pipe(...input: any[]): any;
    export function reduce(...input: any[]): any;
}

declare module 'papaparse' {
    export function parse(input: string): Promise<{data: string[][]}>;
    export function parse(input: string, options: any): Promise<{data: {[key: string]: string}}>;
}