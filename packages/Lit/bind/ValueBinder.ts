import { Part } from 'lit'
import { BindDirectiveParameters, BindingMode } from './BindDirective.js'
import { getAssociatedEvent } from './associatedEvent/getAssociatedEvent.js'
import { bindingIntegrations } from './BindingIntegration.js'

export abstract class ValueBinder<TPart extends Part = any> {
	abstract get element(): Element
	abstract get property(): string

	constructor(protected readonly part: TPart, public parameters: BindDirectiveParameters<any, any>) { }

	get component() {
		return this.parameters[0]
	}

	get sourceKey() {
		return this.parameters[1]
	}

	get keyPath() {
		return this.parameters[2]?.keyPath
	}

	get sourceUpdate() {
		return this.parameters[2]?.sourceUpdate
	}

	get sourceUpdated() {
		return this.parameters[2]?.sourceUpdated
	}

	get mode() {
		const mode = this.parameters[2]?.mode

		if (mode) {
			return mode
		}

		const sourceWritable = this.keyPath
			? KeyPath.isWritable(this.component[this.sourceKey], this.keyPath)
			: Object.isWritable(this.component, this.sourceKey)

		const targetWritable = Object.isWritable(this.component, this.property)

		return sourceWritable && targetWritable
			? BindingMode.TwoWay
			: sourceWritable
				? BindingMode.OneWayToSource
				: BindingMode.OneWay
	}

	get event() {
		return this.parameters[2]?.event ?? getAssociatedEvent(this.element, this.property)
	}

	get source() { return this.component[this.sourceKey] }
	set source(value) { this.component[this.sourceKey] = value }

	get sourceValue() {
		return this.keyPath
			? KeyPath.get(this.source, this.keyPath as string)
			: this.source
	}
	set sourceValue(value: unknown) {
		if (this.mode !== BindingMode.OneWay) {
			this.keyPath
				? KeyPath.set(this.source, this.keyPath as string, value)
				: this.source = value

			for (const integration of bindingIntegrations) {
				integration.bind(this)
			}
		}
	}

	abstract get template(): unknown

	connected() {
		if (this.mode !== BindingMode.OneWay) {
			this.element.addEventListener(this.event, this.eventListener)
		}
	}

	disconnected() {
		this.element.removeEventListener(this.event, this.eventListener)
	}

	private readonly eventListener = (e: Event) => {
		const value = e instanceof CustomEvent
			? e.detail
			: (e.target as any)[this.property]
		this.sourceUpdate?.call(this.component, value)
		this.sourceValue = value
		this.component.requestUpdate(this.sourceKey)
		this.sourceUpdated?.call(this.component, value)
	}
}