import { directive, AsyncDirective, type ElementPart, type PartInfo, PartType, AttributePart, BooleanAttributePart, PropertyPart, ReactiveElement, DirectiveResult, noChange } from '../index.js'
import '@a11d/key-path'
import { ValueBinder } from './ValueBinder.js'
import { PropertyValueBinder } from './PropertyValueBinder.js'
import { DefaultPropertyBinder } from './DefaultPropertyBinder.js'

export enum BindingMode {
	/**
	 * Indicates a one-way binding from the data source to the target property.
	 * This is the default mode when the source is read-only.
	 */
	OneWay = 'one-way',
	/**
	 * Indicates a two-way binding between the data source and the target property.
	 * This is the default mode when neither the source nor target is read-only.
	 */
	TwoWay = 'two-way',
	/**
	 * Indicates a one-way binding from the target property to the data source.
	 * This is the default mode when the target is read-only.
	 */
	OneWayToSource = 'one-way-to-source',
}

export type BindDirectiveParameters<Component extends ReactiveElement, Property extends keyof Component> = [
	component: Component,
	property: Property,
	options?: BindDirectiveParametersOptions<Component[Property]>
]

export type BindDirectiveParametersOptions<Data> = {
	keyPath?: KeyPathOf<Data>
	mode?: BindingMode
	event?: string
	sourceUpdate?: (value: Data) => void
	sourceUpdated?: (value: Data) => void
	dispatchSourceAssociatedEvent?: boolean
}

type BindDirectivePart = ElementPart | AttributePart | BooleanAttributePart | PropertyPart

class BindDirective<Component extends ReactiveElement, Property extends keyof Component> extends AsyncDirective {
	#valueBinder?: ValueBinder<BindDirectivePart>

	constructor(partInfo: PartInfo) {
		super(partInfo)
		if (partInfo.type === PartType.CHILD || partInfo.type === PartType.EVENT) {
			throw new Error('The `bind` directive cannot be used in child or event bindings')
		}
	}

	render() {
		return this.#valueBinder?.template ?? noChange
	}

	override update(part: BindDirectivePart, parameters: BindDirectiveParameters<Component, Property>) {
		if (!this.#valueBinder) {
			this.#valueBinder = [PartType.PROPERTY, PartType.BOOLEAN_ATTRIBUTE, PartType.ATTRIBUTE].includes(part.type as any)
				? new PropertyValueBinder(part as any, parameters)
				: new DefaultPropertyBinder(part as any, parameters)
			this.#valueBinder.connected()
		}
		this.#valueBinder.parameters = parameters

		return super.update(part, parameters)
	}

	override disconnected() {
		this.#valueBinder?.disconnected()
	}

	override reconnected() {
		this.#valueBinder?.connected()
	}
}

export const bind = <Component extends ReactiveElement, Property extends keyof Component>(...parameters: BindDirectiveParameters<Component, Property>) => {
	return (directive(BindDirective) as any)(...parameters) as DirectiveResult<typeof BindDirective<Component, Property>>
}