type UUIDTypes<TBuf extends Uint8Array = Uint8Array> = string | TBuf;
type Version1Options = {
    node?: Uint8Array;
    clockseq?: number;
    random?: Uint8Array;
    rng?: () => Uint8Array;
    msecs?: number;
    nsecs?: number;
    _v6?: boolean;
};
type Version4Options = {
    random?: Uint8Array;
    rng?: () => Uint8Array;
};
type Version6Options = Version1Options;
type Version7Options = {
    random?: Uint8Array;
    msecs?: number;
    seq?: number;
    rng?: () => Uint8Array;
};

declare const _default$1: "ffffffff-ffff-ffff-ffff-ffffffffffff";

declare const _default: "00000000-0000-0000-0000-000000000000";

declare function parse(uuid: string): Uint8Array;

declare function stringify(arr: Uint8Array, offset?: number): string;

declare function v1(options?: Version1Options, buf?: undefined, offset?: number): string;
declare function v1<Buf extends Uint8Array = Uint8Array>(options: Version1Options | undefined, buf: Buf, offset?: number): Buf;

declare function v1ToV6(uuid: string): string;
declare function v1ToV6(uuid: Uint8Array): Uint8Array;

declare function v3(value: string | Uint8Array, namespace: UUIDTypes, buf?: undefined, offset?: number): string;
declare function v3<TBuf extends Uint8Array = Uint8Array>(value: string | Uint8Array, namespace: UUIDTypes, buf: TBuf, offset?: number): TBuf;
declare namespace v3 {
    var DNS: string;
    var URL: string;
}

declare function v4(options?: Version4Options, buf?: undefined, offset?: number): string;
declare function v4<TBuf extends Uint8Array = Uint8Array>(options: Version4Options | undefined, buf: TBuf, offset?: number): TBuf;

declare function v5(value: string | Uint8Array, namespace: UUIDTypes, buf?: undefined, offset?: number): string;
declare function v5<TBuf extends Uint8Array = Uint8Array>(value: string | Uint8Array, namespace: UUIDTypes, buf: TBuf, offset?: number): TBuf;
declare namespace v5 {
    var DNS: string;
    var URL: string;
}

declare function v6(options?: Version6Options, buf?: undefined, offset?: number): string;
declare function v6<TBuf extends Uint8Array = Uint8Array>(options: Version6Options | undefined, buf: TBuf, offset?: number): TBuf;

declare function v6ToV1(uuid: string): string;
declare function v6ToV1(uuid: Uint8Array): Uint8Array;

declare function v7(options?: Version7Options, buf?: undefined, offset?: number): string;
declare function v7<TBuf extends Uint8Array = Uint8Array>(options: Version7Options | undefined, buf: TBuf, offset?: number): TBuf;

declare function validate(uuid: unknown): boolean;

declare function version(uuid: string): number;

export { _default$1 as MAX, _default as NIL, type UUIDTypes, type Version1Options, type Version4Options, type Version6Options, type Version7Options, parse, stringify, v1, v1ToV6, v3, v4, v5, v6, v6ToV1, v7, validate, version };
