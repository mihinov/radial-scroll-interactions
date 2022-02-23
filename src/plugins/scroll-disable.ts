import { ScrollbarPlugin } from "smooth-scrollbar";
import { Data2d } from 'smooth-scrollbar/interfaces';

interface DefaultOptions {
	open: boolean;
}

export class ModalPlugin extends ScrollbarPlugin {
  static override pluginName: string = "modal";

  static override defaultOptions: DefaultOptions = {
    open: false,
  };

  override transformDelta(delta: Data2d): Data2d {
    return this.options.open ? { x: 0, y: 0 } : delta;
  }
}
