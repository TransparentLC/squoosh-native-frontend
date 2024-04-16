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
import Select from 'client/lazy-app/Compress/Options/Select';

export function encode(
  signal: AbortSignal,
  workerBridge: WorkerBridge,
  imageData: ImageData,
  options: EncodeOptions,
): Promise<Promise<ArrayBuffer>> {
  throw new Error('cjpegli is not available.');
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
      subsample: inputFieldValueAsNumber(form.subsample, options.subsample),
      xyb: inputFieldChecked(form.xyb, options.xyb),
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
        <label class={style.optionTextFirst}>
          Subsample chroma:
          <Select
            name="subsample"
            value={options.subsample}
            onChange={this.onChange}
          >
            <option value="0">4:2:0</option>
            <option value="1">4:2:2</option>
            <option value="2">4:4:0</option>
            <option value="3">4:4:4</option>
          </Select>
        </label>
        <label class={style.optionToggle}>
          Use XYB colorspace
          <Checkbox
            name="xyb"
            checked={options.xyb}
            onChange={this.onChange}
          />
        </label>
      </form>
    );
  }
}
