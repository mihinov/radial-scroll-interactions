import Scrollbar from 'smooth-scrollbar';
import { DATA, IData } from './data';
import { gsap, Power1 } from 'gsap';
import { ModalPlugin } from './plugins/scroll-disable';

class MainApp {
	private contentNode: HTMLElement | null = document.querySelector('.content');
	private scrollbarNode: HTMLElement | null = document.querySelector('.scroll-menu__scrollbar');
	private navItemNodes: HTMLElement[] = Array.from(document.querySelectorAll('.nav__item'));
	private scrollMenuNode: HTMLElement | null = document.querySelector('.scroll-menu');
	private sideNode: HTMLElement | null = document.querySelector('.side');
	private verticalScrollbar: Scrollbar | null;
	private itemNodes: HTMLElement[] = [];
	private get constants() {
		return {
			SIZES: {
				MENU: {
					X: 5,
					Y: 40
				}
			}
		};
	};

	constructor() {
		if (this.contentNode !== null && this.sideNode !== null && this.scrollMenuNode !== null && this.scrollbarNode !== null) {
			this.verticalScrollbar = this.scrollBarInit(this.contentNode, this.scrollbarNode);
			this.itemNodes = this.generateList(this.verticalScrollbar.contentEl);
			this.animateItems(this.sideNode);
			this.initMenu(this.scrollMenuNode, this.navItemNodes, this.verticalScrollbar, this.itemNodes);
			this.initObserverScroll(this.verticalScrollbar, this.navItemNodes);
		} else {
			this.verticalScrollbar = null;
		}
	}

	private scrollBarInit(contentNode: HTMLElement, scrollbarNode: HTMLElement): Scrollbar {
		Scrollbar.use(ModalPlugin);
		const verticalScrollbar = Scrollbar.init(contentNode, {
			damping: 0.1,
			delegateTo: document,
		});
		verticalScrollbar.setPosition(0, 0);
		verticalScrollbar.track.yAxis.element.remove();
		verticalScrollbar.track.xAxis.element.remove();
		verticalScrollbar.updatePluginOptions('modal', { open: true });
		verticalScrollbar.addListener(({ offset }) => {
			const { clientHeight, scrollHeight } = verticalScrollbar.containerEl;
			const progress = Number.parseInt(
				((offset.y / (scrollHeight - clientHeight)) * 360).toFixed(0),
				10
			);

			const rotatePercentage = ((progress * (333 - 225)) / 360 + 225).toFixed(0);

			gsap.to(scrollbarNode, {
				transform: `rotate(${rotatePercentage}deg)`,
			});

		});

		return verticalScrollbar;
	}

	private generateList(scrollContentNode: HTMLElement) {
		const itemNodes = DATA.map(this.createItem);

		itemNodes.forEach(itemNode => scrollContentNode.appendChild(itemNode));
		scrollContentNode.classList.add(
			DATA.length % 2 === 0 ? 'scroll-content__even' : 'scroll-content__odd'
		);

		if (scrollContentNode.children.length === DATA.length) {
			gsap.to(scrollContentNode, {
				autoAlpha: 1,
				delay: 1
			});
		}

		return itemNodes;
	}

	private createItem(item: IData): HTMLElement {
		const itemNode = document.createElement('div');
		itemNode.classList.add('item');

		itemNode.innerHTML = `
			<div class="item__heading">
				<div class="item__title">${item.title}</div>
				<span class="item__order">${item.id}</span>
			</div>
			<div class="item__img-wrapper">
				<img class="item__img" src="${item.imgUrl}">
			</div>
		`;

		if (item.navId !== undefined) {
			itemNode.dataset['id'] = item.navId.toString();
		}

		return itemNode;
	}

	private animateItems(sideNode: HTMLElement) {
		gsap.to(sideNode.children, {
			stagger: 0.15,
			delay: 1,
			y: 0,
			autoAlpha: 1
		});
	}

	private initMenu(scrollMenuNode: HTMLElement, navItemNodes: HTMLElement[], verticalScrollbar: Scrollbar, itemNodes: HTMLElement[]) {
		const { X, Y } = this.constants.SIZES.MENU;

		gsap.to(scrollMenuNode, {
			delay: 0.8,
			autoAlpha: 1,
			ease: Power1.easeOut
		});

		navItemNodes.forEach((navItemNode, i) => {
			navItemNode as HTMLElement
			const tl = gsap.timeline();

			tl.to(navItemNode, {
				x: -1 * X * i,
				y: Y * i,
				duration: 0
			})
			.to(navItemNode, {
				stagger: 0.2,
				delay: 0.8,
				autoAlpha: 1,
				ease: Power1.easeOut
			})
			.then(() => verticalScrollbar.updatePluginOptions('modal', { open: false }));

			navItemNode.addEventListener('click', () => {
				const activeItemNode = itemNodes.find(({ dataset }) => dataset['id'] === navItemNode.dataset['id']);

				this.onMenuSelect(navItemNode, navItemNodes);

				if (activeItemNode !== undefined) {
					verticalScrollbar.scrollIntoView(activeItemNode, {
						onlyScrollIfNeeded: true
					});
				}

			});

		});


	}

	private onMenuSelect(selectedItemNode: HTMLElement, navItemNodes: HTMLElement[]) {
		const { X, Y } = this.constants.SIZES.MENU;

		this.toggleActiveById(selectedItemNode, navItemNodes);

		navItemNodes.forEach((navItemNode, i) => {
			if (selectedItemNode.dataset['id'] !== undefined) {
				const id = Number.parseInt(selectedItemNode.dataset['id'], 10);
				const index = i + 1;

				const currentItemYPos = Number(gsap.getProperty(navItemNode, "translateY"));
				const selectedItemYPos = Number(gsap.getProperty(selectedItemNode, "translateY"));

				const translateSteps = selectedItemYPos / Y;
				const translateValue = translateSteps * Y;

				gsap.to(navItemNode, {
					transform: `translate(
						${index < id ? -(X * (id - index)) : X * (id - index)}px,
						${currentItemYPos - translateValue}px
					)`,
					duration: 0.8,
					ease: Power1.easeOut,
				});
			}
		});
	}

	private toggleActiveById(selectedItemNode: HTMLElement, navItemNodes: HTMLElement[]) {
		for (const navItemNode of navItemNodes) {
			navItemNode.classList.remove('nav__item_active');
		}
		selectedItemNode.classList.add('nav__item_active');
	}

	private initObserverScroll(verticalScrollbar: Scrollbar, navItemNodes: HTMLElement[]) {
		const options = {
			root: verticalScrollbar.containerEl,
			rootMargin: "0px",
			threshold: 0.5,
		};

		const observer = new IntersectionObserver((entries, _) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const selectionItemNode = navItemNodes.find(
						({ dataset }) => dataset['id'] === (entry.target as HTMLElement).dataset['id']
					);

					if (Boolean(selectionItemNode) && selectionItemNode !== undefined) {
						this.onMenuSelect(selectionItemNode, navItemNodes);
					}
				}
			});
		}, options);

		verticalScrollbar.containerEl.querySelectorAll(".item").forEach((p) => {
			observer.observe(p);
		});
	}

}

new MainApp();
