import { h, Component, Fragment } from 'preact';

import { linkRef } from 'shared/prerendered-app/util';
import '../../custom-els/loading-spinner';
import logo from 'url:./imgs/logo.svg';
import githubLogo from 'url:./imgs/github-logo.svg';
import largePhoto from 'url:./imgs/demos/demo-large-photo.jpg';
import artwork from 'url:./imgs/demos/demo-artwork.jpg';
import deviceScreen from 'url:./imgs/demos/demo-device-screen.png';
import largePhotoIcon from 'url:./imgs/demos/icon-demo-large-photo.jpg';
import artworkIcon from 'url:./imgs/demos/icon-demo-artwork.jpg';
import deviceScreenIcon from 'url:./imgs/demos/icon-demo-device-screen.jpg';
import logoIcon from 'url:./imgs/demos/icon-demo-logo.png';
import logoWithText from 'data-url-text:./imgs/logo-with-text.svg';
import * as style from './style.css';
import type SnackBarElement from 'shared/custom-els/snack-bar';
import 'shared/custom-els/snack-bar';
import { startBlobs } from './blob-anim/meta';

const demos = [
  {
    description: 'Large photo',
    size: '2.8MB',
    filename: 'photo.jpg',
    url: largePhoto,
    iconUrl: largePhotoIcon,
  },
  {
    description: 'Artwork',
    size: '2.9MB',
    filename: 'art.jpg',
    url: artwork,
    iconUrl: artworkIcon,
  },
  {
    description: 'Device screen',
    size: '1.6MB',
    filename: 'pixel3.png',
    url: deviceScreen,
    iconUrl: deviceScreenIcon,
  },
  {
    description: 'SVG icon',
    size: '13KB',
    filename: 'squoosh.svg',
    url: logo,
    iconUrl: logoIcon,
  },
] as const;

const blobAnimImport =
  !__PRERENDER__ && matchMedia('(prefers-reduced-motion: reduce)').matches
    ? undefined
    : import('./blob-anim');

interface Props {
  onFile?: (file: File) => void;
  showSnack?: SnackBarElement['showSnackbar'];
}
interface State {
  fetchingDemoIndex?: number;
  beforeInstallEvent?: BeforeInstallPromptEvent;
  showBlobSVG: boolean;
  codecInfo: Record<string, string | null>;
  metricInfo: Record<string, string | null>;
}

export default class Intro extends Component<Props, State> {
  state: State = {
    showBlobSVG: true,
    codecInfo: {},
    metricInfo: {},
  };
  private fileInput?: HTMLInputElement;
  private blobCanvas?: HTMLCanvasElement;
  private installingViaButton = false;
  private introElement?: HTMLElement;

  componentDidMount() {
    // Listen for beforeinstallprompt events, indicating Squoosh is installable.
    window.addEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );

    // Listen for the appinstalled event, indicating Squoosh has been installed.
    window.addEventListener('appinstalled', this.onAppInstalled);

    if (blobAnimImport) {
      blobAnimImport.then((module) => {
        this.setState(
          {
            showBlobSVG: false,
          },
          () => module.startBlobAnim(this.blobCanvas!),
        );
      });
    }

    // @ts-ignore
    pywebview.api.checkCodec().then(codecInfo => this.setState({ codecInfo }));
    // @ts-ignore
    pywebview.api.checkMetric().then(metricInfo => this.setState({ metricInfo }));
    this.introElement = document.getElementById('intro')!;
    document.addEventListener('paste', this.onPaste);
  }

  componentWillUnmount() {
    window.removeEventListener(
      'beforeinstallprompt',
      this.onBeforeInstallPromptEvent,
    );
    window.removeEventListener('appinstalled', this.onAppInstalled);
    document.removeEventListener('paste', this.onPaste);
  }

  private onFileChange = (event: Event): void => {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    this.fileInput!.value = '';
    this.props.onFile!(file);
  };

  private onOpenClick = () => {
    this.fileInput!.click();
  };

  private onDemoClick = async (index: number, event: Event) => {
    try {
      this.setState({ fetchingDemoIndex: index });
      const demo = demos[index];
      const blob = await fetch(demo.url).then((r) => r.blob());
      const file = new File([blob], demo.filename, { type: blob.type });
      this.props.onFile!(file);
    } catch (err) {
      this.setState({ fetchingDemoIndex: undefined });
      this.props.showSnack!("Couldn't fetch demo image");
    }
  };

  private onBeforeInstallPromptEvent = (event: BeforeInstallPromptEvent) => {
    // Don't show the mini-infobar on mobile
    event.preventDefault();

    // Save the beforeinstallprompt event so it can be called later.
    this.setState({ beforeInstallEvent: event });
  };

  private onInstallClick = async (event: Event) => {
    // Get the deferred beforeinstallprompt event
    const beforeInstallEvent = this.state.beforeInstallEvent;
    // If there's no deferred prompt, bail.
    if (!beforeInstallEvent) return;

    this.installingViaButton = true;

    // Show the browser install prompt
    beforeInstallEvent.prompt();

    // Wait for the user to accept or dismiss the install prompt
    const { outcome } = await beforeInstallEvent.userChoice;

    // If the prompt was dismissed, we aren't going to install via the button.
    if (outcome === 'dismissed') {
      this.installingViaButton = false;
    }
  };

  private onAppInstalled = () => {
    // We don't need the install button, if it's shown
    this.setState({ beforeInstallEvent: undefined });

    // Don't log analytics if page is not visible
    if (document.hidden) return;

    // Clear the install method property
    this.installingViaButton = false;
  };

  private onPaste = (e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData?.files || []).find(e => e.type.startsWith('image/'));
    if (file) {
      this.props.onFile!(file);
    } else {
      this.props.showSnack!(`No image found in the clipboard`);
    }
  };

  private introScrollFrom: number = 0;
  private introScrollTo: number = 0;
  private introScrollProgress: number = 0;
  private introScrollLastTime: number = 0;
  private introScrollRaf: number = 0;

  private introScrollStep: FrameRequestCallback = time => {
    this.introScrollProgress = Math.max(0, Math.min(1, (this.introScrollProgress + (time - this.introScrollLastTime) / 150)));
    this.introElement!.scrollTop = this.introScrollFrom + (this.introScrollTo - this.introScrollFrom) * (x => 1 - Math.pow(1 - x, 2))(this.introScrollProgress);
    this.introScrollLastTime = time;
    if (this.introScrollProgress < 1) {
      this.introScrollRaf = requestAnimationFrame(this.introScrollStep);
    }
  };

  private onWheel = (e: WheelEvent) => {
    cancelAnimationFrame(this.introScrollRaf);
    this.introScrollFrom = this.introElement!.scrollTop;
    switch (e.deltaMode) {
      // DOM_DELTA_PIXEL
      case 0:
        this.introScrollTo += e.deltaY;
        break;
      // DOM_DELTA_LINE
      case 1:
        this.introScrollTo += 15 * e.deltaY;
        break;
      // DOM_DELTA_PAGE
      case 2:
        this.introScrollTo += .03 * e.deltaY;
        break;
    }
    this.introScrollTo = Math.max(0, Math.min(this.introElement!.scrollHeight - this.introElement!.clientHeight, this.introScrollTo));
    this.introScrollProgress = 0;
    this.introScrollLastTime = performance.now();
    this.introScrollRaf = requestAnimationFrame(this.introScrollStep);
    e.stopPropagation();
    e.preventDefault();
  };

  render(
    {}: Props,
    { fetchingDemoIndex, beforeInstallEvent, showBlobSVG, codecInfo, metricInfo }: State,
  ) {
    return (
      <div onWheel={this.onWheel}>
        <div class={style.main}>
          {!__PRERENDER__ && (
            <canvas
              ref={linkRef(this, 'blobCanvas')}
              class={style.blobCanvas}
            />
          )}
          <div class={style.mainContainer}>
            <h1 class={style.logoContainer}>
              <img
                class={style.logo}
                src={logoWithText}
                alt="Squoosh"
              />
            </h1>
            <div class={style.loadImg}>
              {showBlobSVG && (
                <svg
                  class={style.blobSvg}
                  viewBox="-1.25 -1.25 2.5 2.5"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {startBlobs.map((points) => (
                    <path
                      d={points
                        .map((point, i) => {
                          const nextI = i === points.length - 1 ? 0 : i + 1;
                          let d = '';
                          if (i === 0) {
                            d += `M${point[2]} ${point[3]}`;
                          }
                          return (
                            d +
                            `C${point[4]} ${point[5]} ${points[nextI][0]} ${points[nextI][1]} ${points[nextI][2]} ${points[nextI][3]}`
                          );
                        })
                        .join('')}
                    />
                  ))}
                </svg>
              )}
              <div
                class={style.loadImgContent}
                style={{ visibility: __PRERENDER__ ? 'hidden' : '' }}
              >
                <button class={style.loadBtn} onClick={this.onOpenClick}>
                  <svg viewBox="0 0 24 24" class={style.loadIcon}>
                    <path d="M19 7v3h-2V7h-3V5h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5a2 2 0 00-2 2v12c0 1.1.9 2 2 2h12a2 2 0 002-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z" />
                  </svg>
                </button>
                <div>
                  <span class={style.dropText}>Drop OR Paste</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        <div id="intro" class={style.intro}>
          <input
            class={style.hide}
            ref={linkRef(this, 'fileInput')}
            type="file"
            onChange={this.onFileChange}
          />
          <div class={style.demosContainer}>
            <svg viewBox="0 0 1920 140" class={style.topWave}>
              <path
                d="M1920 0l-107 28c-106 29-320 85-533 93-213 7-427-36-640-50s-427 0-533 7L0 85v171h1920z"
                class={style.subWave}
              />
              <path
                d="M0 129l64-26c64-27 192-81 320-75 128 5 256 69 384 64 128-6 256-80 384-91s256 43 384 70c128 26 256 26 320 26h64v96H0z"
                class={style.mainWave}
              />
            </svg>
            <div class={style.contentPadding}>
              <p class={style.demoTitle}>
                Or <strong>try one</strong> of these:
              </p>
              <ul class={style.demos}>
                {demos.map((demo, i) => (
                  <li>
                    <button
                      class="unbutton"
                      onClick={(event) => this.onDemoClick(i, event)}
                    >
                      <div class={style.demoContainer}>
                        <div class={style.demoIconContainer}>
                          <img
                            class={style.demoIcon}
                            src={demo.iconUrl}
                            alt={demo.description}
                          />
                          {fetchingDemoIndex === i && (
                            <div class={style.demoLoader}>
                              <loading-spinner />
                            </div>
                          )}
                        </div>
                        <div class={style.demoSize}>{demo.size}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div class={style.bottomWave}>
            <svg viewBox="0 0 1920 79" class={style.topWave}>
              <path
                d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
                class={style.infoWave}
              />
            </svg>
          </div>

          <footer class={style.footer}>
            <div class={style.footerContainer}>
              <svg viewBox="0 0 1920 79" class={style.topWave}>
                <path
                  d="M0 59l64-11c64-11 192-34 320-43s256-5 384 4 256 23 384 34 256 21 384 14 256-30 320-41l64-11v94H0z"
                  class={style.footerWave}
                />
              </svg>
              <div class={style.footerPadding}>
                <footer class={style.footerItems}>
                  <span
                    class={style.footerLink}
                  >
                    <span>Available native codecs:</span>
                    <br/>
                    {Object.entries(codecInfo).map(([k, v]) => <Fragment>
                        {' '}{
                          v
                            ? <abbr title={v} style="cursor:help">{k}</abbr>
                            : <span style="opacity:.5">{k}</span>
                        }
                    </Fragment>)}
                  </span>
                  <span
                    class={style.footerLink}
                  >
                    <span>Available metrics:</span>
                    <br/>
                    {Object.entries(metricInfo).map(([k, v]) => <Fragment>
                        {' '}<span style={{opacity: v ? '' : .5}}>{k}</span>
                    </Fragment>)}
                  </span>
                  <a
                    class={style.footerLinkWithLogo}
                    href="https://github.com/TransparentLC/squoosh-native"
                    target="_blank"
                  >
                    <img src={githubLogo} alt="" width="10" height="10" />
                    Source on Github
                  </a>
                </footer>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }
}
