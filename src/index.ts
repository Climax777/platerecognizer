import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import type { PathLike } from 'fs';
import { defaults } from 'lodash';
import debug from 'debug';

const logger = debug('platerecognizer');

export const DEFAULT_URI = 'https://api.platerecognizer.com/v1';
function combineURLs(baseURL: string, relativeURL: string): string {
    return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
}

export type AvailableRegions = 'za' | 'us-ca';

export interface PlateRecognizerConfig {
    apikey: string;
    url?: string;
    defaultRegions?: Array<AvailableRegions | string>;
    timeout?: number;
}

export interface ReadPlatesOptions {
    regions?: Array<string>;
    image: PathLike | Buffer;
    imagePath?: PathLike;
    mmc?: boolean;
    camera_id?: string;
}

export interface DetectionBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

export interface RegionResult {
    code: string;
    score: number;
}

export interface VehicleResult {
    type: string;
    score: number;
    box: DetectionBox;
}

export interface ModelMakeResult {
    make: string;
    model: string;
    score: number;
}

export type VehicleColor =
    | 'black'
    | 'blue'
    | 'brown'
    | 'green'
    | 'red'
    | 'silver'
    | 'white'
    | 'yellow'
    | 'unknown'
    | string;

export interface ColorResult {
    color: VehicleColor;
    score: number;
}
export type Orientation = 'Front' | 'Rear' | 'Unknown' | string;
export interface OrientationResult {
    orientation: Orientation;
    score: number;
}

export interface PlateCandidate {
    plate: string;
    score: number;
}

export interface ReadPlatesResult {
    box: DetectionBox;
    plate: string;
    region?: RegionResult;
    vehicle?: VehicleResult;
    score: number;
    candidates: Array<PlateCandidate>;
    dscore: number;
    model_make?: Array<ModelMakeResult>;
    color?: Array<ColorResult>;
    orientation?: Array<OrientationResult>;
}
export interface ReadPlatesResults {
    processing_time: number;
    timestamp: string;
    version: number;
    camera_id?: string;
    filename: string;
    results: Array<ReadPlatesResult>;
}

export interface UsageResults {
    month: number;
    calls: number;
    year: number;
    resets_on: string;
}

export interface StatisticResults {
    usage: UsageResults;
    total_calls: number;
}

class PlateRecognizer {
    constructor(config: PlateRecognizerConfig) {
        this._config = config;
        defaults(this._config, {
            url: DEFAULT_URI,
            timeout: 10000,
        });
        this._axios = axios.create({
            baseURL: this._config.url,
            timeout: this._config.timeout,
        });
        this._axios.defaults.headers.common[
            'Authorization'
        ] = `Token ${this._config.apikey}`;
        logger('Platerecognizer configured');
    }

    public async ReadPlates(
        options: ReadPlatesOptions
    ): Promise<ReadPlatesResults> {
        const fd = new FormData();
        if (options.image instanceof Buffer) {
            fd.append('upload', options.image, {
                filename: options.imagePath
                    ? options.imagePath.toString()
                    : 'upload.jpg',
            });
        } else {
            fd.append('upload', createReadStream(options.image));
        }
        if (options.mmc) fd.append('mmc', 'true');
        if (options.regions === undefined) {
            for (const key of this._config.defaultRegions) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        this._config.defaultRegions,
                        key
                    )
                ) {
                    const element = this._config.defaultRegions[key];
                    fd.append('regions', element);
                }
            }
        }
        if (options.camera_id !== undefined && options.camera_id.length > 0)
            fd.append('camera_id', options.camera_id);
        const uri = combineURLs(this._config.url, '/plate-reader');
        logger(`plate-reader opening to ${uri}`);
        try {
            const response = await this._axios.post(uri, fd, {
                headers: fd.getHeaders(),
            });
            logger(`plate-reader: ${response.statusText}`);
            const finalValue: ReadPlatesResults =
                response.data as ReadPlatesResults;
            logger(`plate-reader got final value: \r\n%O`, finalValue);
            return finalValue;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger(`plate-reader axios error: %O`, error);
            } else {
                logger(`plate-reader unknown error: %O`, error);
            }
            throw error;
        }
    }

    public async Statistics(): Promise<StatisticResults> {
        const uri = combineURLs(this._config.url, '/statistics');
        logger(`statistics opening to ${uri}`);
        try {
            const response = await this._axios.get(uri);
            const finalValue: StatisticResults =
                response.data as StatisticResults;
            logger(`statistics got final value: \r\n%O`, finalValue);
            return finalValue;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                logger(`statistics axios error: %O`, error);
            } else {
                logger(`statistics unknown error: %O`, error);
            }
            throw error;
        }
    }

    private _config: PlateRecognizerConfig;
    private _axios: AxiosInstance;
}

export { PlateRecognizer };
