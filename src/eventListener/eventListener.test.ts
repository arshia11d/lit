import { eventListener, Component, component, html, FullEventListenerDecoratorOptions, queryAsync } from '../index.js'
import { ComponentTestFixture } from '../../test/ComponentTestFixture.js'
import { extractEventTarget } from './eventListenerExtension.js'

abstract class EventListenerTestComponent extends Component {
	readonly fakeCall = jasmine.createSpy('fakeCall')
	handlerThis!: this
	handlerEvent!: Event
	handleEvent(e: Event) {
		this.fakeCall()
		this.handlerEvent = e
		this.handlerThis = this
	}

	@queryAsync('ul') readonly ul!: Promise<HTMLUListElement>

	override get template() {
		return html`
			<ul>
				<li>One</li>
				<li>Two</li>
				<li>Three</li>
			</ul>
		`
	}
}

describe('@eventListener()', () => {
	describe('used as method', () => {
		@component('lit-test-event-listener-used-as-method')
		class TestComponent extends EventListenerTestComponent {
			@eventListener('click')
			protected handleClick(e: Event) {
				super.handleEvent(e)
			}
		}

		const fixture = new ComponentTestFixture(() => new TestComponent())
		test({ fixture })
	})

	describe('used as arrow function', () => {
		@component('lit-test-event-listener-used-as-arrow-function')
		class TestComponent extends EventListenerTestComponent {
			@eventListener('click')
			protected handleClick = (e: Event) => super.handleEvent(e)
		}
		const fixture = new ComponentTestFixture(() => new TestComponent())
		test({ fixture })
	})

	describe('used on custom target', () => {
		const target = window

		@component('lit-test-event-listener-used-on-custom-target')
		class TestComponent extends EventListenerTestComponent {
			@eventListener({ target, type: 'click' })
			protected handleClick(e: Event) {
				super.handleEvent(e)
			}
		}

		const fixture = new ComponentTestFixture(() => new TestComponent())
		test({ fixture, target })
	})

	describe('used on custom target getter', () => {
		function target(this: EventListenerTestComponent) {
			return this.ul
		}

		@component('lit-test-event-listener-used-on-custom-target-getter')
		class TestComponent extends EventListenerTestComponent {
			@eventListener({ target, type: 'click' })
			protected handleClick(e: Event) {
				super.handleEvent(e)
			}
		}

		const fixture = new ComponentTestFixture(() => new TestComponent())
		test({ fixture, target })
	})

	function test(specs: {
		fixture: ComponentTestFixture<EventListenerTestComponent>
		event?: Event
		target?: FullEventListenerDecoratorOptions[0]['target']
	}) {
		const event = specs.event ?? new PointerEvent('click')

		beforeEach(async () => {
			const target = await extractEventTarget.call(specs.fixture.component, specs.target)
			target.dispatchEvent(event)
		})

		it('calls the method', () => expect(specs.fixture.component.fakeCall).toHaveBeenCalled())
		it('bounds the method to the component', () => expect(specs.fixture.component.handlerThis).toBe(specs.fixture.component))
		it('passes the event as the first argument', () => expect(specs.fixture.component.handlerEvent).toBe(event))
	}
})