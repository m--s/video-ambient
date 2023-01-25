export interface Pixel {
    r: number;
    g: number;
    b: number;
    index: string;
}

export interface VideoAmbientChangeProps {
    pixels: Pixel[];
    gradient: string;
}

export interface VideoAmbientProps {
    /** video element **/
    video: HTMLVideoElement;

    /** invisible canvas dimensions (size x size), higher value = more colors **/
    size?: number;

    /** gradient colors opacity **/
    opacity?: number;

    /** callback on ambient change **/
    onChange?: (props: VideoAmbientChangeProps) => void;

    /** mounting point for invisible canvas, by default document.body  **/
    mount?: HTMLElement;
    /** for own canvas  **/
    canvas?: HTMLCanvasElement;
}

export class VideoAmbient {
    private mount: HTMLElement;
    private _video: HTMLVideoElement;
    private canvas: HTMLCanvasElement;
    private size: number;
    private opacity: number;
    public onChange;
    public pixels = [];

    /**
     * @param {VideoAmbientProps} props
     */
    public constructor(props: VideoAmbientProps) {
        this.mount = props?.mount ?? document.querySelector('body');

        if (props.video) {
            this.video = props.video;
        } else {
            throw Error('Prop *video* is required');
        }

        this.size = props.size ?? 1;
        this.opacity = props.opacity ?? 1;
        this.canvas = props.canvas ?? this.createCanvas();
        this.onChange = props.onChange;
    }

    get video() {
        return this._video;
    }

    set video(newVideo) {
        this._video = newVideo;
        this.video.addEventListener("play", () => this.draw());
    }

    public createCanvas () {
        const canvas = document.createElement('canvas');
        canvas.style.opacity = '0';
        canvas.style.position = 'absolute';
        canvas.style.top = '-100vh';
        canvas.width = this.size;
        canvas.height = this.size;

        return this.mount.appendChild(canvas);
    }

    public getPixels() {
        const canvasContext = this.canvas?.getContext('2d');
        canvasContext.drawImage(this._video, 0, 0, this.canvas.width, this.canvas.height);

        const pixels = [];
        for (let height=0; height < this.canvas.height; height++) {
            for (let width=0; width < this.canvas.width; width++) {
                const pixel = canvasContext.getImageData(width, height, 1, 1);
                const r = pixel.data[0];
                const g = pixel.data[1];
                const b = pixel.data[2];

                pixels.push({
                    r, g, b,
                    index: `(${width}, ${height})`,
                });
            }
        }
        return pixels;
    }

    public draw(): void {
        if (!this._video || this._video.paused || this._video.ended) {
            return;
        }
        const currentPixels = this.getPixels();
        if (this.onChange && JSON.stringify(this.pixels) !== JSON.stringify(currentPixels)) {
            this.pixels = currentPixels;

            const gradientValue = this.pixels.map((pxl, i) => this.pixelConicGradientValue(pxl, i));
            this.onChange({
                data: this.pixels,
                gradient: `conic-gradient(${gradientValue});`
            })
        }

        requestAnimationFrame(() => {
            this.draw();
        });
    }

    private pixelConicGradientValue(pixel: Pixel, index: number) {
        return `rgba(${pixel.r}, ${pixel.g}, ${pixel.b}, ${this.opacity}) 0 ${(index+1) * (100/(this.size*this.size))}%`;
    }
}
