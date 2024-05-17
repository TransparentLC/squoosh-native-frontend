import { EncodeOptions } from '../shared/meta';
import type WorkerBridge from 'client/lazy-app/worker-bridge';
import { h, Component } from 'preact';
import {
  inputFieldChecked,
  inputFieldValueAsNumber,
  preventDefault,
} from 'client/lazy-app/util';
import * as style from 'client/lazy-app/Compress/Options/style.css';
import Range from 'client/lazy-app/Compress/Options/Range';
import Checkbox from 'client/lazy-app/Compress/Options/Checkbox';

export function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
): Promise<Promise<ArrayBuffer>> {
  throw new Error('pngquant is not available.');
}

interface Props {
  options: EncodeOptions;
  onChange(newOptions: EncodeOptions): void;
}

export class Options extends Component<Props, {}> {
  onChange = (event: Event) => {
    const form = (event.currentTarget as HTMLInputElement).closest(
      'form',
    ) as HTMLFormElement;
    const { options } = this.props;

    const newOptions: EncodeOptions = {
      quality: inputFieldValueAsNumber(form.quality, options.quality),
      effort: inputFieldValueAsNumber(form.effort, options.effort),
      fs: inputFieldChecked(form.fs, options.fs),
      strip: inputFieldChecked(form.strip, options.strip),
    };
    this.props.onChange(newOptions);
  };

  render({ options }: Props) {
    return (
      <form class={style.optionsSection} onSubmit={preventDefault}>
        <div class={style.optionOneCell}>
          <Range
            name="quality"
            min="0"
            max="100"
            value={options.quality}
            onInput={this.onChange}
          >
            Quality:
          </Range>
        </div>
        <div class={style.optionOneCell}>
          <Range
            name="effort"
            min="1"
            max="11"
            value={options.effort}
            onInput={this.onChange}
          >
            Effort:
          </Range>
        </div>
        <label class={style.optionToggle}>
          Use Floyd-Steinberg dithering
          <Checkbox
            name="fs"
            checked={options.fs}
            onChange={this.onChange}
          />
        </label>
        <label class={style.optionToggle}>
          Remove optional metadata
          <Checkbox
            name="strip"
            checked={options.strip}
            onChange={this.onChange}
          />
        </label>
      </form>
    );
  }
}
