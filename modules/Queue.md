[t-queues](../README.md) / [Exports](../modules.md) / Queue

# Namespace: Queue

## Table of contents

### Functions

- [empty](Queue.md#empty)
- [of](Queue.md#of)

## Functions

### empty

▸ **empty**<`T`\>(`comparator?`): [`Queue`](../interfaces/Queue.md)<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Invokable`](../modules.md#invokable)<`any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `comparator?` | (`a`: `T`, `b`: `T`) => `boolean` |

#### Returns

[`Queue`](../interfaces/Queue.md)<`T`\>

#### Defined in

[queue.ts:16](https://github.com/lammonaaf/t-queues/blob/46d7964/src/queue.ts#L16)

___

### of

▸ **of**<`T`\>(`tasks`, `comparator?`): [`Queue`](../interfaces/Queue.md)<`T`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`Invokable`](../modules.md#invokable)<`any`\> |

#### Parameters

| Name | Type |
| :------ | :------ |
| `tasks` | `T`[] |
| `comparator?` | (`a`: `T`, `b`: `T`) => `boolean` |

#### Returns

[`Queue`](../interfaces/Queue.md)<`T`\>

#### Defined in

[queue.ts:20](https://github.com/lammonaaf/t-queues/blob/46d7964/src/queue.ts#L20)
