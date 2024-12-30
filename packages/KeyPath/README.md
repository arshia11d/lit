# KeyPath

A set of type-safe utilities for working with objects and their properties with support for array members.

- `KeyPath.of` - A type-safe function to get a key-path.
- `KeyPath.get` - A function to extract the value by a given key-path.
- `KeyPath.set` - A function to set the value by a given key-path.
- `KeyPath.isWritable` - A function to check if a key-path is writable.

```ts
const customer = {
	name: 'John Doe',
	addresses: [
		{ street: '123 Main St', city: 'Anytown' },
		{ street: '456 Elm St', city: 'Anytown' },
	] as const,
}

const keyPath = KeyPath.of<typeof customer>('addresses.0.street') // 'addresses.0.street'
const value = KeyPath.get(customer, 'addresses.0.street') // '123 Main St'
KeyPath.set(customer, 'addresses.0.street', '180 Azadi St')
/*
{
	name: 'John Doe',
	addresses: [
		{ street: '180 Azadi St', city: 'Anytown' },
		{ street: '456 Elm St', city: 'Anytown' },
	] as const,
}
*/
```