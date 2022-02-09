import { config as dotenv } from 'dotenv';
import { readFile } from 'fs/promises';
import { PlateRecognizer, ReadPlatesResults, ReadPlatesResult } from '.';

dotenv();

const expected_plate: ReadPlatesResults = {
    processing_time: 67.004,
    results: [
        {
            box: { xmin: 669, ymin: 510, xmax: 756, ymax: 566 },
            plate: '0kg913nw',
            region: { code: 'za', score: 0.836 },
            score: 0.853,
            candidates: [
                { score: 0.853, plate: '0kg913nw' },
                { score: 0.851, plate: 'okg913nw' },
                { score: 0.793, plate: 'qkg913nw' },
                { score: 0.747, plate: '0kg9i3nw' },
                { score: 0.746, plate: 'okg9i3nw' },
                { score: 0.688, plate: 'qkg9i3nw' },
            ],
            dscore: 0.796,
            vehicle: {
                score: 0.806,
                type: 'Sedan',
                box: { xmin: 578, ymin: 136, xmax: 1202, ymax: 602 },
            },
        },
    ],
    filename: '1410_aL3Pt_mardu.jpg',
    version: 1,
    camera_id: 'test_cam_1',
    timestamp: '2022-02-02T14:10:07.461423Z',
};

test('Tests the plate recognizer plate-reader api', (done) => {
    const pr = new PlateRecognizer({
        apikey: process.env.PLATERECOGNIZER_API_KEY,
    });
    pr.ReadPlates({
        camera_id: 'test_cam_1',
        mmc: false,
        regions: ['za'],
        image: './test/mardu.jpeg',
    })
        .then((results) => {
            expect(results.version).toBe(expected_plate.version);
            expect(results.camera_id).toBe(expected_plate.camera_id);
            expect(results.results).toHaveLength(1);
            done();
        })
        .catch(done);
}, 10000);

test('Tests the plate recognizer statistics api', (done) => {
    const pr = new PlateRecognizer({
        apikey: process.env.PLATERECOGNIZER_API_KEY,
    });
    pr.Statistics()
        .then((results) => {
            expect(results).toBeDefined();
            expect(results.total_calls).toBeGreaterThan(0);
            expect(results.usage.calls).toBeGreaterThan(0);
            done();
        })
        .catch(done);
});

describe('Tests different image input options', () => {
    const pr = new PlateRecognizer({
        apikey: process.env.PLATERECOGNIZER_API_KEY,
    });

    test('Image can be a buffer', async () => {
        const data = await readFile('./test/mardu.jpeg');

        const results = await pr.ReadPlates({
            camera_id: 'test_cam_1',
            mmc: false,
            regions: ['za'],
            image: data,
            imagePath: './test/mardu.jpeg',
        });
        expect(results.version).toBe(expected_plate.version);
        expect(results.camera_id).toBe(expected_plate.camera_id);
        expect(results.results).toHaveLength(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }, 10000);

    test('Image can be a filename', async () => {
        const results = await pr.ReadPlates({
            camera_id: 'test_cam_1',
            mmc: false,
            regions: ['za'],
            image: './test/mardu.jpeg',
        });
        expect(results.version).toBe(expected_plate.version);
        expect(results.camera_id).toBe(expected_plate.camera_id);
        expect(results.results).toHaveLength(1);
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }, 10000);
});

test('Tests multiple detection regions', async () => {
    const pr = new PlateRecognizer({
        apikey: process.env.PLATERECOGNIZER_API_KEY,
    });

    const results = await pr.ReadPlates({
        camera_id: 'test_cam_1',
        mmc: false,
        regions: ['za', 'sz', 'ls', 'zw', 'na'],
        image: './test/mardu.jpeg',
    });
    expect(results.version).toBe(expected_plate.version);
    expect(results.camera_id).toBe(expected_plate.camera_id);
    expect(results.results).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
}, 10000);
