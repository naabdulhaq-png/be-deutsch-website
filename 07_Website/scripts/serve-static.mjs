import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const args = new Map(process.argv.slice(2).map((value, index, values) => value.startsWith('--') ? [value, values[index + 1]] : null).filter(Boolean));
const root = path.resolve(args.get('--root') ?? 'dist');
const port = Number(args.get('--port') ?? 4333);
const mime = new Map([
  ['.html', 'text/html; charset=utf-8'], ['.css', 'text/css; charset=utf-8'], ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'], ['.svg', 'image/svg+xml'], ['.png', 'image/png'], ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'], ['.webp', 'image/webp'], ['.mp3', 'audio/mpeg'], ['.webmanifest', 'application/manifest+json'],
]);

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const requested = path.resolve(root, `.${pathname}`);
    if (requested !== root && !requested.startsWith(`${root}${path.sep}`)) throw new Error('Path outside static root');
    let file = requested;
    let info;
    try { info = await stat(file); } catch { info = null; }
    if (info?.isDirectory()) file = path.join(file, 'index.html');
    else if (!info && !path.extname(file)) file = path.join(file, 'index.html');
    try { info = await stat(file); } catch { info = null; }
    if (!info?.isFile()) {
      response.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      createReadStream(path.join(root, '404.html')).pipe(response);
      return;
    }
    response.writeHead(200, { 'content-type': mime.get(path.extname(file).toLowerCase()) ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
  }
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} at http://127.0.0.1:${port}/`));
