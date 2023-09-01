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
        ? (baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL) +
              '/' +
              relativeURL.replace(/^\/+/, '')
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
    /** List of regions to match the license plate patter of. */
    regions?: Array<string>;
    /** The image to upload. */
    image: PathLike | Buffer;
    /** The path of the image. */
    imagePath?: PathLike;
    /** Whether to predict the vehicle model, make, orientation and color. */
    mmc?: boolean;
    /** Unique camera identifier. */
    camera_id?: string;
}

export interface DetectionBox {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}

export interface RegionResult {
    /** Region of the license plate. */
    code: string;
    /** Confidence level for license plate region. */
    score: number;
}

export interface VehicleResult {
    /** Vehicle type prediction. */
    type: string;
    /** Confidence level for vehicle type prediciton. Set to 0 if no vehicle is found. */
    score: number;
    /** Bounding box for the vehicle. */
    box: DetectionBox;
}

export interface ModelMakeResult {
    /** Vehicle make prediction. */
    make: string;
    /** Vehicle model prediction. */
    model: string;
    /** Confidence level for vehicle make and model prediction. */
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
    /** Vehicle color prediction. */
    color: VehicleColor;
    /** Confidence level for vehicle color prediction. */
    score: number;
}
export type Orientation = 'Front' | 'Rear' | 'Unknown' | string;
export interface OrientationResult {
    /** The vehicle's predicted orientation. `'Front'`, `'Rear'` or '`Unknown`'. */
    orientation: Orientation;
    /** Confidence level for vehicle orientation prediction. */
    score: number;
}

export interface PlateCandidate {
    /** Text of the license plate. */
    plate: string;
    /** Confidence level for reading the license plate text. A fraction between 0 and 1. */
    score: number;
}

export interface ReadPlatesResult {
    box: DetectionBox;
    /** Text of the license plate. */
    plate: string;
    /** License plate region result. */
    region?: RegionResult;
    /** License plate vehicle result. */
    vehicle?: VehicleResult;
    /** Confidence level for reading the license plate text. A fraction between 0 and 1. */
    score: number;
    /** List of predictions for the license plate value. The first element is the top prediction. */
    candidates: Array<PlateCandidate>;
    /** Confidence level for plate detection. A fraction between 0 and 1. */
    dscore: number;
    /** Vehicle model and make result. */
    model_make?: Array<ModelMakeResult>;
    /** Vehicle color result. */
    color?: Array<ColorResult>;
    /** Vehicle orientation result. */
    orientation?: Array<OrientationResult>;
}
export interface ReadPlatesResults {
    processing_time: number;
    timestamp: string;
    version: number;
    camera_id?: string;
    filename: string;
    /** List of license plate results. */
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

        if (options.regions === undefined)
            options.regions = this._config.defaultRegions;
        for (const key of options.regions) {
            fd.append('regions', key);
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
