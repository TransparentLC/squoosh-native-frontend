import { h, Component, Fragment } from 'preact';

import * as style from './style.css';
import 'add-css:./style.css';
import 'shared/custom-els/loading-spinner';
import { SourceImage } from '../';
import prettyBytes from './pretty-bytes';
import { Arrow, DownloadIcon } from 'client/lazy-app/icons';

interface Props {
  loading: boolean;
  source?: SourceImage;
  imageFile?: File;
  downloadUrl?: string;
  metrics?: {[K in typeof metrics[number]]?: number;};
  flipSide: boolean;
  typeLabel: string;
}

interface State {
  showLoadingState: boolean;
}

const loadingReactionDelay = 500;

const metricNamesMapping: {[K in typeof metrics[number]]: string;} = {
  dssim: 'DSSIM',
  butteraugli: 'Butteraugli',
  ssimulacra2: 'SSIMULACRA2',
};

const metricLevelMapping: {[K in typeof metrics[number]]?: { range: number, level: string }[];} = {
  // dssim: [],
  // https://github.com/google/guetzli/blob/214f2bb42abf5a577c079d00add5d6cc470620d3/guetzli/quality.cc#L26
  butteraugli: [
    { range: 2.810761 + Number.EPSILON, level: 'JPEG quality <70' },
    { range: 2.810761, level: 'JPEG quality 70' },
    { range: 2.7293, level: 'JPEG quality 71' },
    { range: 2.689687, level: 'JPEG quality 72' },
    { range: 2.636811, level: 'JPEG quality 73' },
    { range: 2.547863, level: 'JPEG quality 74' },
    { range: 2.5254, level: 'JPEG quality 75' },
    { range: 2.473416, level: 'JPEG quality 76' },
    { range: 2.366133, level: 'JPEG quality 77' },
    { range: 2.338078, level: 'JPEG quality 78' },
    { range: 2.318654, level: 'JPEG quality 79' },
    { range: 2.201674, level: 'JPEG quality 80' },
    { range: 2.145517, level: 'JPEG quality 81' },
    { range: 2.087322, level: 'JPEG quality 82' },
    { range: 2.009328, level: 'JPEG quality 83' },
    { range: 1.945456, level: 'JPEG quality 84' },
    { range: 1.900112, level: 'JPEG quality 85' },
    { range: 1.805701, level: 'JPEG quality 86' },
    { range: 1.750194, level: 'JPEG quality 87' },
    { range: 1.644175, level: 'JPEG quality 88' },
    { range: 1.562165, level: 'JPEG quality 89' },
    { range: 1.473608, level: 'JPEG quality 90' },
    { range: 1.382021, level: 'JPEG quality 91' },
    { range: 1.294298, level: 'JPEG quality 92' },
    { range: 1.185402, level: 'JPEG quality 93' },
    { range: 1.066781, level: 'JPEG quality 94' },
    { range: 0.971769, level: 'JPEG quality 95' },
    { range: 0.852901, level: 'JPEG quality 96' },
    { range: 0.724544, level: 'JPEG quality 97' },
    { range: 0.611302, level: 'JPEG quality 98' },
    { range: 0.443185, level: 'JPEG quality 99' },
    { range: 0.211578, level: 'JPEG quality 100' },
    { range: -Infinity, level: 'JPEG quality >100' },
  ],
  // https://github.com/cloudinary/ssimulacra2#usage
  ssimulacra2: [
    { range: 100, level: 'Mathematically lossless' },
    { range: 90, level: 'Visually lossless' },
    { range: 85, level: 'Excellent quality' },
    { range: 80, level: 'Very high quality' },
    { range: 70, level: 'High quality' },
    { range: 50, level: 'Medium quality' },
    { range: 30, level: 'Low quality' },
    { range: 10, level: 'Very low quality' },
    { range: -Infinity, level: 'Extremely low quality' },
  ],
};

export default class Results extends Component<Props, State> {
  state: State = {
    showLoadingState: this.props.loading,
  };

  /** The timeout ID between entering the loading state, and changing UI */
  private loadingTimeoutId: number = 0;

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.loading && !this.props.loading) {
      // Just stopped loading
      clearTimeout(this.loadingTimeoutId);
      this.setState({ showLoadingState: false });
    } else if (!prevProps.loading && this.props.loading) {
      // Just started loading
      this.loadingTimeoutId = self.setTimeout(
        () => this.setState({ showLoadingState: true }),
        loadingReactionDelay,
      );
    }
  }

  private writeImageFile = async () => {
    if (this.state.showLoadingState) return;
    const path = await pywebview.api.fileDialog({
      dialog_type: 30,
      allow_multiple: false,
      save_filename: this.props.imageFile ? this.props.imageFile.name : '',
      file_types: this.props.imageFile ? [`Image file (*.${(this.props.imageFile.name.match(/(?:\.([^.]+))?$/) || ['', '*'])[1]})`] : undefined,
    });
    if (path === null || (Array.isArray(path) && !path.length)) return;
    const buffer = await fetch(this.props.downloadUrl!).then(r => r.arrayBuffer());
    await pywebview.api.writeFile(Array.isArray(path) ? path[0] : path, new Uint8Array(buffer));
  }

  render(
    { source, imageFile, downloadUrl, metrics, flipSide, typeLabel }: Props,
    { showLoadingState }: State,
  ) {
    const prettySize = imageFile && prettyBytes(imageFile.size);
    const isOriginal = !source || !imageFile || source.file === imageFile;
    let diff;
    let percent;

    if (source && imageFile) {
      diff = imageFile.size / source.file.size;
      const absolutePercent = Math.round(Math.abs(diff) * 100);
      percent = diff > 1 ? absolutePercent - 100 : 100 - absolutePercent;
    }

    const hoverTitleLines: string[] = [];
    if (imageFile) {
      hoverTitleLines.push(`Size: ${imageFile.size} Bytes`);
      if (metrics === null) {
        // Source image, no metrics
      } else if (metrics === undefined) {
        hoverTitleLines.push('(Calculating quality metrics)');
      } else {
        Object.entries(metrics).forEach(([k, v]) => {
          if (v === null) return;
          let line = `${metricNamesMapping[k as keyof typeof metrics]}: ${v.toPrecision(6)}`;
          if (metricLevelMapping[k as keyof typeof metrics]) {
            line += ` (${metricLevelMapping[k as keyof typeof metrics]!.find(e => e.range <= v)!.level})`;
          }
          hoverTitleLines.push(line);
        });
      }
    }

    return (
      <div
        class={
          (flipSide ? style.resultsRight : style.resultsLeft) +
          ' ' +
          (isOriginal ? style.isOriginal : '')
        }
      >
        <div class={style.expandArrow}>
          <Arrow />
        </div>
        <div class={style.bubble} title={hoverTitleLines.join('\n')}>
          <div class={style.bubbleInner}>
            <div class={style.sizeInfo}>
              <div class={style.fileSize}>
                {prettySize ? (
                  <Fragment>
                    {prettySize.value}{' '}
                    <span class={style.unit}>{prettySize.unit}</span>
                    <span class={style.typeLabel}> {typeLabel}</span>
                  </Fragment>
                ) : (
                  '…'
                )}
              </div>
            </div>
            <div class={style.percentInfo}>
              <svg
                viewBox="0 0 1 2"
                class={style.bigArrow}
                preserveAspectRatio="none"
              >
                <path d="M1 0v2L0 1z" />
              </svg>
              <div class={style.percentOutput}>
                {diff && diff !== 1 && (
                  <span class={style.sizeDirection}>
                    {diff < 1 ? '↓' : '↑'}
                  </span>
                )}
                <span class={style.sizeValue}>{percent || 0}</span>
                <span class={style.percentChar}>%</span>
              </div>
            </div>
          </div>
        </div>
        <span
          class={showLoadingState ? style.downloadDisable : style.download}
          onClick={this.writeImageFile}
          title="Download"
        >
          <svg class={style.downloadBlobs} viewBox="0 0 89.6 86.9">
            <title>Download</title>
            <path d="M27.3 72c-8-4-15.6-12.3-16.9-21-1.2-8.7 4-17.8 10.5-26s14.4-15.6 24-16 21.2 6 28.6 16.5c7.4 10.5 10.8 25 6.6 34S64.1 71.8 54 73.6c-10.2 2-18.7 2.3-26.7-1.6z" />
            <path d="M19.8 24.8c4.3-7.8 13-15 21.8-15.7 8.7-.8 17.5 4.8 25.4 11.8 7.8 6.9 14.8 15.2 14.7 24.9s-7.1 20.7-18 27.6c-10.8 6.8-25.5 9.5-34.2 4.8S18.1 61.6 16.7 51.4c-1.3-10.3-1.3-18.8 3-26.6z" />
          </svg>
          <div class={style.downloadIcon}>
            <DownloadIcon />
          </div>
          {showLoadingState && <loading-spinner />}
        </span>
      </div>
    );
  }
}
