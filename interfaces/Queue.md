[t-queues](../README.md) / [Exports](../modules.md) / Queue

# Interface: Queue<T\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Invokable`](../modules.md#invokable)<`any`\> |

## Table of contents

### Properties

- [length](Queue.md#length)

### Methods

- [clear](Queue.md#clear)
- [push](Queue.md#push)
- [shift](Queue.md#shift)
- [unshift](Queue.md#unshift)

## Properties

### length

• `Readonly` **length**: `number`

#### Defined in

[queue.ts:12](https://github.com/lammonaaf/t-queues/blob/8675749/src/queue.ts#L12)

## Methods

### clear

▸ **clear**(): `void`

#### Returns

`void`

#### Defined in

[queue.ts:10](https://github.com/lammonaaf/t-queues/blob/8675749/src/queue.ts#L10)

___

### push

▸ **push**(...`tasks`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...tasks` | `T`[] |

#### Returns

`number`

#### Defined in

[queue.ts:6](https://github.com/lammonaaf/t-queues/blob/8675749/src/queue.ts#L6)

___

### shift

▸ **shift**(): `void`

#### Returns

`void`

#### Defined in

[queue.ts:9](https://github.com/lammonaaf/t-queues/blob/8675749/src/queue.ts#L9)

___

### unshift

▸ **unshift**(...`tasks`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `...tasks` | `T`[] |

#### Returns

`number`

#### Defined in

[queue.ts:7](https://github.com/lammonaaf/t-queues/blob/8675749/src/queue.ts#L7)
