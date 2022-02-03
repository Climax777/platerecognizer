import { config as dotenv } from 'dotenv';
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
        mmc: true,
        regions: ['za'],
        image: './test/mardu.jpeg',
    })
        .then((results) => {
            expect(results.version).toBe(expected_plate.version);
            expect(results.camera_id).toBe(expected_plate.camera_id);
            expect(results.results).toStrictEqual(
                expected_plate.results as [ReadPlatesResult]
            );
            done();
        })
        .catch(done);
});

test('Tests the plate recognizer statistics api', (done) => {
    const pr = new PlateRecognizer({
        apikey: process.env.PLATERECOGNIZER_API_KEY,
    });
    pr.Statistics()
        .then((results) => {
            expect(results).toBeDefined();
            done();
        })
        .catch(done);
});
