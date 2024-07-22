/* eslint-disable @typescript-eslint/naming-convention */
import * as http from 'http';

export function startTestServer(port: number, callback: (result: string) => void) {
	let server = http.createServer((req, res) => {
		if (req.url === '/test_mode' && req.method === 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk.toString();
			});
			req.on('end', () => {
				try {
					const jsonBody = JSON.parse(data);
					callback(jsonBody);
					// console.log(jsonBody);
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify({}));
				} catch (error) {
					res.writeHead(400, { 'Content-Type': 'text/plain' });
					res.end('Invalid JSON data');
				}
			});
		} else {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
		}
	});
	server.listen(port, () => {
		console.log(`Server for test is running on port ${port}`);
	}).on('error', (err) => {
		console.error(`Server failed to start on port ${port}. Error: ${err.message}`);
	});
}